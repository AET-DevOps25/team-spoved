import os
import io
import tempfile
import subprocess
import wave
import struct
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google.cloud import speech
from google.cloud import texttospeech
from google.oauth2 import service_account
import google.generativeai as genai
from dotenv import load_dotenv
from pydub import AudioSegment
from ticket_generator.api.utils import get_auth_headers, extract_token_from_header
from typing import Optional
from prometheus_client import Counter, Histogram

load_dotenv()

router = APIRouter()

# Initialize Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise Exception("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Google Cloud credentials
try:
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not credentials_path:
        raise Exception("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
    
    credentials = service_account.Credentials.from_service_account_file(
        credentials_path
    )
    speech_client = speech.SpeechClient(credentials=credentials)
    tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
except Exception as e:
    print(f"[ERROR] Could not initialize Google Cloud clients: {e}")
    speech_client = None
    tts_client = None

# --- Prometheus Metrics ---
speech_to_text_requests = Counter(
    "voice_service_speech_to_text_requests_total", "Total speech-to-text requests"
)
speech_to_text_success = Counter(
    "voice_service_speech_to_text_success_total", "Total successful speech-to-text conversions"
)
speech_to_text_errors = Counter(
    "voice_service_speech_to_text_errors_total", "Total speech-to-text errors"
)
speech_to_text_duration = Histogram(
    "voice_service_speech_to_text_duration_seconds", "Speech-to-text request duration"
)

query_ai_requests = Counter(
    "voice_service_query_ai_requests_total", "Total query-ai requests"
)
query_ai_success = Counter(
    "voice_service_query_ai_success_total", "Total successful query-ai responses"
)
query_ai_errors = Counter(
    "voice_service_query_ai_errors_total", "Total query-ai errors"
)
query_ai_duration = Histogram(
    "voice_service_query_ai_duration_seconds", "Query-ai request duration"
)

text_to_speech_requests = Counter(
    "voice_service_text_to_speech_requests_total", "Total text-to-speech requests"
)
text_to_speech_success = Counter(
    "voice_service_text_to_speech_success_total", "Total successful text-to-speech conversions"
)
text_to_speech_errors = Counter(
    "voice_service_text_to_speech_errors_total", "Total text-to-speech errors"
)
text_to_speech_duration = Histogram(
    "voice_service_text_to_speech_duration_seconds", "Text-to-speech request duration"
)

# Request/Response models
class QueryAIRequest(BaseModel):
    prompt: str
    conversation_historic: str

class QueryAIResponse(BaseModel):
    response: str
    updatedHistory: str

class TextToSpeechRequest(BaseModel):
    text: str

class SpeechToTextResponse(BaseModel):
    transcript: str

def convert_webm_to_wav(webm_data: bytes) -> bytes:
    """Convert WebM audio to 16-bit WAV format for Google Speech-to-Text compatibility"""
    try:
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as webm_file:
            webm_file.write(webm_data)
            webm_path = webm_file.name
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as wav_file:
            wav_path = wav_file.name
        
        # Convert using pydub with explicit 16-bit format
        audio = AudioSegment.from_file(webm_path, format="webm")
        
        # Set to 16kHz mono and explicitly set to 16-bit samples
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)  # 2 bytes = 16 bits
        
        # Export as WAV (pydub will automatically use 16-bit PCM for sample_width=2)
        audio.export(wav_path, format="wav")
        
        # Read the converted WAV data
        with open(wav_path, 'rb') as f:
            wav_data = f.read()
        
        # Clean up temporary files
        os.unlink(webm_path)
        os.unlink(wav_path)
        
        return wav_data
        
    except Exception as e:
        print(f"[ERROR] Audio conversion error: {e}")
        raise Exception(f"Failed to convert audio: {str(e)}")

def analyze_audio_content(audio_data: bytes) -> dict:
    """Analyze audio content to check if it contains actual speech"""
    try:
        # Basic audio file analysis
        file_size = len(audio_data)
        
        # Try to read as WAV to get more details
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav') as temp_wav:
                temp_wav.write(audio_data)
                temp_wav.flush()
                
                with wave.open(temp_wav.name, 'rb') as wav_file:
                    frames = wav_file.getnframes()
                    sample_rate = wav_file.getframerate()
                    duration = frames / sample_rate
                    
                    # Read some audio data to check for silence
                    wav_file.setpos(0)
                    sample_data = wav_file.readframes(min(frames, sample_rate))  # Read up to 1 second
                    
                    # Convert to amplitude values
                    if wav_file.getsampwidth() == 2:  # 16-bit
                        samples = struct.unpack(f'<{len(sample_data)//2}h', sample_data)
                        max_amplitude = max(abs(s) for s in samples) if samples else 0
                        avg_amplitude = sum(abs(s) for s in samples) / len(samples) if samples else 0
                    else:
                        max_amplitude = 0
                        avg_amplitude = 0
                        
                    return {
                        'file_size': file_size,
                        'duration': duration,
                        'sample_rate': sample_rate,
                        'frames': frames,
                        'max_amplitude': max_amplitude,
                        'avg_amplitude': avg_amplitude,
                        'has_content': max_amplitude > 1000,  # Threshold for actual speech
                    }
        except Exception:
            # If WAV analysis fails, just return basic info
            return {
                'file_size': file_size,
                'duration': None,
                'has_content': file_size > 1000,  # Basic size check
            }
            
    except Exception as e:
        print(f"[ERROR] Audio analysis failed: {e}")
        return {'error': str(e)}

@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(audio: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    """Convert speech audio to text using Google Cloud Speech-to-Text with enhanced debugging"""
    speech_to_text_requests.inc()
    with speech_to_text_duration.time():
        if not speech_client:
            speech_to_text_errors.inc()
            raise HTTPException(status_code=500, detail="Speech-to-Text service not available")
        try:
            # Read the uploaded audio file
            audio_content = await audio.read()
            
            # Analyze original audio
            original_analysis = analyze_audio_content(audio_content)
            
            # Convert WebM to WAV if necessary
            if audio.content_type and 'webm' in audio.content_type:
                try:
                    audio_content = convert_webm_to_wav(audio_content)
                    
                    # Analyze converted audio
                    converted_analysis = analyze_audio_content(audio_content)
                    
                    # Check if conversion resulted in silence
                    if not converted_analysis.get('has_content', True):
                        raise HTTPException(
                            status_code=400, 
                            detail="Audio appears to be silent after conversion. Please speak louder or check your microphone."
                        )
                except Exception as e:
                    print(f"[ERROR] Audio conversion failed: {e}")
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Audio conversion failed: {str(e)}. Please try recording again."
                    )
                encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
                sample_rate = 16000
            else:
                # Try to handle as WAV directly
                encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
                sample_rate = 16000

            # Enhanced recognition configuration
            config = speech.RecognitionConfig(
                encoding=encoding,
                sample_rate_hertz=sample_rate,
                language_code='en-US',
                enable_automatic_punctuation=True,
                enable_word_confidence=True,
                enable_spoken_punctuation=True,
                enable_spoken_emojis=True,
                use_enhanced=True,
                # Audio channel configuration
                audio_channel_count=1,
                enable_separate_recognition_per_channel=False,
                # Alternative language codes
                alternative_language_codes=['en-GB', 'en-AU'],
                # Profanity filter
                profanity_filter=False,
                # Speech contexts for better recognition
                speech_contexts=[
                    speech.SpeechContext(
                        phrases=[
                            "issue", "problem", "broken", "not working", "error",
                            "location", "building", "floor", "room", "office",
                            "computer", "printer", "network", "internet", "email",
                            "software", "hardware", "application", "system"
                        ],
                        boost=10.0
                    )
                ]
            )
            
            # Create the request
            request = speech.RecognizeRequest(
                config=config,
                audio=speech.RecognitionAudio(content=audio_content)
            )
            
            response = speech_client.recognize(request=request)

            # Extract transcript with detailed logging
            transcript = ""
            total_confidence = 0
            result_count = 0
            
            for i, result in enumerate(response.results):
                alternative = result.alternatives[0]
                transcript += alternative.transcript
                
                
                if hasattr(alternative, 'confidence'):
                    total_confidence += alternative.confidence
                    result_count += 1
            
            avg_confidence = total_confidence / result_count if result_count > 0 else 0
            
            if not transcript.strip():
                # Provide more specific error based on audio analysis
                audio_analysis = analyze_audio_content(audio_content)
                if audio_analysis.get('duration', 0) < 0.5:
                    error_msg = "Recording too short (less than 0.5 seconds). Please record for longer."
                elif not audio_analysis.get('has_content', True):
                    error_msg = "No speech detected - audio appears to be silent. Please speak louder."
                else:
                    error_msg = "No speech detected in audio. Please speak more clearly and ensure your microphone is working."
                    
                speech_to_text_errors.inc()
                raise HTTPException(status_code=400, detail=error_msg)
            
            # Check confidence level
            if avg_confidence < 0.5:
                print(f"[WARN] Low confidence transcript: {avg_confidence:.3f}")
                # Still return the transcript but log the warning
            
            speech_to_text_success.inc()
            return SpeechToTextResponse(transcript=transcript.strip())
        except HTTPException:
            speech_to_text_errors.inc()
            raise
        except Exception as e:
            speech_to_text_errors.inc()
            print(f"[ERROR] Speech-to-text error: {e}")
            raise HTTPException(status_code=500, detail=f"Speech recognition failed: {str(e)}")

@router.post("/query-ai", response_model=QueryAIResponse)
async def query_ai(request: QueryAIRequest, authorization: Optional[str] = Header(None)):
    """Query Gemini AI for a response based on user input and conversation history"""
    # Note: This endpoint doesn't need auth token for Gemini services,
    # but we keep the parameter for consistency and potential future use
    
    query_ai_requests.inc()
    with query_ai_duration.time():
        try:
            print(f"[INFO] Request: {request}")
            

            # System instructions for the assistant
            system_instruction = (
                "You are a voice-based ticket assistant. Your goal is to collect information to generate a service ticket. "
                "Check every response you get to see if it is a valid response to the question. If it is not, ask the user to clarify. "
                "Ask exactly and only the following four questions, one at a time, waiting for the user's response after each question:\n"
                "1. Where is the issue located?\n"
                "2. What is the issue?\n"
                "3. Can you describe it in detail?\n"
                "4. Do you want to add something else?\n"
                "After all four questions are answered, say: 'Thank you for the information, I am creating a ticket for you.' "
                "Do not ask any other questions or make small talk. End the conversation after completing this flow."
            )
            
            # Prepare chat history for Gemini (only user and model roles)
            chat_history = []
            
            # If there's conversation history, parse it and add to chat_history
            if request.conversation_historic:
                for line in request.conversation_historic.strip().split('\n'):
                    if line.startswith("User:"):
                        chat_history.append({"role": "user", "parts": [{"text": line[len("User: "):]}]})
                    elif line.startswith("AI:"):
                        chat_history.append({"role": "model", "parts": [{"text": line[len("AI: "):]}]})
            
            # If this is the first message (no history), include system instructions with the user's prompt
            if not chat_history:
                user_message = f"{system_instruction}\n\nUser: {request.prompt}"
                chat_history.append({"role": "user", "parts": [{"text": user_message}]})
            else:
                # Add current user input to existing conversation
                chat_history.append({"role": "user", "parts": [{"text": request.prompt}]})

            # Instantiate Gemini model with system instruction
            model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                system_instruction=system_instruction
            )

            # Get response
            response = model.generate_content(
                contents=chat_history,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40
                }
            )

            response_text = response.text.strip()

            # Build updated conversation history
            updated_history = (
                request.conversation_historic.strip() + 
                f"\nUser: {request.prompt}\nAI: {response_text}"
            ).strip()

            query_ai_success.inc()
            return QueryAIResponse(
                response=response_text,
                updatedHistory=updated_history
            )
        except Exception as e:
            query_ai_errors.inc()
            print(f"[ERROR] AI query error: {e}")
            raise HTTPException(status_code=500, detail=f"AI query failed: {str(e)}")

@router.post("/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest, authorization: Optional[str] = Header(None)):
    """Convert text to speech using Google Cloud Text-to-Speech"""
    # Note: This endpoint doesn't need auth token for Google Cloud services,
    # but we keep the parameter for consistency and potential future use

    text_to_speech_requests.inc()
    with text_to_speech_duration.time():
        if not tts_client:
            text_to_speech_errors.inc()
            raise HTTPException(status_code=500, detail="Text-to-Speech service not available")
        try:
            # Configure the synthesis request
            synthesis_input = texttospeech.SynthesisInput(text=request.text)
            
            voice = texttospeech.VoiceSelectionParams(
                language_code='en-US',
                name='en-US-Studio-O',
                ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.LINEAR16,
                speaking_rate=1.5,
                sample_rate_hertz=24000
            )
            
            # Perform the text-to-speech request
            response = tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            text_to_speech_success.inc()
            # Return the audio as a streaming response
            return StreamingResponse(
                io.BytesIO(response.audio_content),
                media_type="audio/wav",
                headers={"Content-Disposition": "attachment; filename=speech.wav"}
            )
        except Exception as e:
            text_to_speech_errors.inc()
            print(f"[ERROR] Text-to-speech error: {e}")
            raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {str(e)}")

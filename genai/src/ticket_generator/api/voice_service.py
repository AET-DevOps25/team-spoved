import os
import io
import tempfile
import subprocess
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google.cloud import speech
from google.cloud import texttospeech
from google.oauth2 import service_account
import google.generativeai as genai
from dotenv import load_dotenv
from pydub import AudioSegment

load_dotenv()

router = APIRouter()

# Initialize Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise Exception("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize Google Cloud credentials
try:
    credentials = service_account.Credentials.from_service_account_file(
        'src/ticket_generator/credentials/credentials.json'
    )
    speech_client = speech.SpeechClient(credentials=credentials)
    tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
except Exception as e:
    print(f"[ERROR] Could not initialize Google Cloud clients: {e}")
    speech_client = None
    tts_client = None

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

@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(audio: UploadFile = File(...)):
    """Convert speech audio to text using Google Cloud Speech-to-Text"""
    if not speech_client:
        raise HTTPException(status_code=500, detail="Speech-to-Text service not available")
    
    try:
        # Read the uploaded audio file
        audio_content = await audio.read()

        # Convert WebM to WAV if necessary
        if audio.content_type and 'webm' in audio.content_type:
            audio_content = convert_webm_to_wav(audio_content)
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
            sample_rate = 16000
        else:
            # Try to handle as WAV directly
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
            sample_rate = 16000
        
        
        # Configure recognition
        config = speech.RecognitionConfig(
            encoding=encoding,
            sample_rate_hertz=sample_rate,
            language_code='en-US',
            enable_automatic_punctuation=True,
        )
        
        # Create the request
        request = speech.RecognizeRequest(
            config=config,
            audio=speech.RecognitionAudio(content=audio_content)
        )
        

        response = speech_client.recognize(request=request)
        
        # Extract transcript
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript
        
        if not transcript.strip():
            raise HTTPException(status_code=400, detail="No speech detected in audio")
        
        return SpeechToTextResponse(transcript=transcript.strip())
        
    except Exception as e:
        print(f"[ERROR] Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=f"Speech recognition failed: {str(e)}")

@router.post("/query-ai", response_model=QueryAIResponse)
async def query_ai(request: QueryAIRequest):
    """Query Gemini AI for a response based on user input and conversation history"""
    try:
        # System instructions for the assistant
        system_instruction = (
            "You are a voice-based ticket assistant. Your goal is to collect information to generate a service ticket. "
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

        return QueryAIResponse(
            response=response_text,
            updatedHistory=updated_history
        )

    except Exception as e:
        print(f"[ERROR] AI query error: {e}")
        raise HTTPException(status_code=500, detail=f"AI query failed: {str(e)}")

@router.post("/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """Convert text to speech using Google Cloud Text-to-Speech"""
    if not tts_client:
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
        
        # Return the audio as a streaming response
        return StreamingResponse(
            io.BytesIO(response.audio_content),
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=speech.wav"}
        )
        
    except Exception as e:
        print(f"[ERROR] Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {str(e)}")

# audio_extraction_and_analysis.py
import os
import tempfile
import logging
from dotenv import load_dotenv
from pydantic import BaseModel
import google.generativeai as genai
from google.cloud import speech
from google.oauth2 import service_account
from ticket_generator.api.media_service import fetch_media_by_id
from pydub import AudioSegment
import base64

load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=API_KEY)

# Initialize Google Cloud Speech client
try:
    credentials_path = 'src/ticket_generator/credentials/credentials.json'
    if os.path.exists(credentials_path):
        credentials = service_account.Credentials.from_service_account_file(credentials_path)
        speech_client = speech.SpeechClient(credentials=credentials)
    else:
        print(f"[WARNING] Credentials file not found at {credentials_path}. Using default credentials.")
        speech_client = speech.SpeechClient()
except Exception as e:
    print(f"[ERROR] Could not initialize Google Cloud Speech client: {e}")
    speech_client = None

OPEN = "OPEN"
AUDIO = "AUDIO"

class Ticket(BaseModel):
    title: str
    description: str
    status: str = OPEN
    location: str
    media_id: int
    media_type: str = AUDIO
    content: str
    reason: str
    result: str
    analyzed: bool

Ticket.model_rebuild()

def convert_audio_to_wav(audio_bytes: bytes, media_id: int) -> bytes:
    """Convert audio to 16-bit WAV format for Google Speech-to-Text compatibility"""
    try:
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix=f'_input_{media_id}', delete=False) as input_file:
            input_file.write(audio_bytes)
            input_path = input_file.name
        
        with tempfile.NamedTemporaryFile(suffix=f'_output_{media_id}.wav', delete=False) as output_file:
            output_path = output_file.name
        
        # Convert using pydub with explicit 16-bit format
        audio = AudioSegment.from_file(input_path)
        
        # Set to 16kHz mono and explicitly set to 16-bit samples
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)  # 2 bytes = 16 bits
        
        # Export as WAV (pydub will automatically use 16-bit PCM for sample_width=2)
        audio.export(output_path, format="wav")
        
        # Read the converted WAV data
        with open(output_path, 'rb') as f:
            wav_data = f.read()
        
        # Clean up temporary files
        os.unlink(input_path)
        os.unlink(output_path)
        
        return wav_data
        
    except Exception as e:
        print(f"[ERROR] Audio conversion error: {e}")
        raise Exception(f"Failed to convert audio: {str(e)}")

def transcribe_audio(audio_bytes: bytes, media_id: int) -> str:
    """Transcribe audio to text using Google Cloud Speech-to-Text"""
    if not speech_client:
        raise RuntimeError("Speech-to-Text service not available")
    
    try:
        # Convert audio to WAV format
        wav_data = convert_audio_to_wav(audio_bytes, media_id)
        
        # Configure recognition
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code='en-US',
            enable_automatic_punctuation=True,
        )
        
        # Create the request
        request = speech.RecognizeRequest(
            config=config,
            audio=speech.RecognitionAudio(content=wav_data)
        )
        
        # Perform the transcription
        response = speech_client.recognize(request=request)
        
        # Extract transcript
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "
        
        if not transcript.strip():
            raise RuntimeError("No speech detected in audio")
        
        return transcript.strip()
        
    except Exception as e:
        logging.error(f"Transcription error for media_id {media_id}: {e}")
        raise RuntimeError(f"Speech transcription failed: {str(e)}")

def build_audio_prompt():
    return (
        "You are an AI assistant for an incident management system. "
        "Your task is to analyze a voice recording transcript and generate a structured report for a new ticket. "
        "The output must strictly follow this format with no additional text:\n\n"
        "```\n"
        "Title: <short, specific summary of the issue>\n"
        "Description: <detailed explanation of what the issue is, based on the voice transcript>\n"
        "Location: <estimated or inferred location of the issue>\n"
        "Reason: <probable cause or rationale for why the ticket should be created, detailed explanation of the issue>\n"
        "Result: <short explanation of what should be done to fix the issue>\n"
        "```\n\n"
        "- Use professional and concise language.\n"
        "- Do not include headers, commentary, or any content outside the 5 fields.\n"
        "- Always fill in all 5 fields, even if you must infer based on context.\n"
        "- Analyze the voice transcript to understand the full context of the reported incident.\n"
    )

def parse_ticket_output(text: str, media_id: int, content: bytes, media_type: str):
    fields = {}
    for line in text.strip().splitlines():
        if ':' in line:
            key, value = line.split(':', 1)
            fields[key.strip().lower()] = value.strip()

    # Convert bytes back to base64 string for storage
    content_str = base64.b64encode(content).decode('utf-8')

    return Ticket(
        title=fields.get('title', ''),
        description=fields.get('description', ''),
        status=OPEN,
        location=fields.get('location', ''),
        media_id=media_id,
        media_type=AUDIO,
        content=content_str,
        reason=fields.get('reason', ''),
        result=fields.get('result', ''),
        analyzed=True
    )

def generate_ticket_from_audio(media_id: int) -> Ticket:
    """Generate a ticket from audio recording by transcribing and analyzing with Gemini"""
    try:
        # Fetch media from database
        media = fetch_media_by_id(media_id)
        content_base64, blob_type = media["content"], media["blobType"]
        
        # Decode base64 string to bytes
        content = base64.b64decode(content_base64)
        
        # Transcribe audio to text
        transcript = transcribe_audio(content, media_id)
        
        if not transcript:
            raise RuntimeError("Failed to transcribe audio or transcript is empty")
        
        # Use Gemini to analyze the transcript and generate ticket information
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = build_audio_prompt()
        full_prompt = f"{prompt}\n\nVoice Transcript:\n{transcript}"
        
        response = model.generate_content(
            contents=[
                {
                    "role": "user",
                    "parts": [{"text": full_prompt}]
                }
            ],
            generation_config={
                "temperature": 0.1,
                "top_p": 0.95,
                "top_k": 40
            }
        )
        
        # Parse the response and create ticket
        ticket = parse_ticket_output(response.text, media_id, content, media_type="AUDIO")
        
        logging.info(f"Successfully generated ticket from audio for media_id {media_id}")
        return ticket
        
    except Exception as e:
        logging.error(f"Error generating ticket from audio for media_id {media_id}: {e}")
        raise RuntimeError(f"Failed to generate ticket from audio: {str(e)}")
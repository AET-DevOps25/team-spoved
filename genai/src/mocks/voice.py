import io
import os
import pyaudio
import time
from six.moves import queue
from google.cloud import speech
from google.cloud import texttospeech
from google.oauth2 import service_account
from pydub import AudioSegment
from pydub.playback import play
import google.generativeai as genai
from dotenv import load_dotenv
import tempfile
import subprocess   
import os

# Load environment variables
load_dotenv()

# Audio recording parameters
SAMPLE_RATE = 44100
CHUNK_SIZE = int(SAMPLE_RATE / 10)  # 100ms
RECORD_SECONDS = 5  # Record for 5 seconds

# Initialize Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY or GEMINI_API_KEY == 'jifhwuehf':
    print("Error: GEMINI_API_KEY not found in environment variables.")
    print("Please set your Gemini API key in the .env file or environment.")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

# Update this path to your actual credentials file
credentials = service_account.Credentials.from_service_account_file(
    'src/ticket_generator/credentials/credentials.json'
)

client = speech.SpeechClient(credentials=credentials)

class MicrophoneStream:
    def __init__(self, rate, chunk_size):
        self._rate = rate
        self._chunk_size = chunk_size
        self._buff = queue.Queue()
        self.closed = True

    def __enter__(self):
        self._audio_interface = pyaudio.PyAudio()
        self._audio_stream = self._audio_interface.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self._rate,
            input=True,
            frames_per_buffer=self._chunk_size,
            stream_callback=self._fill_buffer,
        )
        self.closed = False
        return self

    def __exit__(self, type, value, traceback):
        self.close()

    def _fill_buffer(self, in_data, frame_count, time_info, status_flags):
        self._buff.put(in_data)
        return None, pyaudio.paContinue

    def close(self):
        if not self.closed:
            self.closed = True
            self._buff.put(None)
            self._audio_stream.stop_stream()
            self._audio_stream.close()
            self._audio_interface.terminate()

    def generator(self):
        while not self.closed:
            chunk = self._buff.get()
            if chunk is None:
                return
            yield chunk


def listen_print_loop(responses):
    print("🔁 Starting listen_print_loop")
    full_transcript = ""
    for response in responses:
        if not response.results:
            continue

        result = response.results[0]
        if not result.alternatives:
            continue

        # Check if the result is a final result
        if result.is_final:
            transcript = result.alternatives[0].transcript
            full_transcript += transcript + " "

    return full_transcript.strip()

def query_gemini(prompt, conversation_historic):
    """Query Gemini AI instead of Gemini"""
    try:
        conversation_historic += f"\nUser: {prompt}"

        context = ("I am currently an employee from a company and I want to report a maintenance issue.")

        adjusted_prompt = f"{context}{conversation_historic}"

        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(
            contents=[
                {"role": "user", "parts": [
                    {
                        "text": "You are a ticket generator for a company. You are given a description of the issue and you need to generate a ticket for it."
                        "In order to generate the ticket, you need to ask the user for the following information: "
                        "1. Where is the issue located?"
                        "2. What is the issue?"
                        "3. Can you describe it in detail?"
                        "4. Do you want to add something else?"
                        " If all of the questions have been answered say: Thank you for the information, I am creating a ticket for you."
                        + adjusted_prompt
                }]}
            ],
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40
            }
        )

        response_text = response.text
        conversation_historic += f"\nAI: {response_text}"
        return response_text, conversation_historic

    except Exception as e:
        print(f"Failed to get response from Gemini: {e}")
        return None, None

def text_to_speech(text, credentials):
    print("🔊 [TTS] Starting synthesis...")

    tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
    synthesis_input = texttospeech.SynthesisInput(text=text)

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

    response = tts_client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    print("✅ [TTS] Audio content synthesized.")

    try:
        audio_segment = AudioSegment(
            data=response.audio_content,
            sample_width=2,
            frame_rate=24000,
            channels=1
        )
        print("✅ [TTS] AudioSegment created.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
            audio_segment.export(temp_wav.name, format="wav")
            subprocess.run(["afplay", temp_wav.name], check=True)
            print("✅ [TTS] Playback completed.")

    except Exception as e:
        print(f"❌ [TTS] Playback error: {e}")


def main_sts():
    conversation_historic = ""
    
    print("🎤 System ready. Please speak...")

    while True:
        try:
            print("\n🎙️ Listening for your input...")
            
            with MicrophoneStream(SAMPLE_RATE, CHUNK_SIZE) as stream:
                audio_generator = stream.generator()
                requests = (
                    speech.StreamingRecognizeRequest(audio_content=chunk)
                    for chunk in audio_generator
                )

                config = speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                    sample_rate_hertz=SAMPLE_RATE,
                    language_code='en-US'
                )
                streaming_config = speech.StreamingRecognitionConfig(
                    config=config,
                    interim_results=True
                )

                responses = client.streaming_recognize(streaming_config, requests)
                
                user_input_received = False
                
                for response in responses:
                    if not response.results:
                        continue
                    result = response.results[0]
                    if not result.alternatives:
                        continue
                    transcript = result.alternatives[0].transcript
                    
                    if result.is_final:
                        print(f"User said: {transcript}")
                        user_input_received = True
                        
                        # Close the stream before processing AI response
                        stream.close()
                        
                        # Process the user input
                        reply, conversation_historic = query_gemini(transcript, conversation_historic)
                        if reply:
                            print(f"AI Response: {reply}")
                            # Play the AI response
                            text_to_speech(reply, credentials)
                            # Wait a moment for audio to finish completely
                            time.sleep(1)
                            print("✅ AI finished speaking. Ready for next input.")
                        else:
                            print("No response from AI")
                        
                        # Break out of the response loop to start a new listening session
                        break
                
                # If we processed user input, continue to next iteration to start fresh listening
                if user_input_received:
                    continue

        except Exception or KeyboardInterrupt as e:
            if isinstance(e, KeyboardInterrupt):
                print("\n👋 User interrupted. Exiting...")
                stream.close()
                exit(0)
            else:
                print(f"⚠️ Error during streaming: {e}")
                print("🔄 Restarting stream in 2 seconds...")
                time.sleep(2)

                    

if __name__ == '__main__':
    main_sts()

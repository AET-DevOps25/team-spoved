import pytest
import os
import base64
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

@pytest.fixture
def mock_env_vars():
    """Mock environment variables for testing"""
    with patch.dict(os.environ, {
        'GEMINI_API_KEY': 'test-gemini-key-123',
        'MEDIA_API_URL': 'http://test-media-service',
        'TICKET_API_URL': 'http://test-ticket-service',
        'USER_API_URL': 'http://test-user-service',
        'AUTH_API_URL': 'http://test-auth-service'
    }):
        yield

@pytest.fixture
def mock_auth_token():
    """Mock authentication token"""
    return "test-jwt-token-123"

@pytest.fixture
def mock_auth_header():
    """Mock authorization header"""
    return "Bearer test-jwt-token-123"

@pytest.fixture
def sample_media_photo():
    """Sample photo media data for testing"""
    # Create a simple base64-encoded test image
    test_image_data = b"fake_image_data_for_testing"
    return {
        "mediaId": 1,
        "content": base64.b64encode(test_image_data).decode('utf-8'),
        "blobType": "image/jpeg",
        "mediaType": "PHOTO",
        "analyzed": False,
        "result": None,
        "reason": None
    }

@pytest.fixture
def sample_media_video():
    """Sample video media data for testing"""
    test_video_data = b"fake_video_data_for_testing"
    return {
        "mediaId": 2,
        "content": base64.b64encode(test_video_data).decode('utf-8'),
        "blobType": "video/mp4",
        "mediaType": "VIDEO",
        "analyzed": False,
        "result": None,
        "reason": None
    }

@pytest.fixture
def sample_media_audio():
    """Sample audio media data for testing"""
    test_audio_data = b"fake_audio_data_for_testing"
    return {
        "mediaId": 3,
        "content": base64.b64encode(test_audio_data).decode('utf-8'),
        "blobType": "audio/wav",
        "mediaType": "AUDIO", 
        "analyzed": False,
        "result": None,
        "reason": None
    }

@pytest.fixture
def mock_gemini_response():
    """Mock Gemini AI response"""
    return MagicMock(
        text="""Title: Broken streetlight
            Description: A streetlight is not functioning properly on Main Street
            Location: Main Street, downtown area
            Reason: Electrical malfunction causing safety hazard for pedestrians
            Result: Replace the faulty bulb and check electrical connections"""
                )

@pytest.fixture
def expected_ticket_data():
    """Expected ticket structure for assertions"""
    return {
        "title": "Broken streetlight",
        "description": "A streetlight is not functioning properly on Main Street",
        "status": "OPEN",
        "location": "Main Street, downtown area", 
        "reason": "Electrical malfunction causing safety hazard for pedestrians",
        "result": "Replace the faulty bulb and check electrical connections",
        "analyzed": True
    }

@pytest.fixture
def test_client(mock_env_vars):
    """FastAPI test client with mocked environment"""
    from server import app
    return TestClient(app)

import pytest
import base64
from unittest.mock import patch, MagicMock
from ticket_generator.media.photo.model.gemini_photo import (
    generate_ticket,
    extract_photo_content,
    build_prompt,
    parse_ticket_output as parse_photo_ticket
)

class TestGeminiPhoto:
    """Test suite for photo analysis and ticket generation"""

    @patch('ticket_generator.media.photo.model.gemini_photo.fetch_media_by_id')
    def test_extract_photo_content(self, mock_fetch_media, sample_media_photo, mock_auth_token):
        """Test extracting photo content from media service"""
        mock_fetch_media.return_value = sample_media_photo
        
        content, blob_type = extract_photo_content(1, mock_auth_token)
        
        assert content == sample_media_photo["content"]
        assert blob_type == "image/jpeg"
        mock_fetch_media.assert_called_once_with(1, mock_auth_token)

    def test_build_prompt(self):
        """Test building the prompt for Gemini AI"""
        prompt = build_prompt()
        
        assert "incident management system" in prompt
        assert "Title:" in prompt
        assert "Description:" in prompt
        assert "Location:" in prompt
        assert "Reason:" in prompt
        assert "Result:" in prompt

    def test_parse_ticket_output_success(self, sample_media_photo):
        """Test parsing successful Gemini response"""
        test_response = """Title: Broken streetlight
                        Description: A streetlight is not functioning properly on Main Street  
                        Location: Main Street, downtown area
                        Reason: Electrical malfunction causing safety hazard for pedestrians
                        Result: Replace the faulty bulb and check electrical connections"""

        test_content = base64.b64decode(sample_media_photo["content"])
        ticket = parse_photo_ticket(test_response, 1, test_content)
        
        assert ticket.title == "Broken streetlight"
        assert ticket.description == "A streetlight is not functioning properly on Main Street"
        assert ticket.location == "Main Street, downtown area"
        assert ticket.status == "OPEN"
        assert ticket.media_type == "PHOTO"
        assert ticket.media_id == 1
        assert ticket.analyzed is True

    def test_parse_ticket_output_malformed(self):
        """Test parsing malformed Gemini response"""
        malformed_response = "This is not properly formatted"
        test_content = b"test_content"
        
        ticket = parse_photo_ticket(malformed_response, 1, test_content)
        
        # Should still create ticket with empty fields
        assert ticket.title == ""
        assert ticket.description == ""
        assert ticket.location == ""
        assert ticket.media_id == 1

    @patch('ticket_generator.media.photo.model.gemini_photo.genai.GenerativeModel')
    @patch('ticket_generator.media.photo.model.gemini_photo.fetch_media_by_id')
    def test_generate_ticket_jpeg_success(self, mock_fetch_media, mock_genai_model, 
                                        sample_media_photo, mock_gemini_response, mock_auth_token):
        """Test successful ticket generation from JPEG photo"""
        mock_fetch_media.return_value = sample_media_photo
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_gemini_response
        mock_genai_model.return_value = mock_model_instance
        
        ticket = generate_ticket(1, mock_auth_token)
        
        assert ticket.media_id == 1
        assert ticket.media_type == "PHOTO"
        assert ticket.status == "OPEN"
        assert ticket.analyzed is True
        mock_genai_model.assert_called_once_with('gemini-2.0-flash-exp')

    @patch('ticket_generator.media.photo.model.gemini_photo.genai.GenerativeModel')
    @patch('ticket_generator.media.photo.model.gemini_photo.fetch_media_by_id')
    def test_generate_ticket_png_success(self, mock_fetch_media, mock_genai_model,
                                       mock_gemini_response, mock_auth_token):
        """Test successful ticket generation from PNG photo"""
        png_media = {
            "mediaId": 1,
            "content": base64.b64encode(b"fake_png_data").decode('utf-8'),
            "blobType": "image/png",
            "mediaType": "PHOTO"
        }
        mock_fetch_media.return_value = png_media
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_gemini_response
        mock_genai_model.return_value = mock_model_instance
        
        ticket = generate_ticket(1, mock_auth_token)
        
        assert ticket.media_id == 1
        assert ticket.media_type == "PHOTO"
        mock_genai_model.assert_called_once_with('gemini-2.0-flash-exp')

    @patch('ticket_generator.media.photo.model.gemini_photo.fetch_media_by_id')
    def test_generate_ticket_unsupported_format(self, mock_fetch_media, mock_auth_token):
        """Test error handling for unsupported image format"""
        unsupported_media = {
            "content": base64.b64encode(b"fake_data").decode('utf-8'),
            "blobType": "image/gif"  # Unsupported format
        }
        mock_fetch_media.return_value = unsupported_media
        
        with pytest.raises(ValueError, match="Unsupported blob type"):
            generate_ticket(1, mock_auth_token)

    @patch('ticket_generator.media.photo.model.gemini_photo.genai.GenerativeModel')
    @patch('ticket_generator.media.photo.model.gemini_photo.fetch_media_by_id')
    def test_generate_ticket_api_error(self, mock_fetch_media, mock_genai_model,
                                     sample_media_photo, mock_auth_token):
        """Test handling of Gemini API errors"""
        mock_fetch_media.return_value = sample_media_photo
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.side_effect = Exception("API Error")
        mock_genai_model.return_value = mock_model_instance
        
        with pytest.raises(Exception, match="API Error"):
            generate_ticket(1, mock_auth_token)

    @patch('ticket_generator.media.photo.model.gemini_photo.fetch_media_by_id')
    def test_generate_ticket_no_auth_token(self, mock_fetch_media, sample_media_photo):
        """Test ticket generation without auth token"""
        mock_fetch_media.return_value = sample_media_photo
        
        # Should still work - auth token is optional in some contexts
        with patch('ticket_generator.media.photo.model.gemini_photo.genai.GenerativeModel') as mock_model:
            mock_instance = MagicMock()
            mock_instance.generate_content.return_value = MagicMock(text="Title: Test")
            mock_model.return_value = mock_instance
            
            ticket = generate_ticket(1, None)
            assert ticket.media_id == 1

import pytest
import base64
import tempfile
import os
from unittest.mock import patch, MagicMock
from ticket_generator.media.video.model.gemini_video import (
    generate_ticket_from_video,
    extract_frames,
    build_video_prompt,
    parse_ticket_output as parse_video_ticket
)

class TestGeminiVideo:
    """Test suite for video analysis and ticket generation"""

    def test_build_video_prompt(self):
        """Test building the prompt for video analysis"""
        prompt = build_video_prompt()
        
        assert "incident management system" in prompt
        assert "video frames" in prompt
        assert "Title:" in prompt
        assert "Description:" in prompt
        assert "Location:" in prompt
        assert "Reason:" in prompt
        assert "Result:" in prompt

    @patch('ticket_generator.media.video.model.gemini_video.cv2.VideoCapture')
    @patch('ticket_generator.media.video.model.gemini_video.cv2.imwrite')
    def test_extract_frames_success(self, mock_imwrite, mock_video_capture):
        """Test successful frame extraction from video"""
        # Mock cv2.VideoCapture
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        mock_cap.read.side_effect = [
            (True, MagicMock()),  # First frame
            (True, MagicMock()),  # Second frame  
            (False, None)         # End of video
        ]
        mock_video_capture.return_value = mock_cap
        mock_imwrite.return_value = True
        
        test_video_bytes = b"fake_video_data"
        frame_dir = extract_frames(test_video_bytes, media_id=1, frame_interval=1)
        
        assert frame_dir is not None
        assert os.path.exists(frame_dir)
        mock_cap.isOpened.assert_called()
        mock_cap.release.assert_called_once()

    @patch('ticket_generator.media.video.model.gemini_video.cv2.VideoCapture')
    def test_extract_frames_video_open_failure(self, mock_video_capture):
        """Test frame extraction when video cannot be opened"""
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = False
        mock_video_capture.return_value = mock_cap
        
        test_video_bytes = b"corrupted_video_data"
        frame_dir = extract_frames(test_video_bytes, media_id=1)
        
        assert frame_dir == ""

    def test_parse_ticket_output_success(self, sample_media_video):
        """Test parsing successful video analysis response"""
        test_response = """Title: Broken water pipe
                    Description: Video shows water leaking from underground pipe on street
                    Location: Oak Street intersection
                    Reason: Pipe rupture causing water damage and traffic disruption
                    Result: Emergency repair crew needed to fix the pipe break"""

        test_content = base64.b64decode(sample_media_video["content"])
        ticket = parse_video_ticket(test_response, 2, test_content, "VIDEO")
        
        assert ticket.title == "Broken water pipe"
        assert ticket.description == "Video shows water leaking from underground pipe on street"
        assert ticket.location == "Oak Street intersection"
        assert ticket.status == "OPEN"
        assert ticket.media_type == "VIDEO"
        assert ticket.media_id == 2
        assert ticket.analyzed is True

    @patch('ticket_generator.media.video.model.gemini_video.shutil.rmtree')
    @patch('ticket_generator.media.video.model.gemini_video.genai.GenerativeModel')
    @patch('ticket_generator.media.video.model.gemini_video.extract_frames')
    @patch('ticket_generator.media.video.model.gemini_video.fetch_media_by_id')
    def test_generate_ticket_from_video_success(self, mock_fetch_media, mock_extract_frames,
                                              mock_genai_model, mock_rmtree,
                                              sample_media_video, mock_gemini_response, 
                                              mock_auth_token):
        """Test successful ticket generation from video"""
        mock_fetch_media.return_value = sample_media_video
        
        # Mock frame extraction
        temp_dir = tempfile.mkdtemp()
        mock_extract_frames.return_value = temp_dir
        
        # Create mock frame files
        frame1_path = os.path.join(temp_dir, "frame_0000.jpg")
        frame2_path = os.path.join(temp_dir, "frame_0001.jpg") 
        with open(frame1_path, 'wb') as f:
            f.write(b"fake_frame_1")
        with open(frame2_path, 'wb') as f:
            f.write(b"fake_frame_2")
        
        # Mock Gemini model
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_gemini_response
        mock_genai_model.return_value = mock_model_instance
        
        ticket = generate_ticket_from_video(2, mock_auth_token)
        
        assert ticket.media_id == 2
        assert ticket.media_type == "VIDEO"
        assert ticket.status == "OPEN"
        assert ticket.analyzed is True
        mock_extract_frames.assert_called_once()
        mock_genai_model.assert_called_once_with('gemini-2.0-flash-exp')
        mock_rmtree.assert_called_once_with(temp_dir)

    @patch('ticket_generator.media.video.model.gemini_video.extract_frames')
    @patch('ticket_generator.media.video.model.gemini_video.fetch_media_by_id')
    def test_generate_ticket_frame_extraction_failure(self, mock_fetch_media, mock_extract_frames,
                                                    sample_media_video, mock_auth_token):
        """Test handling of frame extraction failure"""
        mock_fetch_media.return_value = sample_media_video
        mock_extract_frames.return_value = ""  # Simulate extraction failure
        
        with pytest.raises(RuntimeError, match="Frame extraction failed"):
            generate_ticket_from_video(2, mock_auth_token)

    @patch('ticket_generator.media.video.model.gemini_video.shutil.rmtree')
    @patch('ticket_generator.media.video.model.gemini_video.genai.GenerativeModel')
    @patch('ticket_generator.media.video.model.gemini_video.extract_frames')
    @patch('ticket_generator.media.video.model.gemini_video.fetch_media_by_id')
    def test_generate_ticket_gemini_api_error(self, mock_fetch_media, mock_extract_frames,
                                            mock_genai_model, mock_rmtree,
                                            sample_media_video, mock_auth_token):
        """Test handling of Gemini API errors during video analysis"""
        mock_fetch_media.return_value = sample_media_video
        
        temp_dir = tempfile.mkdtemp()
        mock_extract_frames.return_value = temp_dir
        
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.side_effect = Exception("Gemini API Error")
        mock_genai_model.return_value = mock_model_instance
        
        with pytest.raises(Exception, match="Gemini API Error"):
            generate_ticket_from_video(2, mock_auth_token)



    @patch('ticket_generator.media.video.model.gemini_video.fetch_media_by_id')
    def test_generate_ticket_invalid_base64(self, mock_fetch_media, mock_auth_token):
        """Test handling of invalid base64 content"""
        invalid_media = {
            "content": "invalid_base64_content!@#",
            "blobType": "video/mp4",
            "mediaType": "VIDEO"
        }
        mock_fetch_media.return_value = invalid_media
        
        with pytest.raises(Exception):  # Base64 decode error
            generate_ticket_from_video(2, mock_auth_token)

import pytest
import base64
from unittest.mock import patch, MagicMock
from ticket_generator.media.voice.model.gemini_audio import (
    generate_ticket_from_audio,
    convert_audio_to_wav,
    transcribe_audio,
    build_audio_prompt,
    parse_ticket_output as parse_audio_ticket
)

class TestGeminiAudio:
    """Test suite for audio analysis and ticket generation"""

    def test_build_audio_prompt(self):
        """Test building the prompt for audio analysis"""
        prompt = build_audio_prompt()
        
        assert "incident management system" in prompt
        assert "voice recording transcript" in prompt
        assert "Title:" in prompt
        assert "Description:" in prompt
        assert "Location:" in prompt
        assert "Reason:" in prompt
        assert "Result:" in prompt

    @patch('ticket_generator.media.voice.model.gemini_audio.AudioSegment')
    @patch('ticket_generator.media.voice.model.gemini_audio.tempfile.NamedTemporaryFile')
    def test_convert_audio_to_wav_success(self, mock_temp_file, mock_audio_segment):
        """Test successful audio conversion to WAV format"""
        # Mock temporary files
        mock_input_file = MagicMock()
        mock_input_file.name = "/tmp/input_audio_1"
        mock_output_file = MagicMock()
        mock_output_file.name = "/tmp/output_audio_1.wav"
        
        mock_temp_file.side_effect = [mock_input_file, mock_output_file]
        
        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.set_frame_rate.return_value = mock_audio
        mock_audio.set_channels.return_value = mock_audio
        mock_audio.set_sample_width.return_value = mock_audio
        mock_audio_segment.from_file.return_value = mock_audio
        
        test_audio_bytes = b"test_audio_data"
        expected_wav_data = b"converted_wav_data"
        
        # Mock only the final open() call that reads the output file
        from unittest.mock import mock_open
        
        with patch('builtins.open', mock_open(read_data=expected_wav_data)), \
             patch('os.unlink'):
            result = convert_audio_to_wav(test_audio_bytes, media_id=1)
            
        assert result == expected_wav_data
        mock_audio_segment.from_file.assert_called_once()
        mock_audio.export.assert_called_once()

    @patch('ticket_generator.media.voice.model.gemini_audio.AudioSegment')
    def test_convert_audio_to_wav_failure(self, mock_audio_segment):
        """Test audio conversion failure handling"""
        mock_audio_segment.from_file.side_effect = Exception("Conversion failed")
        
        test_audio_bytes = b"corrupted_audio_data"
        
        with pytest.raises(Exception, match="Failed to convert audio"):
            convert_audio_to_wav(test_audio_bytes, media_id=1)

    @patch('ticket_generator.media.voice.model.gemini_audio.convert_audio_to_wav')
    @patch('ticket_generator.media.voice.model.gemini_audio.speech_client')
    def test_transcribe_audio_success(self, mock_speech_client, mock_convert_audio):
        """Test successful audio transcription"""
        mock_convert_audio.return_value = b"converted_wav_data"
        
        # Mock speech client response
        mock_result = MagicMock()
        mock_alternative = MagicMock()
        mock_alternative.transcript = "This is a test transcription"
        mock_result.alternatives = [mock_alternative]
        
        mock_response = MagicMock()
        mock_response.results = [mock_result]
        
        mock_speech_client.recognize.return_value = mock_response
        
        test_audio_bytes = b"test_audio_data"
        transcript = transcribe_audio(test_audio_bytes, media_id=1)
        
        assert transcript == "This is a test transcription"
        mock_convert_audio.assert_called_once_with(test_audio_bytes, 1)
        mock_speech_client.recognize.assert_called_once()

    @patch('ticket_generator.media.voice.model.gemini_audio.convert_audio_to_wav')
    @patch('ticket_generator.media.voice.model.gemini_audio.speech_client')
    def test_transcribe_audio_no_speech(self, mock_speech_client, mock_convert_audio):
        """Test transcription when no speech is detected"""
        mock_convert_audio.return_value = b"converted_wav_data"
        
        # Mock empty response
        mock_response = MagicMock()
        mock_response.results = []  # No speech detected
        mock_speech_client.recognize.return_value = mock_response
        
        test_audio_bytes = b"silent_audio_data"
        
        with pytest.raises(RuntimeError, match="No speech detected"):
            transcribe_audio(test_audio_bytes, media_id=1)

    @patch('ticket_generator.media.voice.model.gemini_audio.speech_client', None)
    def test_transcribe_audio_client_unavailable(self):
        """Test transcription when speech client is unavailable"""
        test_audio_bytes = b"test_audio_data"
        
        with pytest.raises(RuntimeError, match="Speech-to-Text service not available"):
            transcribe_audio(test_audio_bytes, media_id=1)

    def test_parse_ticket_output_success(self, sample_media_audio):
        """Test parsing successful audio analysis response"""
        test_response = """Title: Noise complaint
                        Description: Loud music reported from residential area during night hours
                        Location: Residential area, Elm Street
                        Reason: Noise ordinance violation disturbing neighbors
                        Result: Issue warning and request volume reduction"""

        test_content = base64.b64decode(sample_media_audio["content"])
        ticket = parse_audio_ticket(test_response, 3, test_content, "AUDIO")
        
        assert ticket.title == "Noise complaint"
        assert ticket.description == "Loud music reported from residential area during night hours"
        assert ticket.location == "Residential area, Elm Street"
        assert ticket.status == "OPEN"
        assert ticket.media_type == "AUDIO"
        assert ticket.media_id == 3
        assert ticket.analyzed is True

    @patch('ticket_generator.media.voice.model.gemini_audio.genai.GenerativeModel')
    @patch('ticket_generator.media.voice.model.gemini_audio.transcribe_audio')
    @patch('ticket_generator.media.voice.model.gemini_audio.fetch_media_by_id')
    def test_generate_ticket_from_audio_success(self, mock_fetch_media, mock_transcribe,
                                              mock_genai_model, sample_media_audio,
                                              mock_gemini_response, mock_auth_token):
        """Test successful ticket generation from audio"""
        mock_fetch_media.return_value = sample_media_audio
        mock_transcribe.return_value = "This is a test transcription of an incident report"
        
        # Mock Gemini model
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = mock_gemini_response
        mock_genai_model.return_value = mock_model_instance
        
        ticket = generate_ticket_from_audio(3, mock_auth_token)
        
        assert ticket.media_id == 3
        assert ticket.media_type == "AUDIO"
        assert ticket.status == "OPEN"
        assert ticket.analyzed is True
        mock_transcribe.assert_called_once()
        mock_genai_model.assert_called_once_with('gemini-2.0-flash-exp')

    @patch('ticket_generator.media.voice.model.gemini_audio.transcribe_audio')
    @patch('ticket_generator.media.voice.model.gemini_audio.fetch_media_by_id')
    def test_generate_ticket_transcription_failure(self, mock_fetch_media, mock_transcribe,
                                                 sample_media_audio, mock_auth_token):
        """Test handling of transcription failure"""
        mock_fetch_media.return_value = sample_media_audio
        mock_transcribe.side_effect = RuntimeError("Transcription failed")
        
        with pytest.raises(RuntimeError, match="Transcription failed"):
            generate_ticket_from_audio(3, mock_auth_token)

    @patch('ticket_generator.media.voice.model.gemini_audio.transcribe_audio')
    @patch('ticket_generator.media.voice.model.gemini_audio.fetch_media_by_id')
    def test_generate_ticket_empty_transcript(self, mock_fetch_media, mock_transcribe,
                                            sample_media_audio, mock_auth_token):
        """Test handling of empty transcription"""
        mock_fetch_media.return_value = sample_media_audio
        mock_transcribe.return_value = ""  # Empty transcript
        
        with pytest.raises(RuntimeError, match="Failed to transcribe audio or transcript is empty"):
            generate_ticket_from_audio(3, mock_auth_token)

    @patch('ticket_generator.media.voice.model.gemini_audio.genai.GenerativeModel')
    @patch('ticket_generator.media.voice.model.gemini_audio.transcribe_audio')
    @patch('ticket_generator.media.voice.model.gemini_audio.fetch_media_by_id')
    def test_generate_ticket_gemini_api_error(self, mock_fetch_media, mock_transcribe,
                                            mock_genai_model, sample_media_audio, mock_auth_token):
        """Test handling of Gemini API errors during audio analysis"""
        mock_fetch_media.return_value = sample_media_audio
        mock_transcribe.return_value = "Test transcription"
        
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.side_effect = Exception("Gemini API Error")
        mock_genai_model.return_value = mock_model_instance
        
        with pytest.raises(Exception, match="Gemini API Error"):
            generate_ticket_from_audio(3, mock_auth_token)

import pytest
import os
from unittest.mock import patch
from ticket_generator.api.utils import (
    get_auth_headers,
    extract_token_from_header
)

class TestAuthUtils:
    """Test suite for authentication utilities"""

    def test_get_auth_headers_with_token(self):
        """Test getting auth headers with provided token"""
        token = "test-jwt-token-123"
        headers = get_auth_headers(token)
        
        assert headers == {"Authorization": "Bearer test-jwt-token-123"}

    def test_get_auth_headers_with_bearer_prefix(self):
        """Test getting auth headers when token already has Bearer prefix"""
        token = "Bearer test-jwt-token-123"
        headers = get_auth_headers(token)
        
        assert headers == {"Authorization": "Bearer test-jwt-token-123"}

    def test_get_auth_headers_no_token(self):
        """Test getting auth headers without token raises error"""
        with pytest.raises(RuntimeError, match="No authentication token provided"):
            get_auth_headers(None)

    def test_get_auth_headers_empty_token(self):
        """Test getting auth headers with empty token raises error"""
        with pytest.raises(RuntimeError, match="No authentication token provided"):
            get_auth_headers("")

    def test_extract_token_from_header_success(self):
        """Test successful token extraction from authorization header"""
        auth_header = "Bearer test-jwt-token-123"
        token = extract_token_from_header(auth_header)
        
        assert token == "test-jwt-token-123"

    def test_extract_token_from_header_missing(self):
        """Test token extraction with missing header"""
        with pytest.raises(ValueError, match="Authorization header is missing"):
            extract_token_from_header(None)

    def test_extract_token_from_header_empty(self):
        """Test token extraction with empty header"""
        with pytest.raises(ValueError, match="Authorization header is missing"):
            extract_token_from_header("")

    def test_extract_token_from_header_wrong_format(self):
        """Test token extraction with wrong format"""
        auth_header = "Basic dGVzdDp0ZXN0"  # Basic auth instead of Bearer
        
        with pytest.raises(ValueError, match="Authorization header must start with 'Bearer '"):
            extract_token_from_header(auth_header)

    def test_extract_token_from_header_no_token(self):
        """Test token extraction with Bearer but no token"""
        auth_header = "Bearer "
        token = extract_token_from_header(auth_header)
        
        assert token == ""

    def test_extract_token_from_header_with_spaces(self):
        """Test token extraction with extra spaces"""
        auth_header = "Bearer   test-jwt-token-with-spaces   "
        token = extract_token_from_header(auth_header)
        
        assert token == "  test-jwt-token-with-spaces   "

class TestAuthUtilsIntegration:
    """Integration tests for authentication utilities"""

    def test_auth_flow_success(self):
        """Test complete auth flow: extract then use token"""
        auth_header = "Bearer test-integration-token"
        
        # Extract token
        token = extract_token_from_header(auth_header)
        
        # Use token to get headers
        headers = get_auth_headers(token)
        
        assert headers == {"Authorization": "Bearer test-integration-token"}

    def test_auth_flow_with_bearer_token(self):
        """Test auth flow when token already includes Bearer"""
        auth_header = "Bearer test-bearer-token"
        token = extract_token_from_header(auth_header)
        
        # This should work even if we pass the full Bearer token
        headers = get_auth_headers(f"Bearer {token}")
        
        assert headers == {"Authorization": "Bearer test-bearer-token"}

    @patch.dict(os.environ, {}, clear=True)
    def test_auth_without_env_fallback(self):
        """Test that auth utils work without environment variable fallback"""
        # Test that we don't depend on environment variables for basic functionality
        token = "test-token-no-env"
        headers = get_auth_headers(token)
        
        assert headers == {"Authorization": "Bearer test-token-no-env"}


import pytest
import base64
import tempfile
import os
from unittest.mock import patch, MagicMock
from ticket_generator.media.video.model.gemini_video import (
    generate_ticket_from_video,
    extract_frames,
    build_video_prompt,
    parse_ticket_output
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
        
        test_video_bytes = b"corrupted_video_data_corrupted_video_data_corrupted_video_data_corrupted_video_data"
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
        ticket = parse_ticket_output(test_response, 2, test_content, "VIDEO")
        
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
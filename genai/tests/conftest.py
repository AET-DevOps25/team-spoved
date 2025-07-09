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

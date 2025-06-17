import os
from fastapi import APIRouter
from dotenv import load_dotenv
import requests

load_dotenv()

router = APIRouter()

API_URL = os.getenv("BACKEND_API_URL")

# Fetch corresponding information for video or photo
def fetch_data_video_photo(media_id: int):
    response = requests.get(f"{API_URL}/media/{media_id}")
    return response.json()

# Update analyzed status
def update_analyzed(media_id: int, analyzed: bool):
    response = requests.put(f"{API_URL}/media/{media_id}/analyzed", json=analyzed)
    return response.json()

# Update result
def update_result(media_id: int, result: str):
    response = requests.put(f"{API_URL}/media/{media_id}/result", json=result)
    return response.json()

# Update reason
def update_reason(media_id: int, reason: str):  
    response = requests.put(f"{API_URL}/media/{media_id}/reason", json=reason)
    return response.json()

@router.get("/{media_id}")
async def get_video_photo_data(media_id: int):
    """Get video/photo analysis data"""
    return fetch_data_video_photo(media_id)

@router.put("/{media_id}/analyzed")
async def update_analyzed_status(media_id: int, data: dict):
    """Update analyzed status"""
    return update_analyzed(media_id, data.get("analyzed", True))

@router.put("/{media_id}/result")
async def update_analysis_result(media_id: int, data: dict):
    """Update analysis result"""
    return update_result(media_id, data.get("result", ""))

@router.put("/{media_id}/reason")
async def update_analysis_reason(media_id: int, data: dict):
    """Update analysis reason"""
    return update_reason(media_id, data.get("reason", ""))
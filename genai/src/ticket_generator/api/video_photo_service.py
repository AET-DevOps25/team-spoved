import os
from fastapi import APIRouter
from dotenv import load_dotenv
import requests
from ticket_generator.api.utils import get_auth_headers

load_dotenv()

router = APIRouter()

API_URL = os.getenv("BACKEND_API_URL")

def safe_json_response(response):
    if response.status_code == 204 or not response.content or response.text.strip() == "":
        return {"status": "success"}
    try:
        return response.json()
    except Exception as e:
        print(f"[ERROR] Failed to parse JSON: {e}, content: {response.text!r}")
        return {
            "error": "Invalid JSON response",
            "status_code": response.status_code,
            "body": response.text
        }

def fetch_data_video_photo(media_id: int):
    response = requests.get(f"{API_URL}/media/{media_id}", headers=get_auth_headers())
    return safe_json_response(response)

def update_analyzed(media_id: int, analyzed: bool):
    response = requests.put(f"{API_URL}/media/{media_id}/analyzed", json=analyzed, headers=get_auth_headers())
    return safe_json_response(response)

def update_result(media_id: int, result: str):
    response = requests.put(f"{API_URL}/media/{media_id}/result", json=result, headers=get_auth_headers())
    return safe_json_response(response)

def update_reason(media_id: int, reason: str):  
    response = requests.put(f"{API_URL}/media/{media_id}/reason", json=reason, headers=get_auth_headers())
    return safe_json_response(response)


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
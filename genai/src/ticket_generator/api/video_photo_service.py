import os
from fastapi import APIRouter, Header
from dotenv import load_dotenv
import requests
from ticket_generator.api.utils import get_auth_headers, extract_token_from_header
from typing import Optional

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

def fetch_data_video_photo(media_id: int, auth_token: str = None):
    response = requests.get(f"{API_URL}/media/{media_id}", headers=get_auth_headers(auth_token))
    return safe_json_response(response)

def update_analyzed(media_id: int, analyzed: bool, auth_token: str = None):
    response = requests.put(f"{API_URL}/media/{media_id}/analyzed", json=analyzed, headers=get_auth_headers(auth_token))
    return safe_json_response(response)

def update_result(media_id: int, result: str, auth_token: str = None):
    response = requests.put(f"{API_URL}/media/{media_id}/result", json=result, headers=get_auth_headers(auth_token))
    return safe_json_response(response)

def update_reason(media_id: int, reason: str, auth_token: str = None):  
    response = requests.put(f"{API_URL}/media/{media_id}/reason", json=reason, headers=get_auth_headers(auth_token))
    return safe_json_response(response)

@router.get("/{media_id}")
async def get_video_photo_data(media_id: int, authorization: Optional[str] = Header(None)):
    """Get video/photo analysis data"""
    token = extract_token_from_header(authorization) if authorization else None
    return fetch_data_video_photo(media_id, token)

@router.put("/{media_id}/analyzed")
async def update_analyzed_status(media_id: int, data: dict, authorization: Optional[str] = Header(None)):
    """Update analyzed status"""
    token = extract_token_from_header(authorization) if authorization else None
    return update_analyzed(media_id, data.get("analyzed", True), token)

@router.put("/{media_id}/result")
async def update_analysis_result(media_id: int, data: dict, authorization: Optional[str] = Header(None)):
    """Update analysis result"""
    token = extract_token_from_header(authorization) if authorization else None
    return update_result(media_id, data.get("result", ""), token)

@router.put("/{media_id}/reason")
async def update_analysis_reason(media_id: int, data: dict, authorization: Optional[str] = Header(None)):
    """Update analysis reason"""
    token = extract_token_from_header(authorization) if authorization else None
    return update_reason(media_id, data.get("reason", ""), token)
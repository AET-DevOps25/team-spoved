import os
import requests
from fastapi import APIRouter, HTTPException, Header
from dotenv import load_dotenv
from ticket_generator.api.utils import get_auth_headers, extract_token_from_header
from typing import Optional

load_dotenv()

router = APIRouter()

API_URL = os.getenv("MEDIA_API_URL")


def fetch_media(auth_token: str = None):
    """Fetch all media with authentication"""
    try:
        response = requests.get(f"{API_URL}/media", headers=get_auth_headers(auth_token))
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"[ERROR] HTTP Error fetching media: {e}")
        print(f"[ERROR] Response content: {response.content}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch media: {e}")
    except requests.exceptions.JSONDecodeError as e:
        print(f"[ERROR] JSON Decode Error: {e}")
        print(f"[ERROR] Response content: {response.content}")
        raise HTTPException(status_code=500, detail="Invalid JSON response from server")

def fetch_media_by_id(media_id: int, auth_token: str = None):
    """Fetch media by ID with authentication and error handling"""
    try:
        response = requests.get(f"{API_URL}/media/{media_id}", headers=get_auth_headers(auth_token))
        print(f"[INFO] {response.json().keys()}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"[ERROR] HTTP Error fetching media {media_id}: {e}")
        print(f"[ERROR] Response content: {response.content}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch media {media_id}: {e}")
    except requests.exceptions.JSONDecodeError as e:
        print(f"[ERROR] JSON Decode Error for media {media_id}: {e}")
        print(f"[ERROR] Response content: {response.content}")
        raise HTTPException(status_code=500, detail="Invalid JSON response from server")

@router.get("/")
async def get_all_media(authorization: Optional[str] = Header(None)):
    """Get all media items"""
    token = extract_token_from_header(authorization) if authorization else None
    return fetch_media(token)

@router.get("/{media_id}")
async def get_media_by_id(media_id: int, authorization: Optional[str] = Header(None)):
    """Get media by ID"""
    token = extract_token_from_header(authorization) if authorization else None
    return fetch_media_by_id(media_id, token)

def update_analyzed(media_id: int, analyzed: bool, auth_token: str = None):
    response = requests.put(f"{API_URL}/media/{media_id}/analyzed", json=analyzed, headers=get_auth_headers(auth_token))
    if response.status_code == 204 or not response.content or response.text.strip() == "":
        return {"status": "success"}
    try:
        return response.json()
    except Exception as e:
        print(f"[ERROR] Could not parse JSON: {e}, content: {response.text!r}")
        return {"error": "Invalid JSON response", "status_code": response.status_code, "content": response.text}

def update_result(media_id: int, result: str, auth_token: str = None):
    response = requests.put(f"{API_URL}/media/{media_id}/result", json=result, headers=get_auth_headers(auth_token))
    if response.status_code == 204 or not response.content or response.text.strip() == "":
        return {"status": "success"}
    try:
        return response.json()
    except Exception as e:
        print(f"[ERROR] Could not parse JSON: {e}, content: {response.text!r}")
        return {"error": "Invalid JSON response", "status_code": response.status_code, "content": response.text}

def update_reason(media_id: int, reason: str, auth_token: str = None):  
    response = requests.put(f"{API_URL}/media/{media_id}/reason", json=reason, headers=get_auth_headers(auth_token))
    if response.status_code == 204 or not response.content or response.text.strip() == "":
        return {"status": "success"}
    try:
        return response.json()
    except Exception as e:
        print(f"[ERROR] Could not parse JSON: {e}, content: {response.text!r}")
        return {"error": "Invalid JSON response", "status_code": response.status_code, "content": response.text}


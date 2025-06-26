import os
import requests
from fastapi import APIRouter, Header
from dotenv import load_dotenv
from ticket_generator.media.photo.model.gemini_photo import generate_ticket as generate_photo_ticket
from ticket_generator.media.video.model.gemini_video import generate_ticket_from_video
from ticket_generator.media.voice.model.gemini_audio import generate_ticket_from_audio
from ticket_generator.api.media_service import fetch_media_by_id
from datetime import datetime, timedelta
from ticket_generator.api.video_photo_service import update_result, update_reason, update_analyzed
from ticket_generator.api.utils import get_auth_headers, extract_token_from_header
from typing import Optional

load_dotenv()

router = APIRouter()

API_URL = os.getenv("BACKEND_API_URL")

def fetch_tickets(auth_token: str = None):
    response = requests.get(f"{API_URL}/tickets", headers=get_auth_headers(auth_token))
    return response.json()

def fetch_ticket_by_id(ticket_id: int, auth_token: str = None):
    response = requests.get(f"{API_URL}/tickets/{ticket_id}", headers=get_auth_headers(auth_token))
    return response.json()

def create_ticket(ticket: dict, auth_token: str = None):
    # Fetch media metadata to determine the blob type
    media = fetch_media_by_id(ticket['media_id'], auth_token)
    
    # Route to appropriate processor based on blob type
    media_type = media['mediaType']
    
    if media_type == 'PHOTO':
        model_ticket = generate_photo_ticket(ticket['media_id'])
    elif media_type == 'VIDEO':
        model_ticket = generate_ticket_from_video(ticket['media_id'])
    elif media_type == 'AUDIO':
        model_ticket = generate_ticket_from_audio(ticket['media_id'])
    else:
        raise ValueError(f'Unsupported media type: {media_type}')
    
    due_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

    int_media_id = int(ticket['media_id'])
    
    ticket_json = {
        "assignedTo": None,
        "createdBy": 5,
        "title": model_ticket.title,
        "description": model_ticket.description,
        "status": "OPEN",
        "dueDate": due_date,
        "location": model_ticket.location,
        "mediaType": model_ticket.media_type,
        "mediaId": int_media_id,
    }

    update_result(ticket['media_id'], model_ticket.result, auth_token)
    update_reason(ticket['media_id'], model_ticket.reason, auth_token)
    update_analyzed(ticket['media_id'], True, auth_token)

    response = requests.post(f"{API_URL}/tickets", json=ticket_json, headers=get_auth_headers(auth_token))
    return response.json()

@router.get("/")
async def get_all_tickets(authorization: Optional[str] = Header(None)):
    """Get all tickets"""
    token = extract_token_from_header(authorization) if authorization else None
    return fetch_tickets(token)

@router.get("/{ticket_id}")
async def get_ticket_by_id(ticket_id: int, authorization: Optional[str] = Header(None)):
    """Get ticket by ID"""
    token = extract_token_from_header(authorization) if authorization else None
    return fetch_ticket_by_id(ticket_id, token)

@router.post("/")
async def create_new_ticket(ticket: dict, authorization: Optional[str] = Header(None)):
    """Create a new ticket"""
    token = extract_token_from_header(authorization) if authorization else None
    return create_ticket(ticket, token)
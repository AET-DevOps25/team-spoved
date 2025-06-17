import os
import requests
from fastapi import APIRouter
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

API_URL = os.getenv("BACKEND_API_URL")

# Fetch all media
def fetch_media():
    response = requests.get(f"{API_URL}/media")
    return response.json()

# Fetch media by id
def fetch_media_by_id(media_id: int):
    response = requests.get(f"{API_URL}/media/{media_id}/metadata")
    return response.json()

@router.get("/")
async def get_all_media():
    """Get all media items"""
    return fetch_media()

@router.get("/{media_id}")
async def get_media_by_id(media_id: int):
    """Get media by ID"""
    return fetch_media_by_id(media_id)


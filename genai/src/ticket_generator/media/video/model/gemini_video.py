# video_extraction_and_analysis.py
import os
import cv2
import shutil
import tempfile
import logging
import mimetypes
from dotenv import load_dotenv
from pydantic import BaseModel
import google.generativeai as genai
from ticket_generator.api.media_service import fetch_media_by_id
import base64

load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=API_KEY)

OPEN = "OPEN"
VIDEO = "VIDEO"

class Ticket(BaseModel):
    title: str
    description: str
    status: str = OPEN
    location: str
    media_id: int
    media_type: str = VIDEO
    content: str
    reason: str
    result: str
    analyzed: bool

Ticket.model_rebuild()


def extract_frames(video_bytes: bytes, media_id: int, frame_interval: int = 30) -> str:

    video_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{media_id}")
    video_file.write(video_bytes)
    video_file.close()

    cap = cv2.VideoCapture(video_file.name)
    if not cap.isOpened():
        logging.error("Failed to open video for frame extraction.")
        return ""

    frame_dir = tempfile.mkdtemp(prefix="video_frames_")
    count, saved = 0, 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if count % frame_interval == 0:
            frame_path = os.path.join(frame_dir, f"frame_{saved:04d}.jpg")
            cv2.imwrite(frame_path, frame)
            saved += 1
        count += 1

    cap.release()
    os.remove(video_file.name)
    return frame_dir

def build_video_prompt():
    return (
        "You are an AI assistant for an incident management system. "
        "Your task is to analyze frames from an uploaded video and generate a structured report for a new ticket. "
        "The output must strictly follow this format with no additional text:\n\n"
        "```\n"
        "Title: <short, specific summary of the issue>\n"
        "Description: <detailed explanation of what the issue is, based on the video frames>\n"
        "Location: <estimated or inferred location of the issue>\n"
        "Reason: <probable cause or rationale for why the ticket should be created>\n"
        "```\n\n"
        "Result:\n"
        "- Use professional and concise language.\n"
        "- Do not include headers, commentary, or any content outside the 4 fields.\n"
        "- Always fill in all 4 fields, even if you must infer based on context.\n"
        "- Analyze the sequence of frames to understand the full context of the incident.\n"
    )

def parse_ticket_output(text: str, media_id: int, content: bytes, media_type: str):
    fields = {}
    for line in text.strip().splitlines():
        if ':' in line:
            key, value = line.split(':', 1)
            fields[key.strip().lower()] = value.strip()

    # Convert bytes back to base64 string for storage
    content_str = base64.b64encode(content).decode('utf-8')

    return Ticket(
        title=fields.get('title', ''),
        description=fields.get('description', ''),
        status=OPEN,
        location=fields.get('location', ''),
        media_id=media_id,
        media_type=VIDEO,
        content=content_str,
        reason=fields.get('reason', ''),
        result=text,
        analyzed=True
    )

def generate_ticket_from_video(media_id: int) -> Ticket:
    media = fetch_media_by_id(media_id)
    content_base64, blob_type = media["content"], media["blobType"]
    
    # Decode base64 string to bytes
    content = base64.b64decode(content_base64)
    
    frame_dir = extract_frames(content, media_id)
    if not frame_dir:
        raise RuntimeError("Frame extraction failed")

    frames = []
    for filename in sorted(os.listdir(frame_dir)):
        with open(os.path.join(frame_dir, filename), "rb") as f:
            frames.append({"mime_type": "image/jpeg", "data": f.read()})

    model = genai.GenerativeModel('gemini-2.0-flash-exp')

    response = model.generate_content(
        contents=[
            {
                "role": "user",
                "parts": [
                    {"text": build_video_prompt()}
                ] + [{"inline_data": frame} for frame in frames]
            }
        ],
        generation_config={
            "temperature": 0.1,
            "top_p": 0.95,
            "top_k": 40
        }
    )

    shutil.rmtree(frame_dir)
    ticket = parse_ticket_output(response.text, media_id, content, media_type="VIDEO")
    return ticket


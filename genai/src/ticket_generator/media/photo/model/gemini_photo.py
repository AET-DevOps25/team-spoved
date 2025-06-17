import os
from dotenv import load_dotenv
from pydantic import BaseModel
import google.generativeai as genai
from ticket_generator.api.media_service import fetch_media_by_id

load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')

genai.configure(api_key=API_KEY)

OPEN = "OPEN"
PHOTO = "PHOTO"

class Ticket(BaseModel):
    title: str
    description: str
    status: str = OPEN
    location: str
    media_id: int
    media_type: str = PHOTO
    content: str
    reason: str
    result: str
    analyzed: bool

Ticket.model_rebuild()

def extract_photo_content(media_id: int):
    media = fetch_media_by_id(media_id)
    return media["content"], media["blobType"]

def build_prompt():
    return (
        "You are an AI assistant for an incident management system. "
        "Your task is to analyze an uploaded photo and generate a structured report for a new ticket. "
        "The output must strictly follow this format with no additional text:\n\n"
        "```\n"
        "Title: <short, specific summary of the issue>\n"
        "Description: <detailed explanation of what the issue is, based on the photo>\n"
        "Location: <estimated or inferred location of the issue>\n"
        "Reason: <probable cause or rationale for why the ticket should be created>\n"
        "```\n\n"
        "Result:\n"
        "- Use professional and concise language.\n"
        "- Do not include headers, commentary, or any content outside the 4 fields.\n"
        "- Always fill in all 4 fields, even if you must infer based on context.\n"
    )

def parse_ticket_output(text: str, media_id: int, content: bytes) -> Ticket:
    fields = {}
    for line in text.strip().splitlines():
        if ':' in line:
            key, value = line.split(':', 1)
            fields[key.strip().lower()] = value.strip()

    return Ticket(
        title=fields.get('title', ''),
        description=fields.get('description', ''),
        status=OPEN,
        location=fields.get('location', ''),
        media_id=media_id,
        media_type=PHOTO,
        content=content,
        reason=fields.get('reason', ''),
        result=text,
        analyzed=True
    )


def generate_ticket(media_id: int):
    content, blob_type = extract_photo_content(media_id)
    if blob_type == 'image/jpeg':
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
    elif blob_type == 'image/png':
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
    else:
        raise ValueError(f'Unsupported blob type: {blob_type}')
    
    response = model.generate_content(
        contents=[
            {
                "role": "user",
                "parts": [
                    {
                        "text": build_prompt()
                    }
                ] + [{"inline_data": {"mime_type": blob_type, "data": content}}]
            }
        ],
        generation_config={
            "temperature": 0.1,
            "top_p": 0.95,
            "top_k": 40
        }
    )

    ticket = parse_ticket_output(response.text, media_id, content)
    return ticket

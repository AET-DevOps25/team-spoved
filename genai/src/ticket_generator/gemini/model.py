import os
import traceback
from typing import Optional
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel
from ticket_generator.media.photo.model.gemini_photo import generate_ticket
from ticket_generator.media.video.model.gemini_video import generate_ticket_from_video
from ticket_generator.api.video_photo_service import update_analyzed, update_result, update_reason
from ticket_generator.api.ticket_servce import create_ticket
from ticket_generator.api.media_service import fetch_media_by_id
load_dotenv()

router = APIRouter()

class AutoTicketRequest(BaseModel):
    media_id: int
    created_by: int
    assigned_to: Optional[int] = None

class AutoTicketResponse(BaseModel):
    success: bool
    ticket_id: Optional[int] = None
    message: str

@router.post("/auto-create-ticket", response_model=AutoTicketResponse)
async def auto_create_ticket(request: AutoTicketRequest):
    """
    Automatically create a ticket from media using Gemini AI analysis.
    This is the main endpoint for the automated ticket creation feature.
    """
    
    try: 
        # Step 0: Fetch media type
        media_type = fetch_media_by_id(request.media_id)["mediaType"]

        # Step 2: Create the ticket in the database

        ticket_data = {
            "media_id": request.media_id,
            "created_by": request.created_by or 1,
            "assigned_to": request.assigned_to
        }
        
        ticket_response = create_ticket(ticket_data)
        
        # Step 3: Update video_photo table with analysis results
        update_result(request.media_id, ticket_response.get('result'))
        
        update_reason(request.media_id, ticket_response.get('reason'))

        update_analyzed(request.media_id, True)
        
        print(f"🎉 [DEBUG] Ticket creation completed successfully")
        
        return AutoTicketResponse(
            success=True,
            ticket_id=ticket_response.get('ticketId'),
            message="Ticket created successfully using AI analysis"
        )
        
    except Exception as e:
        print(f"💥 [ERROR] Exception in auto_create_ticket: {str(e)}")
        print(f"📊 [ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error creating automated ticket: {str(e)}")

@router.post("/analyze-media/{media_id}")
async def analyze_media_only(media_id: int):
    """
    Analyze media with Gemini AI without creating a ticket.
    Updates the video_photo table with analysis results.
    """
    
    try:
        
        # Generate analysis using Gemini AI
        model_ticket = generate_ticket(media_id)
        
        # Update video_photo table with analysis results
        update_result(media_id, model_ticket.result)
        update_reason(media_id, model_ticket.reason)
        update_analyzed(media_id, True)
        
        return {
            "success": True,
            "analysis": {
                "title": model_ticket.title,
                "description": model_ticket.description,
                "location": model_ticket.location,
                "reason": model_ticket.reason,
                "result": model_ticket.result
            }
        }
        
    except Exception as e:
        print(f"💥 [ERROR] Exception in analyze_media_only: {str(e)}")
        print(f"📊 [ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error analyzing media: {str(e)}")

@router.get("/health")
async def gemini_health_check():
    """Health check for Gemini service"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key or api_key == 'jifhwuehf':  # Template value
        return {"status": "unhealthy", "message": "Gemini API key not configured"}
    return {"status": "healthy", "message": "Gemini service is operational"}

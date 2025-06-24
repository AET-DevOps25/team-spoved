import os
import traceback
from typing import Optional
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel
from ticket_generator.api.ticket_servce import create_ticket
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

        ticket_data = {
            "media_id": request.media_id,
            "created_by": request.created_by or 1,
            "assigned_to": request.assigned_to
        }
        
        ticket_response = create_ticket(ticket_data)
        
        return AutoTicketResponse(
            success=True,
            ticket_id=ticket_response.get('ticketId'),
            message="Ticket created successfully using AI analysis"
        )
        
    except Exception as e:
        print(f"[ERROR] Exception in auto_create_ticket: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error creating automated ticket: {str(e)}")


@router.get("/health")
async def gemini_health_check():
    """Health check for Gemini service"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key or api_key == 'jifhwuehf':  # Template value
        return {"status": "unhealthy", "message": "Gemini API key not configured"}
    return {"status": "healthy", "message": "Gemini service is operational"}

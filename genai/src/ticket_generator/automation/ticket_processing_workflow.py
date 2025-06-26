"""
Enhanced automation ticket_processing_workflow that includes video processing
"""

import os
import requests
import traceback
from fastapi import APIRouter, HTTPException, BackgroundTasks, Header
from pydantic import BaseModel
from dotenv import load_dotenv
from ticket_generator.gemini.ticket_data_models import auto_create_ticket, AutoTicketRequest
from ticket_generator.api.utils import extract_token_from_header
from typing import Optional

load_dotenv()

router = APIRouter()

class MediaUploadEvent(BaseModel):
    media_id: int
    media_type: str
    uploaded_by: int

class WorkflowResponse(BaseModel):
    success: bool
    message: str
    ticket_id: int = None

@router.post("/media-uploaded")
async def handle_media_upload(event: MediaUploadEvent, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    """
    Handle media upload events and trigger appropriate processing
    """
    try:
        token = extract_token_from_header(authorization) if authorization else None
        
        if event.media_type.upper() == "PHOTO" or event.media_type.upper() == "VIDEO" or event.media_type.upper() == "AUDIO":
            background_tasks.add_task(
                execute_automation,
                AutoTicketRequest(
                    media_id=event.media_id,
                    created_by=event.uploaded_by
                ),
                token
            )
            return {"status": "success", "message": "Media processing queued"}
            
        else:
            return {"status": "info", "message": f"Media type {event.media_type} not supported for auto-processing"}
            
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process media upload: {str(e)}")

@router.post("/trigger-automation", response_model=WorkflowResponse)
async def trigger_automation_ticket_processing_workflow(event: MediaUploadEvent, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    """
    Main automation endpoint that gets triggered when new media is uploaded.
    This should be called by the main backend whenever a photo/video is uploaded.
    """
    
    try:
        token = extract_token_from_header(authorization) if authorization else None
        
        # Only process photos for now (can be extended for videos)
        if event.media_type.upper() not in ['PHOTO', 'VIDEO', 'AUDIO']:
            return WorkflowResponse(
                success=False,
                message=f"Automation not supported for media type: {event.media_type}"
            )
        
        # Create automation request
        auto_request = AutoTicketRequest(
            media_id=event.media_id,
            created_by=event.uploaded_by,
            assigned_to=None  # Will be assigned by business logic or left for manual assignment
        )
        
        # Execute the automation in background
        background_tasks.add_task(execute_automation, auto_request, token)
        
        
        return WorkflowResponse(
            success=True,
            message="Automation ticket_processing_workflow started successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting automation ticket_processing_workflow: {str(e)}")

async def execute_automation(request: AutoTicketRequest, auth_token: str = None):
    """
    Execute the complete automation ticket_processing_workflow.
    This runs in the background to avoid blocking the upload response.
    """
    
    try:
        
        # Call the auto-create-ticket endpoint with auth token
        result = await auto_create_ticket(request, auth_token)
        
    except Exception as e:
        # Log error (in production, use proper logging and potentially retry logic)
        print(f"[ERROR] Error in automation ticket_processing_workflow for media {request.media_id}: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")

@router.post("/webhook/media-uploaded")
async def media_upload_webhook(event: MediaUploadEvent, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    """
    Webhook endpoint that can be called by the main backend API
    when new media is uploaded to automatically trigger ticket creation.
    """
    
    try:
        token = extract_token_from_header(authorization) if authorization else None
        
        # Create automation request
        auto_request = AutoTicketRequest(
            media_id=event.media_id,
            created_by=event.uploaded_by,
            assigned_to=None
        )
        
        # Execute the automation in background with auth token
        background_tasks.add_task(execute_automation, auto_request, token)
        
        return WorkflowResponse(
            success=True,
            message="Automation workflow started successfully"
        )
        
    except Exception as e:
        print(f"[ERROR] Exception in webhook: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to start automation: {str(e)}")

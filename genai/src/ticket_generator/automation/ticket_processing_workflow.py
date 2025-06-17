"""
Enhanced automation ticket_processing_workflow that includes video processing
"""

import os
import requests
import traceback
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from ticket_generator.gemini.ticket_data_models import auto_create_ticket, AutoTicketRequest

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
async def handle_media_upload(event: MediaUploadEvent, background_tasks: BackgroundTasks):
    """
    Handle media upload events and trigger appropriate processing
    """
    try:
        if event.media_type.upper() == "PHOTO" or event.media_type.upper() == "VIDEO":
            background_tasks.add_task(
                auto_create_ticket,
                AutoTicketRequest(
                    media_id=event.media_id,
                    created_by=event.uploaded_by
                )
            )
            return {"status": "success", "message": "Photo processing queued"}
            
        else:
            return {"status": "info", "message": f"Media type {event.media_type} not supported for auto-processing"}
            
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process media upload: {str(e)}")

@router.post("/trigger-automation", response_model=WorkflowResponse)
async def trigger_automation_ticket_processing_workflow(event: MediaUploadEvent, background_tasks: BackgroundTasks):
    """
    Main automation endpoint that gets triggered when new media is uploaded.
    This should be called by the main backend whenever a photo/video is uploaded.
    """
    
    try:
        # Only process photos for now (can be extended for videos)
        if event.media_type.upper() not in ['PHOTO', 'VIDEO']:
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
        background_tasks.add_task(execute_automation, auto_request)
        
        
        return WorkflowResponse(
            success=True,
            message="Automation ticket_processing_workflow started successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting automation ticket_processing_workflow: {str(e)}")

async def execute_automation(request: AutoTicketRequest):
    """
    Execute the complete automation ticket_processing_workflow.
    This runs in the background to avoid blocking the upload response.
    """
    
    try:
        
        # Call the auto-create-ticket endpoint
        result = await auto_create_ticket(request)
        
    except Exception as e:
        # Log error (in production, use proper logging and potentially retry logic)
        print(f"💥 [ERROR] Error in automation ticket_processing_workflow for media {request.media_id}: {str(e)}")
        print(f"📊 [ERROR] Traceback: {traceback.format_exc()}")

@router.post("/webhook/media-uploaded")
async def media_upload_webhook(event: MediaUploadEvent, background_tasks: BackgroundTasks):
    """
    Webhook endpoint that can be called by the main backend API
    when new media is uploaded to automatically trigger ticket creation.
    """
    print(f"🪝 [DEBUG] Webhook called with event: {event}")
    
    try:
        print(f"🔗 [DEBUG] Calling trigger_automation_ticket_processing_workflow")
        result = await trigger_automation_ticket_processing_workflow(event, background_tasks)
        print(f"📤 [DEBUG] Webhook returning: {result}")
        return result
    except Exception as e:
        print(f"💥 [ERROR] Exception in webhook: {str(e)}")
        print(f"📊 [ERROR] Traceback: {traceback.format_exc()}")
        raise

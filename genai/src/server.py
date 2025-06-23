from dotenv import load_dotenv
load_dotenv()

import os
import uvicorn
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ticket_generator.api.media_service import router as mediaServiceRouter
from ticket_generator.api.video_photo_service import router as videoPhotoServiceRouter
from ticket_generator.api.ticket_servce import router as ticketServiceRouter
from ticket_generator.gemini.ticket_data_models import router as geminiRouter
from ticket_generator.automation.ticket_processing_workflow import router as automationRouter
from ticket_generator.api.voice_service import router as voiceServiceRouter

app = FastAPI()

# Add global exception handler for better debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "type": type(exc).__name__
        }
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, you can specify specific origins instead for production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods, including OPTIONS
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def root():
    return {"message": "Ticket Generator Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include all routers
app.include_router(mediaServiceRouter, prefix="/media", tags=["media"])
app.include_router(videoPhotoServiceRouter, prefix="/video-photo", tags=["video-photo"])
app.include_router(ticketServiceRouter, prefix="/tickets", tags=["tickets"])
app.include_router(geminiRouter, prefix="/gemini", tags=["gemini"])
app.include_router(automationRouter, prefix="/automation", tags=["automation"])
app.include_router(voiceServiceRouter, prefix="/voice", tags=["voice"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

# AI Processing Workflows

## Project Structure

```
genai
├── src/
│ ├── server.py # FastAPI server
│ └── ticket_generator/
│ ├── api/ # API endpoints
│ │ ├── voice_service.py # Voice processing
│ │ ├── media_service.py # Media handling
│ │ └── ticket_servce.py # Ticket creation
│ ├── media/ # Media processors
│ │ ├── photo/ # Image analysis
│ │ ├── video/ # Video processing
│ │ └── voice/ # Audio processing
│ └── automation/ # Workflow automation
└── tests/ # Comprehensive test suite
```

#### 1. Image/Photo Processing
- **Input**: JPEG/PNG images via base64 encoding
- **Processing**: Gemini Vision analysis
- **Output**: Structured ticket with title, description, location, and priority
- **Features**: Object detection, text extraction, issue classification

#### 2. Video Processing
- **Input**: Video files (MP4, WebM)
- **Processing**: Frame extraction → Gemini analysis
- **Output**: Comprehensive ticket from video sequence
- **Features**: Multi-frame analysis, temporal understanding

#### 3. Voice Processing
- **Input**: Audio recordings (WAV, WebM)
- **Processing**: Speech-to-text → Gemini conversation analysis
- **Output**: Structured ticket from voice description
- **Features**: 
  - Real-time transcription
  - Interactive voice chat
  - Context-aware responses
  - Automatic ticket generation after information gathering

#### 4. Automated Workflow
- **Trigger**: Media upload events
- **Processing**: Automatic routing to appropriate AI processor
- **Integration**: Seamless integration with ticket and media services
- **Monitoring**: Prometheus metrics for performance tracking

### GenAI API Endpoints

#### Voice Service (`/voice`)
- `POST /speech-to-text`: Convert speech to text
- `POST /query-ai`: Interactive AI conversation
- `POST /text-to-speech`: Convert text to speech

#### Media Processing (`/media`, `/video-photo`)
- `POST /upload`: Upload and process media files
- `GET /media/{id}`: Retrieve processed media
- `PUT /media/{id}`: Update media analysis

#### Ticket Generation (`/tickets`)
- `POST /tickets`: Create AI-generated tickets
- `GET /tickets`: Retrieve tickets with AI analysis

#### Automation (`/automation`)
- `POST /media-uploaded`: Trigger automated processing
- `POST /webhook/media-uploaded`: Webhook for external integrations

### AI Configuration

**Environment Variables**:
```bash
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
TICKET_API_URL=http://ticket-service:8081/api/v1
MEDIA_API_URL=http://media-service:8083/api/v1
```

**Model Configuration**:
```python
generation_config = {
    "temperature": 0.1,      # Low temperature for consistent results
    "top_p": 0.95,          # Nucleus sampling
    "top_k": 40             # Top-k sampling
}
```

### AI Performance Monitoring

The GenAI service includes comprehensive Prometheus metrics:
- Request counters for each AI operation
- Processing duration histograms
- Success/error rate tracking
- Resource usage monitoring

## Project Structure

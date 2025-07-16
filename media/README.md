# Media Service

A microservice for handling media file uploads, storage, and analysis in the team-spoved maintenance ticketing system. This service manages photos, videos, and audio files, integrating with the GenAI service for automated ticket generation.

## Features

- **Multi-format Media Support**: Handle photo, video, and audio files
- **File Upload & Storage**: Store media files as binary data in PostgreSQL
- **Media Analysis Integration**: Track analysis status and results from GenAI processing
- **JWT Authentication**: Secure endpoints with JWT token validation
- **Prometheus Monitoring**: Built-in metrics for monitoring service health and performance
- **Cross-Origin Support**: Configured CORS for frontend integration
- **Large File Support**: Supports files up to 10MB

## API Endpoints

### Media Management

- `POST /api/v1/media` - Upload a new media file
  - **Form Data**: `file` (MultipartFile), `mediaType` (PHOTO/VIDEO/AUDIO), `blobType` (MIME type)
  - **Response**: MediaEntity with generated ID and metadata

- `GET /api/v1/media` - Retrieve all media files
  - **Response**: List of MediaEntity objects

- `GET /api/v1/media/{mediaId}` - Get specific media by ID
  - **Response**: MediaEntity object

### Analysis Management

- `PUT /api/v1/media/{mediaId}/analyzed` - Update analysis status
  - **Body**: Boolean indicating if media has been analyzed

- `PUT /api/v1/media/{mediaId}/result` - Update analysis result
  - **Body**: String containing analysis result

- `PUT /api/v1/media/{mediaId}/reason` - Update analysis reasoning
  - **Body**: String containing analysis reasoning

### Health & Monitoring

- `GET /actuator/health` - Service health check
- `GET /actuator/info` - Service information
- `GET /actuator/prometheus` - Prometheus metrics

## Setup Instructions

### Prerequisites

- Java 21 or higher
- PostgreSQL database
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd media
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env-template .env
   ```
   Edit the `.env` file with your database credentials:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/db
   SPRING_DATASOURCE_USERNAME=spoved
   SPRING_DATASOURCE_PASSWORD=secret
   ```

3. **Build the application**
   ```bash
   ./gradlew build
   ```

4. **Run the application**
   ```bash
   ./gradlew bootRun
   ```

The service will start on port `8083` by default.

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t media-service .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up media-service
   ```

## Configuration

### Application Properties

Key configuration options in `application.properties`:

```properties
# Server Configuration
server.port=8083
spring.application.name=media-service

# Database Configuration
spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}

# File Upload Limits
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Monitoring
management.endpoints.web.exposure.include=health,info,prometheus
management.endpoint.health.show-details=always
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `spoved` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `secret` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `docker` |

### Security Configuration

The service includes JWT authentication:
- JWT tokens are validated for all endpoints
- CORS is configured for frontend integration
- Internal service communication is permitted

## Data Models

### MediaEntity

The main entity for storing media files:

```java
public class MediaEntity {
    private Integer mediaId;           // Auto-generated ID
    private MediaTypeEnum mediaType;   // PHOTO, VIDEO, or AUDIO
    private byte[] content;            // Binary file content
    private String blobType;           // MIME type (e.g., "image/jpeg")
    private boolean analyzed;          // Analysis status
    private String result;             // Analysis result
    private String reason;             // Analysis reasoning
}
```

### MediaTypeEnum

Supported media types:
- `PHOTO` - Image files (JPEG, PNG, etc.)
- `VIDEO` - Video files (MP4, WebM, etc.)
- `AUDIO` - Audio files (WAV, MP3, etc.)

## Database Schema

The service uses two main tables:

- `media` - Stores media metadata and binary content
- `video_photo` - Stores analysis results for video and photo files

## Integration

### GenAI Service Integration

The media service integrates with the GenAI service for automated analysis:
1. Media files are uploaded through this service
2. GenAI service processes the media for ticket generation
3. Analysis results are stored back in the media entity

### Frontend Integration

The service supports CORS for the following origins:
- `http://localhost:5173` (Vite development server)
- `http://localhost:3000` (React development server)
- `http://localhost:8000` (Alternative frontend)

## Testing

### Running Tests

```bash
./gradlew test
```

### Test Coverage

The service includes:
- Unit tests for all controller endpoints
- Security tests for authentication
- Integration tests for media upload and retrieval

### Test Files

- `MediaControllerTest.java` - API endpoint testing
- `MediaControllerSecurityTest.java` - Security testing

## Monitoring

The service includes Prometheus metrics for:
- Request counters for each endpoint
- Error counters for failed requests
- Custom metrics for media processing

Access metrics at: `http://localhost:8083/actuator/prometheus`

## Development

### Building

```bash
./gradlew build
```

### Running Tests

```bash
./gradlew test
```
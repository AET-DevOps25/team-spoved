# Stage 1: Build the application
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and audio processing
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the application code
COPY . .

ARG TICKET_API_URL
ARG USER_API_URL
ARG MEDIA_API_URL
ARG AUTH_API_URL
ARG GEMINI_API_KEY


ENV TICKET_API_URL=$TICKET_API_URL
ENV USER_API_URL=$USER_API_URL
ENV MEDIA_API_URL=$MEDIA_API_URL
ENV AUTH_API_URL=$AUTH_API_URL
ENV GEMINI_API_KEY=$GEMINI_API_KEY

ENV NODE_ENV=dev

# Install the package and dependencies
RUN pip install --no-cache-dir -e .

# Stage 1 (before running tests)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install -e ".[test]"
RUN pytest tests/ -v

# Stage 2: Install dependencies
# Copy requirements and install dependencies
COPY pyproject.toml setup.py setup.cfg ./

# Install the package and dependencies
RUN pip install --no-cache-dir -e .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Run the application
# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]
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

ARG GEMINI_API_KEY
ARG BACKEND_API_URL

ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV BACKEND_API_URL=$BACKEND_API_URL

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
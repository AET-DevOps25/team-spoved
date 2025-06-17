# Stage 1: Build the application
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the application code
COPY . .

# Stage 2: Install dependencies
# Copy requirements and install dependencies
COPY pyproject.toml setup.py setup.cfg ./

# Install the package and dependencies
RUN pip install --no-cache-dir -e .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Run the application
# Expose the port the app runs on
EXPOSE 3001

# Run the application
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "3001"]
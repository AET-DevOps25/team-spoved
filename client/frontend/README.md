# SpOveD Frontend

The SpOveD (Spoken Oversight Development) frontend is a React + TypeScript application built with Vite that provides a web interface for the SpOveD ticketing and media processing system.

## Table of Contents

- [Features](#features)
- [Usage Guide](#usage-guide)
- [Local Development Setup](#local-development-setup)
- [AWS Deployment](#aws-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Configuration Guide](#configuration-guide)
- [Architecture](#architecture)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Features

- **Authentication**: JWT-based login and registration system
- **Role-based Access**: Support for Worker and Supervisor roles
- **Media Processing**: Photo capture, video recording, and audio recording
- **Ticket Management**: Create, view, assign, and manage tickets
- **Real-time Updates**: Live updates for ticket status changes
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Usage Guide

### User Roles

#### Worker
- **Dashboard**: Access to media capture tools and ticket viewing
- **Media Capture**: Take photos, record videos, and capture audio
- **Ticket View**: View assigned tickets and update status
- **Auto-generation**: Tickets are automatically generated from media uploads

#### Supervisor
- **Ticket Management**: View all tickets in the system
- **Assignment**: Assign tickets to workers
- **Status Updates**: Update ticket status and priority
- **Team Overview**: Monitor team productivity and workload

### Navigation

1. **Login**: Start at the login page (`/`)
2. **Registration**: Create new accounts at `/register`
3. **Worker Dashboard**: Access worker tools at `/worker`
4. **Supervisor Dashboard**: Access supervisor tools at `/supervisor`

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Access to the backend services

### Step-by-Step Setup

1. **Clone the repository** and navigate to the frontend directory:
   ```bash
   cd client/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env-template .env
   ```
   Edit `.env` with your local configuration:
   ```bash
   VITE_TICKET_API_URL=http://localhost:8081/api/v1
   VITE_GENAI_API_URL=http://localhost:8000
   VITE_AUTH_API_URL=http://localhost:8030
   VITE_MEDIA_API_URL=http://localhost:8083/api/v1
   VITE_USER_API_URL=http://localhost:8082/api/v1
   ```

4. **Start the backend services**:
   ```bash
   # From the project root
   docker-compose up -d
   ```

5. **Run the frontend in development mode**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend services: Various ports (8081, 8082, 8083, 8030, 8000)

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage

# Lint code
npm run lint

# Preview production build
npm run preview
```

## AWS Deployment

### Prerequisites

- AWS CLI configured
- Docker with buildx support
- Access to AWS ECR or container registry

### Deployment Steps

1. **Build the Docker image**:
   ```bash
   docker build -t spoved-frontend \
     --build-arg VITE_TICKET_API_URL=https://your-api-url/api/v1 \
     --build-arg VITE_USER_API_URL=https://your-api-url/api/v1 \
     --build-arg VITE_MEDIA_API_URL=https://your-api-url/api/v1 \
     --build-arg VITE_AUTH_API_URL=https://your-auth-url \
     --build-arg VITE_GENAI_API_URL=https://your-genai-url \
     .
   ```

2. **Tag and push to ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker tag spoved-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/spoved-frontend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/spoved-frontend:latest
   ```

3. **Deploy using docker-compose**:
   ```bash
   # Use the AWS-specific compose file
   docker-compose -f compose.aws.yml up -d
   ```

### AWS Environment Variables

Set these environment variables in your AWS deployment:

```bash
VITE_TICKET_API_URL=https://your-api-gateway-url/api/v1
VITE_USER_API_URL=https://your-api-gateway-url/api/v1
VITE_MEDIA_API_URL=https://your-api-gateway-url/api/v1
VITE_AUTH_API_URL=https://your-auth-service-url
VITE_GENAI_API_URL=https://your-genai-service-url
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster access
- Helm 3.x installed
- kubectl configured

### Deployment Steps

1. **Configure Helm values**:
   ```bash
   # Edit helm/spoved-app/values.yaml
   client:
     image:
       repository: ghcr.io/aet-devops25/team-spoved/client
       tag: latest
       pullPolicy: Always
     service:
       type: ClusterIP
       port: 3000
       targetPort: 3000
     replicaCount: 1
   ```

2. **Deploy with Helm**:
   ```bash
   # From the project root
   helm upgrade --install spoved-app ./helm/spoved-app \
     --namespace devops25-team-spoved \
     --create-namespace \
     --set geminiApiKey="your-gemini-api-key"
   ```

3. **Verify deployment**:
   ```bash
   kubectl get pods -n devops25-team-spoved
   kubectl get services -n devops25-team-spoved
   ```

### Kubernetes Configuration

The frontend is configured to work with:
- **Ingress**: NGINX ingress controller with TLS
- **Service**: ClusterIP service on port 3000
- **Resource Limits**: 500m CPU, 256Mi memory
- **Auto-scaling**: Based on CPU usage

## Configuration Guide

### Environment Variables

The frontend uses Vite's environment variable system. All variables must be prefixed with `VITE_`:

| Variable | Description | Default (Local) |
|----------|-------------|----------------|
| `VITE_TICKET_API_URL` | Ticket service API endpoint | `http://localhost:8081/api/v1` |
| `VITE_USER_API_URL` | User service API endpoint | `http://localhost:8082/api/v1` |
| `VITE_MEDIA_API_URL` | Media service API endpoint | `http://localhost:8083/api/v1` |
| `VITE_AUTH_API_URL` | Authentication service endpoint | `http://localhost:8030` |
| `VITE_GENAI_API_URL` | GenAI service endpoint | `http://localhost:8000` |

### Configuration Files

#### Core Configuration

- **`package.json`**: Project dependencies and scripts
- **`vite.config.mts`**: Vite build configuration with React and Tailwind
- **`tsconfig.json`**: TypeScript configuration
- **`eslint.config.js`**: ESLint rules and configuration

#### Build Configuration

- **`Dockerfile`**: Multi-stage build with Node.js and Nginx
- **`nginx.conf`**: Nginx configuration for production serving
- **`.dockerignore`**: Files to exclude from Docker build context

#### Testing Configuration

- **`jest.config.ts`**: Jest configuration for unit tests
- **`tsconfig.jest.json`**: TypeScript configuration for tests
- **`src/test/setup.ts`**: Test environment setup and mocks

### Docker Configuration

The `Dockerfile` uses a multi-stage build:

1. **Builder stage**: Installs dependencies, runs tests, and builds the application
2. **Production stage**: Serves the built application using Nginx

Key Docker build arguments:
```dockerfile
ARG VITE_TICKET_API_URL
ARG VITE_USER_API_URL
ARG VITE_MEDIA_API_URL
ARG VITE_AUTH_API_URL
ARG VITE_GENAI_API_URL
```

### Nginx Configuration

Production deployment uses Nginx with:
- **Port**: 3000
- **Gzip compression**: Enabled for performance
- **SPA routing**: Fallback to index.html for client-side routing
- **Security headers**: Various security configurations
- **Static file serving**: Optimized for asset delivery

## Architecture

### Tech Stack

- **Frontend Framework**: React 19.1.0
- **Build Tool**: Vite 6.3.5
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS 4.1.7
- **Routing**: React Router DOM 7.6.0
- **HTTP Client**: Axios 1.9.0
- **Testing**: Vitest 3.2.4, Testing Library
- **Authentication**: JWT with jwt-decode 4.0.0

### Project Structure

```
src/
├── api/           # API service layer
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── test/          # Test utilities and mocks
├── types/         # TypeScript type definitions
├── views/         # Page components
└── assets/        # Static assets
```

### Key Components

- **Authentication**: JWT-based with role-based access control
- **Media Processing**: Photo, video, and audio capture capabilities
- **Ticket Management**: Full CRUD operations with real-time updates
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Component and service testing
- **Integration Tests**: API integration testing
- **Mocking**: Axios requests and browser APIs
- **Coverage**: Comprehensive test coverage reporting

### Test Configuration

Tests are configured with:
- **Vitest**: Fast unit test runner
- **Testing Library**: React component testing utilities
- **JSdom**: Browser environment simulation
- **Mock APIs**: Axios mock adapter for API testing

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure variables are prefixed with `VITE_`
   - Check `.env` file is in the correct location
   - Restart development server after changes

2. **API Connection Issues**:
   - Verify backend services are running
   - Check CORS configuration
   - Validate API URLs in environment variables

3. **Build Failures**:
   - Clear node_modules and reinstall dependencies
   - Check TypeScript errors with `npm run build`
   - Verify all environment variables are set in Docker build

4. **Authentication Problems**:
   - Check JWT token expiration
   - Verify sessionStorage/localStorage data
   - Ensure auth service is accessible

### Debug Commands

```bash
# Check environment variables
npm run dev -- --debug

# Analyze bundle size
npm run build && npm run preview

# Check for dependency issues
npm audit

# Clean build artifacts
rm -rf dist node_modules package-lock.json
npm install
```

### Development Tips

- Use browser DevTools for debugging React components
- Monitor network requests in DevTools for API debugging
- Check console for error messages and warnings
- Use React DevTools extension for component inspection

---

For more information about the overall system architecture and other services, refer to the main project README.md file.
```

This comprehensive README covers all the requested sections:

1. **Usage Guide** - How to use the application for different roles
2. **Local dev step-by-step** - Complete setup instructions for local development
3. **AWS deployment** - Steps for deploying to AWS
4. **K8s deployment** - Kubernetes deployment with Helm
5. **Configuration guide** - Detailed explanation of all configuration files including:
   - Environment variables (`.env-template`)
   - Build configuration (`vite.config.mts`)
   - Docker configuration (`Dockerfile`, `nginx.conf`)
   - TypeScript configuration (`tsconfig.json` files)
   - Testing configuration (`jest.config.ts`)
   - Package configuration (`package.json`)

The README is structured to be developer-friendly with clear sections, code examples, and troubleshooting guidance.

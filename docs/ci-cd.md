# CI/CD Pipeline Documentation

## Overview

This document provides comprehensive documentation for the CI/CD pipeline of the AI-Powered Ticketing Service. The pipeline is built using GitHub Actions and implements a complete DevOps workflow including testing, building, security scanning, and deployment to multiple environments.

## Pipeline Architecture

The CI/CD system consists of four main workflows that work together to ensure code quality, security, and reliable deployments:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test Pipeline │    │  Build Pipeline │    │ AWS Deployment  │    │ K8s Deployment  │
│                 │    │                 │    │                 │    │                 │
│ • Unit Tests    │───▶│ • Docker Build  │───▶│ • Terraform     │    │ • Helm Deploy   │
│ • Integration   │    │ • Multi-arch    │    │ • Ansible       │    │ • Rolling Update│
│ • Security      │    │ • Registry Push │    │ • EC2 Deploy    │    │ • Health Checks │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```
```
.github/workflows/
├── test.yml           # Test pipeline
├── build.yml          # Build pipeline
├── aws_deploy.yml     # AWS deployment
└── k8s-deployment.yaml # Kubernetes deployment
```

#### Infrastructure as Code
```
terraform/
├── main.tf           # AWS infrastructure
├── variables.tf      # Configuration variables
└── outputs.tf        # Infrastructure outputs

ansible/
└── docker-deploy.yml # Application deployment
```

#### Kubernetes
```
helm/spoved-app/
├── Chart.yaml        # Helm chart metadata
├── values.yaml       # Default configuration
└── templates/        # Kubernetes manifests
```

## Getting Started

### 1. Setting Up CI/CD

#### Prerequisites
- GitHub repository with appropriate permissions
- AWS account with OIDC configured
- Kubernetes cluster access
- Required secrets configured

#### Initial Setup
1. **Configure GitHub Secrets**:
   ```bash
   # Add secrets in GitHub repository settings
   K8_USER_TOKEN=<kubernetes-token>
   GEMINI_API_KEY=<gemini-api-key>
   ```

2. **Configure AWS OIDC**:
   ```bash
   # Create OIDC provider in AWS
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
   ```

3. **Set up Kubernetes Access**:
   ```bash
   # Create service account
   kubectl create serviceaccount github-actions
   kubectl create clusterrolebinding github-actions \
     --clusterrole=cluster-admin \
     --serviceaccount=default:github-actions
   ```

### 2. Running Pipelines

#### Trigger Pipelines
- Push to `dev` or `main` branch
- Create pull request
- Manual workflow dispatch

#### Monitor Pipeline Execution
- GitHub Actions tab in repository
- Real-time logs and status
- Slack notifications (if configured)

### 3. Customization

#### Adding New Services
1. Add service to build matrix
2. Create Dockerfile for service
3. Add Helm chart templates
4. Update deployment configurations

#### Environment Configuration
1. Update `values.yaml` for different environments
2. Create environment-specific secrets
3. Configure branch protection rules

##

## CI/CD Workflows

### 1. Testing Workflow (test.yml)

Ensures all services meet quality standards through various testing strategies.

### Key Features:

- Unit and integration tests for backend and frontend
- Security testing for APIs and access control
- AI service validation using pytest

***Back-End Services (Java + Gradle):***

```
- Java Version: 21 (Eclipse Temurin)
- Testing Tools: JUnit 5, Spring Boot Test
- Integration: In-memory H2 database
```

***Frontend (React + Vite):***

```
- Runtime: Node.js 22
- Testing: Vitest for components, hooks, and services
```

***GenAI Microservice (Python + FastAPI):***

```
- Python Version: 3.9
- Framework: pytest with async and FastAPI TestClient
```

### 2. Build Workflow ```(build.yml)```

Builds Docker images for all services and pushes them to GitHub Container Registry (GHCR).

### Key Features:

- Matrix builds for concurrent jobs

- Multi-architecture support (amd64, arm64)

- Docker metadata and tagging conventions

- Build cache optimization with GitHub Actions

### Tag Examples:

```latest``` (main branch)

```dev``` (dev branch)

```feature-*``` (feature branches)

```pr-<ID>``` (pull requests)

### 3. AWS Deployment Workflow ```(aws_deploy.yml)```
Provision AWS infrastructure and deploy containerized applications using IaC tools.

***Job 1: Terraform***

- Authenticated via GitHub OIDC

- Provisions EC2 instances, networking components, and security groups

***Job 2: Ansible***

- Installs Docker and dependencies

- Deploys services using Docker Compose

- Utilizes AWS SSM for secure access

### 4. Kubernetes Deployment Workflow ```(k8s-deployment.yaml)```

Deploys applications to Kubernetes clusters using Helm.

## Security

### Authentication

- ***GitHub OIDC:*** Secure and temporary credentials for AWS

- ***Kubernetes Token:*** Used by service accounts with minimal privilege

- ***GitHub Secrets:*** Scoped and environment-specific credentials

### Secret Management

- Store secrets in GitHub encrypted vault

- Rotate secrets regularly

- Use least privilege principle for all tokens and credentials

### Security Scanning
- ***Dependabot:*** Dependency updates

- ***Image Scanning:*** Vulnerabilities in container builds

- ***Static Analysis:*** ESLint, SpotBugs, and optional SonarQube integration

## Deployment Strategies

### Environment Management

- ***Development:*** Quick deployments on dev branch push

- ***Production:*** Controlled releases on main, with blue-green strategy

## Rollback Mechanisms

### Automatic Rollback:

- Triggered by failing health probes or deployment timeouts

***Manual Rollback:***

```
helm rollback spoved <revision> -n spoved-2
kubectl rollout undo deployment/ticket -n spoved-2
```

## Observability & Monitoring

### Pipeline Metrics
- Build duration and frequency

- Failure trends

- Test coverage and flakiness

### Application Monitoring
- Prometheus Integration via Spring Boot Actuator

- Health endpoints: /health, /ready, /metrics

- Custom dashboards for service performance


## Troubleshooting

### Build Failures

***Out of Disk:*** 

```docker system prune -a```

***Test Failures:***

```
./gradlew test --info
npm test -- --verbose
pytest tests/ -v -s
```

### Deployment Errors

***Terraform Lock:*** ```terraform force-unlock <lock-id>```

***Pod Failures:***
```
kubectl logs -f deployment/<name> -n <namespace>
kubectl describe pod <pod-name>
```

### Authentication Issues
- Validate OIDC trust relationships in AWS

- Confirm GitHub secret access levels and naming conventions

## Best Practices

### Pipeline Design
- Fail Fast: Short-circuit on early test failures

- Parallelism: Leverage matrix jobs for speed

- Idempotency: Repeatable Terraform and Helm runs

### Security Principles

- Least Privilege: Granular IAM and Kubernetes RBAC

- Environment Isolation: Separate secrets and resources

- Auditability: Log all access and deployments

### Maintenance

- Regular updates of dependencies and base images

- Action version upgrades (e.g., actions/checkout@v4)

- Scheduled audits of secrets and permissions

## Key Configuration Files

### GitHub Actions Workflows

```
.github/workflows/
├── test.yml
├── build.yml
├── aws_deploy.yml
└── k8s-deployment.yaml
```

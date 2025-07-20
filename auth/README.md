# Auth Service (Spoved Platform)

## Overview

The Auth Service provides user registration, authentication, and JWT issuance for the Spoved platform. It is built with Spring Boot and uses PostgreSQL for persistence. The service exposes REST endpoints for login and registration, and integrates with monitoring via Prometheus.

## Tech Stack

- **Java Version:** 21 (see Dockerfile: `eclipse-temurin:21-jre`)
- **Framework:** Spring Boot
- **Authentication:** JWT (JSON Web Token)
- **Database:** PostgreSQL

## Endpoints

- `POST /auth/register` — Register a new user (`name`, `password`, `role`)
- `POST /auth/login` — Authenticate and receive JWT token

To see the precise expected responses in the API, look at the `openapi.yaml` file in this directory or at the under `api/`

## Environment Variables

### Required (see `docker-compose.yml` and Helm `values.yaml`):

- `SPRING_PROFILES_ACTIVE` (default: `docker`)
- `SPRING_DATASOURCE_URL` (e.g. `jdbc:postgresql://database:5432/db`)
- `SPRING_DATASOURCE_USERNAME` (default: `spoved`)
- `SPRING_DATASOURCE_PASSWORD` (default: `secret`)
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME` (`org.postgresql.Driver`)
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (`validate`)
- `SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA` (`db`)
- `SPRING_JPA_SHOW_SQL` (`true`)
- `SPRING_JPA_DATABASE_PLATFORM` (`org.hibernate.dialect.PostgreSQLDialect`)
- `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE` (`health,info,prometheus`)
- `MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED` (`true`)
- `MANAGEMENT_ENDPOINT_PROMETHEUS_ENABLED` (`true`)
- `MANAGEMENT_METRICS_EXPORT_PROMETHEUS_ENABLED` (`true`)

### Helm Chart (`helm/spoved-app/values.yaml`):

```yaml
auth:
  image:
    repository: ghcr.io/aet-devops25/team-spoved/auth
    tag: latest
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 8030
    targetPort: 8030
  replicaCount: 1
  resources:
    limits:
      cpu: "500m"
      memory: "256Mi"
    requests:
      cpu: "50m"
      memory: "50Mi"
```

## Running Locally (Outside Container)

1. **Install Java 21** (e.g. Temurin or OpenJDK)
2. **Install PostgreSQL** and create a database (`db`) and user (`spoved`).
3. **Configure environment variables** (see above).
4. **Build and run:**
   ```bash
   ./gradlew bootJar
   java -jar build/libs/app.jar
   ```
5. **Access API:** `http://localhost:8030/auth`

## Running in Docker

1. **Build and start with Docker Compose:**
   ```bash
   docker compose up --build auth
   ```
2. **Service will be available at:** `http://localhost:8030/auth`
3. **Database and other dependencies are managed by Docker Compose.**

## Running in Kubernetes (Helm)

1. **Set up Kubernetes cluster (Minikube, Rancher, etc.)**
2. **Install Helm 3+**
3. **Deploy with Helm:**
   ```bash
   helm upgrade spoved-app ./helm/spoved-app -n spoved-2 --install
   ```
4. **Configure values in `helm/spoved-app/values.yaml` as needed.**
5. **Port-forward or use ingress to access the service.**

## Monitoring

- Prometheus metrics exposed at `/actuator/prometheus`
    - Request and error counters
    - Timers for request duration
- Health endpoint at `/actuator/health`

## Security

- Change default secrets in production!
- JWT secret should be managed securely (not hardcoded).
- Enable HTTPS and restrict network access as needed.
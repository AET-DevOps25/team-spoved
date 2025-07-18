# Traefik Configuration

This configuration sets up Traefik as a API gateway and load balancer for the spOveD application stack.

## File Structure

```
traefik/
├── traefik.yml         # Main configuration file
└── README.md           # README
```

## Overview

Traefik acts as the entry point for all HTTP traffic, automatically discovering Docker services and routing requests based on labels.

## Configuration Details

### API & Dashboard
```yaml
api:
  dashboard: true    # Enable the web dashboard
  insecure: true     # Allow access without authentication
```

### Logging
```yaml
log:
  level: DEBUG       # Verbose logging for troubleshooting
```

### Entry Points
```yaml
entryPoints:
  web:
    address: ":8080"     # Main application traffic
  traefik:
    address: ":8089"     # Dashboard access
```

- **Port 8080**: Routes to your application services
- **Port 8089**: Traefik dashboard interface

### Docker Provider
```yaml
providers:
  docker:
    exposedByDefault: false    # Services must opt-in via labels
```

- **Auto-discovery**: Automatically detects Docker containers
- **Explicit exposure**: Only services with `traefik.enable=true` are exposed
- **Label-based routing**: Uses Docker labels for configuration

## How to start 
````bash
# In the root of the repo run
docker compose up --build -d traefik
````

You will be able to see the dashboard, if you go to the ``http://localhost:8089``. However, without any services running dashboard will not be useful. Therefore, we recommend you to start extra services in order to get better visualization of the API gateway.
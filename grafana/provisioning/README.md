# Grafana Monitoring Setup

This directory contains Grafana provisioning configuration for the spOveD application monitoring stack. It automatically sets up dashboards, data sources, alerts, and folders when Grafana starts.

## Overview

Grafana is configured to monitor the spOveD microservices architecture with:
- **Prometheus integration** for metrics collection
- **Pre-built dashboards** for service monitoring
- **Automated alerting** for critical system events
- **Custom initialization** script for setup validation

## Directory Structure

```
grafana/provisioning/
├── init_grafana.sh              # Custom initialization script
├── README.md                    # This documentation
├── alerting/
│   └── spoved_vm_alerts.yaml    # Alert rules for VM and service monitoring
├── dashboards/
│   ├── dashboard.json           # Main monitoring dashboard
│   └── dashborads.yaml          # Dashboard provider configuration
├── datasources/
│   └── prometheus.yaml          # Prometheus data source configuration
└── folders/
    └── folders.yaml             # Organization folders for alerts
```

## Prerequisites
* At least one data source is configured (Prometheus etc.)
* Services that you want to monitor are running

## Configuration Files

### Data Sources (`datasources/prometheus.yaml`)
Configures Prometheus as the primary metrics source:
- **URL**: `http://prometheus:9090` (Docker service name)
- **Access**: Proxy mode through Grafana
- **Default**: Set as the default data source

### Dashboards (`dashboards/`)
- **Provider**: File-based dashboard loading
- **Location**: `/etc/grafana/provisioning/dashboards`
- **Auto-reload**: Enabled for configuration changes

The main dashboard includes:
- **Virtual Memory Usage**: Process memory consumption by service
- **Startup Time**: Application ready time metrics  
- **HTTP Request Duration**: Maximum request processing times

### Alerting (`alerting/spoved_vm_alerts.yaml`)
Three critical alert rules:

#### 1. High Memory Usage
- **Trigger**: VM memory usage > 80%
- **Duration**: 5 minutes
- **Severity**: Critical
- **Query**: `(sum(process_virtual_memory_bytes) / sum(node_memory_MemTotal_bytes)) * 100 > 80`

#### 2. Slow Service Startup
- **Trigger**: Service startup > 30 seconds
- **Duration**: 5 minutes  
- **Severity**: Warning
- **Query**: `max by (service) (my_service_startup_seconds) > 30`

#### 3. Slow HTTP Requests
- **Trigger**: 95th percentile request duration > 2 seconds
- **Duration**: 5 minutes
- **Severity**: Critical
- **Query**: `histogram_quantile(0.95, sum by (le,service) (rate(http_request_duration_seconds_bucket[5m]))) > 2`

### Folders (`folders/folders.yaml`)
Creates organizational structure:
- **spOveD Alerts**: Container for all application alerts

## Monitored Services

The dashboard tracks these spOveD microservices:

| Service | Port | Display Name | Metrics |
|---------|------|--------------|---------|
| `ticket:8081` | 8081 | Ticketing Service | Memory, startup time, HTTP duration |
| `user:8082` | 8082 | User Service | Memory, startup time, HTTP duration |
| `media:8083` | 8083 | Media Service | Memory, startup time, HTTP duration |
| `auth:8030` | 8030 | Authentication Service | Memory, startup time, HTTP duration |
| `genai:8000` | 8000 | Generative AI Service | Memory usage |
| `prometheus:9090` | 9090 | Prometheus | Memory usage |
| `traefik:8089` | 8089 | Traefik | Memory usage |

## Initialization Script (`init_grafana.sh`)

Custom startup script that:
1. **Validates provisioning files** exist
2. **Logs configuration status** for debugging
3. **Starts Grafana server** with `/run.sh`

### Validation Checks
- Data source file: `/etc/grafana/provisioning/datasources/prometheus.yaml`
- Dashboard directory: `/etc/grafana/provisioning/dashboards`
- JSON dashboard count in directory

## Usage with Docker Compose
Start the grafana after all to observed services are started using following command:
````bash
docker compose up --build -d grafana
````

## Accessing Grafana

1. **Web Interface**: `http://localhost:3000`
2. **Default Credentials**: `admin/admin`
3. **Dashboard**: Pre-loaded as "dashboard" in "Dashboards" 
4. **Alerts**: Available in "spOveD Alerts" folder in the "Alert rules"

## Expected Metrics

Your applications should expose these Prometheus metrics:

### Required Metrics
```promql
# Memory usage
process_virtual_memory_bytes{instance="service:port"}

# Startup time  
application_ready_time_seconds{instance="service:port"}
my_service_startup_seconds{service="service_name"}

# HTTP duration
http_request_duration_seconds_bucket{service="service_name"}
http_server_requests_active_seconds_max{instance="service:port"}

# System memory (for alerts)
node_memory_MemTotal_bytes{instance="service:port"}
```

## Customization

### Adding New Dashboards
1. Create dashboard in Grafana UI
2. Export JSON model
3. Place in `dashboards/` directory
4. Restart Grafana container

### Modifying Alerts
1. Edit `spoved_vm_alerts.yaml`
2. Adjust thresholds, queries, or duration
3. Restart Grafana to reload rules

### Adding Data Sources
1. Create new YAML in `datasources/`
2. Configure connection details
3. Reference in dashboards with `uid`

## Security Considerations

- **Change default passwords** in production
- **Restrict network access** to Grafana port
- **Use environment variables** for sensitive configuration
- **Enable HTTPS** for production deployments
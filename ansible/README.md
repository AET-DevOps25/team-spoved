# Ansible Docker Deployment

This Ansible playbook automatically installs Docker and Docker Compose on AWS EC2 instance via SSH. It's designed to provision fresh EC2 instances or other Ubuntu-based systems for containerized application deployment.

## Prerequisites
- **Ansible** 2.9+ installed
- **SSH access** to target hosts
- **Private key** for authentication

## File Structure

```
ansible/
├── docker-deploy.yml    # Main playbook
└── README.md            # Documentation
```

## Overview

The playbook performs the following tasks:
1. **Installs prerequisites** for Docker repository access
2. **Adds Docker's official APT repository** with proper GPG verification
3. **Installs Docker Engine** and related components
4. **Configures user permissions** for non-root Docker access

## Playbook Configuration

### Target Hosts
- **Connection**: SSH
- **Remote User**: `ubuntu` (default for Ubuntu AMIs)
- **Privilege Escalation**: `sudo` (required for system package installation)
- **Architecture Support**: Auto-detects x86_64 (amd64) and ARM64 architectures

### Variables
```yaml
vars:
  ansible_user: ubuntu    # SSH user for connection
```

## Tasks Breakdown

### 1. Install APT Prerequisites
```yaml
- apt-transport-https   # HTTPS repository support
- ca-certificates      # Certificate verification
- curl                 # Download utilities
- gnupg                # GPG key verification
- lsb-release          # Distribution detection
```

### 2. Docker Repository Setup
- Creates `/etc/apt/keyrings/` directory for GPG keys
- Downloads Docker's official GPG key
- Adds Docker APT repository with architecture detection
- Updates package cache

### 3. Docker Installation
Installs the complete Docker stack:
```yaml
- docker-ce              # Docker Engine
- docker-ce-cli          # Docker CLI
- containerd.io          # Container runtime
- docker-buildx-plugin   # Multi-platform builds
- docker-compose-plugin  # Docker Compose 
```

### 4. User Configuration
- Adds `ubuntu` user to the `docker` group
- Enables non-root Docker command execution

## Usage
This playbook is meant to work along with the terraform script that is available under ``../terraform/main.tf`` to provide working AWS EC2 instance for the delpoyment of the spOveD app. Consequently, it is executed automatically after EC2 instance creation is finished.

## Post-Installation

After Docker installation, you can:
1. Connect to the created instance
1. **Deploy applications** using `docker compose`
2. **Pull container images** from registries
3. **Run the spOveD application stack**
4. **Set up monitoring** and logging
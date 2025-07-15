# Terraform Infrastructure

This Terraform configuration creates an AWS EC2 instance that is used by ansible configuration to deploy spOveD app in the cloud.

## Prerequisites

1. **AWS CLI configured** with appropriate credentials and rights
2. **SSH key pair** pregenerated ssh keypair for the later ssh connections, both stored as secrets
3. **Private key** available at `{{SECRETS.AWS_EC2_PRIVATE}}`
4. **Terraform** installed locally
5. **Private key** should have proper permissions (`chmod 600`)


## File Structure

```
terraform/
├── main.tf              # Infrastructure configuration
└── README.md            # README
```

## Architecture Overview

The infrastructure creates:
- **VPC** with custom CIDR block
- **Public subnet** in us-east-1a
- **Internet Gateway** for public access
- **Security Group** with SSH, HTTP, and HTTPS access
- **EC2 instance** running Ubuntu 22.04
- **Automated deployment** via Ansible playbook

## Resources Created

### Networking
- **VPC**: `10.0.0.0/16` (configurable)
- **Subnet**: `10.0.0.0/24` in us-east-1a (configurable)
- **Internet Gateway**: Provides internet access
- **Route Table**: Routes traffic to IGW

### Security
- **Security Group**: Allows inbound traffic on:
  - Port 22 (SSH) from anywhere
  - Port 80 (HTTP) from anywhere  
  - Port 443 (HTTPS) from anywhere
  - All outbound traffic allowed

## Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `vpc_cidr_block` | `10.0.0.0/16` | CIDR block for the VPC |
| `subnet_cidr_block` | `10.0.0.0/24` | CIDR block for the subnet |
| `env_prefix` | `spOveD` | Prefix for resource names |
| `ssh_private_key` | `{{SECRETS.AWS_EC2_PRIVATE}}` | SSH private key that is used for the ssh connection after the instance is deployed |
| `docker_ports` | `[8080, 3000, 5432]` | Ports used by the application |

## Usage

### Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

## Outputs
- `host_public_ip`: The public IP address of the created EC2 instance

## Automatic Deployment

After creating the EC2 instance, Terraform automatically:

1. **Triggers** the server configuraion using Ansible
2. **Runs** the Ansible playbook from `../ansible/docker-deploy.yml`
3. **Deploys** the Docker containers to the new server

The Ansible command executed:
```bash
ansible-playbook \
  --inventory <PUBLIC_IP>, \
  --private-key {{SECRETS.AWS_EC2_PRIVATE}} \
  docker-deploy.yml
```

## Cleanup

```bash
# Destroy all resources
terraform destroy
```

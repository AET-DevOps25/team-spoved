terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

variable "aws_region" { default = "ap-south-1" }
variable "vpc_cidr_block" { default = "10.0.0.0/16" }
variable "subnet_cidr_block" { default = "10.0.0.0/24" }
variable "env_prefix" { default = "spOveD" }
variable "ssh_key_public" { default = "~/.ssh/aws.pub" }
variable "ssh_private_key" { default = "~/.ssh/aws" }
variable "docker_ports" { default = [8080, 3000, 5432] }

# Use Ubuntu 22.04 (Jammy) instead of 20.04 (Focal)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr_block
  tags       = { Name = "${var.env_prefix}-vpc" }
}

resource "aws_subnet" "this" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.subnet_cidr_block
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.env_prefix}-subnet" }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.env_prefix}-igw" }
}

resource "aws_route_table" "this" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = { Name = "${var.env_prefix}-rt" }
}

resource "aws_route_table_association" "this" {
  subnet_id      = aws_subnet.this.id
  route_table_id = aws_route_table.this.id
}

resource "aws_security_group" "host_sg" {
  name        = "${var.env_prefix}-sg"
  description = "Allow SSH, HTTP, HTTPS"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.env_prefix}-sg"
  }
}

resource "aws_key_pair" "ssh-key" {
  key_name   = "spOveD-key"
  public_key = file(var.ssh_key_public)
}

resource "aws_instance" "app_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t2.micro"
  key_name                    = aws_key_pair.ssh-key.key_name
  subnet_id                   = aws_subnet.this.id
  vpc_security_group_ids      = [aws_security_group.host_sg.id]
  associate_public_ip_address = true

  tags = {
    Name = "spOveD"
  }
}

output "host_public_ip" {
  value = aws_instance.app_server.public_ip
}

resource "null_resource" "configure_server" {
  triggers = {
    trigger = aws_instance.app_server.public_ip
  }

  provisioner "local-exec" {
    working_dir = "../ansible"
    command     = <<EOT
ansible-playbook \
  --inventory ${aws_instance.app_server.public_ip}, \
  --private-key ~/.ssh/aws \
  docker-deploy.yml
EOT
  }
}

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
  region = var.aws_region
}

variable "aws_region"        { default = "us-east-1" }
variable "vpc_cidr_block"    { default = "10.0.0.0/16" }
variable "subnet_cidr_block" { default = "10.0.0.0/24" }
variable "env_prefix"        { default = "spOveD" }
variable "docker_ports"      { default = [8080, 3000, 5432] }

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# — VPC + subnet + IGW + route table —
resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr_block
  tags = { Name = "${var.env_prefix}-vpc" }
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
  description = "Allow HTTP(S) and SSM"
  vpc_id      = aws_vpc.this.id

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
  # no SSH ingress needed
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.env_prefix}-sg" }
}

# — IAM Role & Instance Profile for SSM —
data "aws_iam_policy_document" "ssm_assume_role" {
  statement {
    effect    = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ssm" {
  name               = "${var.env_prefix}-ssm-role"
  assume_role_policy = data.aws_iam_policy_document.ssm_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm" {
  name = "${var.env_prefix}-ssm-profile"
  role = aws_iam_role.ssm.name
}

# — EC2 Instance —
resource "aws_instance" "app_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.this.id
  vpc_security_group_ids      = [aws_security_group.host_sg.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ssm.name

  tags = { Name = "${var.env_prefix}-app" }
}

output "instance_ids" {
  value = [aws_instance.app_server.id]
}

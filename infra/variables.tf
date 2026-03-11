variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai — closest for India
}

variable "project" {
  description = "Project name prefix applied to all resource names and tags"
  type        = string
  default     = "raagpath"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "Your public IP in CIDR notation for SSH access (e.g. 1.2.3.4/32)"
  type        = string
}

variable "db_username" {
  description = "Master username for RDS PostgreSQL"
  type        = string
  default     = "raagpath"
}

variable "db_password" {
  description = "Master password for RDS PostgreSQL — never hardcode, always pass via tfvars"
  type        = string
  sensitive   = true
}

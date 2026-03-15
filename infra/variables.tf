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
  description = "CIDR allowed for SSH. Default open (key pair is the real security)."
  type        = string
  default     = "0.0.0.0/0"
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

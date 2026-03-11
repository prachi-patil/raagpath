output "ec2_public_ip" {
  description = "Public IP — use this for your domain's A record"
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.app.public_dns
}

output "ssh_command" {
  description = "Ready-to-run SSH command"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_instance.app.public_ip}"
}

output "rds_endpoint" {
  description = "RDS host:port — paste into application.yml spring.datasource.url"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "s3_bucket_name" {
  description = "S3 bucket name — use in application.yml and Next.js env"
  value       = aws_s3_bucket.audio.bucket
}

output "spring_datasource_url" {
  description = "Copy-paste value for spring.datasource.url"
  value       = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
}

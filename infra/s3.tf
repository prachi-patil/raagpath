# ── S3 Bucket for Raga Audio Assets ──────────────────────────────────────────

resource "aws_s3_bucket" "audio" {
  bucket = "${var.project}-audio-assets"

  tags = {
    Name = "${var.project}-audio-assets"
  }
}

# Allow public read (needed for in-browser audio playback)
resource "aws_s3_bucket_public_access_block" "audio" {
  bucket = aws_s3_bucket.audio.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Only objects under /audio/ prefix are publicly readable
resource "aws_s3_bucket_policy" "audio_public_read" {
  bucket     = aws_s3_bucket.audio.id
  depends_on = [aws_s3_bucket_public_access_block.audio]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadAudioPrefix"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.audio.arn}/audio/*"
      }
    ]
  })
}

# CORS — allows the Next.js app to fetch audio directly from S3
resource "aws_s3_bucket_cors_configuration" "audio" {
  bucket = aws_s3_bucket.audio.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

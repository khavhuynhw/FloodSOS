#!/bin/bash
# Script to setup MinIO bucket for image storage

MC_ALIAS="local"
MC_ENDPOINT="http://localhost:9000"
MC_ACCESS_KEY="minioadmin"
MC_SECRET_KEY="minioadmin"
BUCKET_NAME="floodrelief-images"

# Install mc (MinIO Client) if not available
if ! command -v mc &> /dev/null; then
    echo "MinIO Client (mc) not found. Please install it from https://min.io/docs/minio/linux/reference/minio-mc.html"
    exit 1
fi

# Configure MinIO client
mc alias set $MC_ALIAS $MC_ENDPOINT $MC_ACCESS_KEY $MC_SECRET_KEY

# Create bucket if it doesn't exist
mc mb $MC_ALIAS/$BUCKET_NAME --ignore-existing

# Set bucket policy to public read (adjust as needed for production)
mc anonymous set download $MC_ALIAS/$BUCKET_NAME

echo "MinIO bucket '$BUCKET_NAME' setup complete!"


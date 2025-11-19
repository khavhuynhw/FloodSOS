import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../utils/env';
import sharp from 'sharp';
import { Readable } from 'stream';

// For local development, we'll use a simple file-based approach
// For production, use S3 SDK
let s3Client: S3Client | null = null;

if (env.S3_ENDPOINT) {
  s3Client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO
  });
}

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
}

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  // Validate image
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image file');
  }

  // Generate thumbnail (200px max dimension)
  const thumbnail = await image
    .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Resize full image (max 1600px)
  const fullImage = await image
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

  const timestamp = Date.now();
  const thumbKey = `thumbnails/${timestamp}-${filename}`;
  const fullKey = `full/${timestamp}-${filename}`;

  if (s3Client) {
    // Upload to S3/MinIO
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: thumbKey,
        Body: thumbnail,
        ContentType: 'image/jpeg',
      })
    );

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: fullKey,
        Body: fullImage,
        ContentType: 'image/jpeg',
      })
    );

    // Return URLs through API proxy for better access control
    // Use backend API endpoint instead of direct MinIO URL
    // For local dev, use localhost:3001, in production use the actual API URL
    const apiBaseUrl = process.env.API_BASE_URL || env.CORS_ORIGIN?.replace(':3000', ':3001') || 'http://localhost:3001';
    return {
      url: `${apiBaseUrl}/api/images/${env.S3_BUCKET}/${fullKey}`,
      thumbnailUrl: `${apiBaseUrl}/api/images/${env.S3_BUCKET}/${thumbKey}`,
    };
  } else {
    // Fallback: return placeholder URLs (in production, always use S3)
    // For local dev without MinIO, you might want to save to disk
    throw new Error('S3 client not configured. Please set S3_ENDPOINT in environment variables. Make sure MinIO is running and bucket is created.');
  }
}

export async function getImageUrl(key: string): Promise<string> {
  if (!s3Client) {
    throw new Error('S3 client not configured');
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  // Generate signed URL (valid for 1 hour)
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}


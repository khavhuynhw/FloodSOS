// @ts-ignore - Cloudinary types are included in the package
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../utils/env';
import sharp from 'sharp';

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true, // Use HTTPS
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
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.');
  }

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
  const publicId = `floodrelief/${timestamp}-${filename.replace(/\.[^/.]+$/, '')}`;
  const thumbPublicId = `${publicId}_thumb`;

  try {
    // Upload full image
    const fullResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: publicId,
          folder: 'floodrelief',
          format: 'jpg',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else if (result) resolve(result as { secure_url: string });
          else reject(new Error('Upload failed'));
        }
      ).end(fullImage);
    });

    // Upload thumbnail
    const thumbResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: thumbPublicId,
          folder: 'floodrelief/thumbnails',
          format: 'jpg',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else if (result) resolve(result as { secure_url: string });
          else reject(new Error('Thumbnail upload failed'));
        }
      ).end(thumbnail);
    });

    return {
      url: fullResult.secure_url,
      thumbnailUrl: thumbResult.secure_url,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
  }
}

// Legacy function for compatibility (not needed with Cloudinary)
export async function getImageUrl(key: string): Promise<string> {
  // Cloudinary URLs are public, no need for signed URLs
  // This function is kept for backward compatibility
  throw new Error('getImageUrl is not needed with Cloudinary. Images are directly accessible via their URLs.');
}

import dotenv from 'dotenv';

dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: (() => {
    const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    // Validate CORS_ORIGIN format
    if (origin && origin.startsWith('http://') || origin.startsWith('https://')) {
      return origin;
    }
    // If invalid, return default
    return 'http://localhost:3000';
  })(),
  
  // S3/MinIO
  S3_ENDPOINT: process.env.S3_ENDPOINT || 'http://localhost:9000',
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || 'minioadmin',
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || 'minioadmin',
  S3_BUCKET: process.env.S3_BUCKET || 'floodrelief-images',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  S3_USE_SSL: process.env.S3_USE_SSL === 'true',
  
  // Rate limiting
  RATE_LIMIT_MAX_REQUESTS_PER_IP: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PER_IP || '5', 10),
  RATE_LIMIT_TIME_WINDOW_MS: parseInt(process.env.RATE_LIMIT_TIME_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS_PER_PHONE: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PER_PHONE || '3', 10),
  RATE_LIMIT_PHONE_TIME_WINDOW_MS: parseInt(process.env.RATE_LIMIT_PHONE_TIME_WINDOW_MS || '3600000', 10),
  
  // Image upload
  MAX_IMAGE_SIZE_MB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '5', 10),
  MAX_IMAGES_PER_REQUEST: parseInt(process.env.MAX_IMAGES_PER_REQUEST || '3', 10),
  
  // SMS (optional)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  ADMIN_NOTIFICATION_PHONE: process.env.ADMIN_NOTIFICATION_PHONE || '',
};


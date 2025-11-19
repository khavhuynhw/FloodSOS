# Deployment Guide

## Production Deployment

### Backend Deployment

#### Option 1: AWS ECS / Fargate

1. **Build Docker image:**
```bash
cd server
docker build -t floodrelief-api:latest .
```

2. **Push to ECR:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag floodrelief-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/floodrelief-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/floodrelief-api:latest
```

3. **Setup RDS PostgreSQL with PostGIS:**
   - Create RDS PostgreSQL instance
   - Enable PostGIS extension: `CREATE EXTENSION postgis;`
   - Update DATABASE_URL in environment variables

4. **Setup S3 bucket:**
   - Create S3 bucket for images
   - Configure CORS and bucket policies
   - Update S3 environment variables

5. **Deploy to ECS:**
   - Create ECS task definition
   - Set environment variables
   - Deploy service

#### Option 2: DigitalOcean App Platform

1. **Connect repository to DigitalOcean**
2. **Configure build settings:**
   - Build command: `cd server && npm install && npm run build`
   - Run command: `cd server && npm start`
3. **Set environment variables**
4. **Add PostgreSQL database** (with PostGIS)
5. **Add Spaces bucket** for images

#### Option 3: Railway / Render

1. **Connect GitHub repository**
2. **Add PostgreSQL service** (enable PostGIS)
3. **Set environment variables**
4. **Deploy**

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Set environment variables:**
   - `NEXT_PUBLIC_API_URL` - Your backend API URL
   - `NEXT_PUBLIC_WS_URL` - Your WebSocket URL
3. **Deploy**

#### Option 2: Netlify

1. **Connect repository**
2. **Build settings:**
   - Build command: `cd web && npm run build`
   - Publish directory: `web/.next`
3. **Set environment variables**
4. **Deploy**

### Database Migrations

Run migrations in production:

```bash
cd server
npx prisma migrate deploy
```

### Environment Variables Checklist

#### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random secret (min 32 chars)
- `S3_ENDPOINT` - S3/MinIO endpoint
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Frontend URL

#### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

### Security Checklist

- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS for all services
- [ ] Configure CORS properly
- [ ] Set up rate limiting (consider Redis)
- [ ] Enable database backups
- [ ] Use environment-specific configurations
- [ ] Set up monitoring and logging
- [ ] Configure image upload limits
- [ ] Enable request validation
- [ ] Set up SSL certificates

### Scaling Considerations

1. **Database:**
   - Use connection pooling (PgBouncer)
   - Consider read replicas for analytics
   - Index optimization

2. **Backend:**
   - Horizontal scaling with load balancer
   - Use Redis for rate limiting and caching
   - WebSocket scaling (Redis adapter for Socket.IO)

3. **Image Storage:**
   - Use CDN for image delivery
   - Implement image optimization pipeline
   - Consider CloudFront / Cloudflare

4. **Monitoring:**
   - Application performance monitoring (APM)
   - Error tracking (Sentry)
   - Log aggregation (Datadog, LogRocket)

### Health Checks

Backend health check endpoint: `GET /health`

Configure health checks in your deployment platform to monitor service availability.


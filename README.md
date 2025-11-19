# FloodRelief - Real-time Flood Relief Request Management System

A full-stack application for managing flood relief requests with real-time mapping, clustering, urgency levels, and image uploads.

## Features

- 📱 **Mobile-first public form** for submitting flood relief requests
- 🗺️ **Real-time admin dashboard** with interactive map and clustering
- 🔴 **Urgency-based color coding** (low, medium, high, critical)
- 📸 **Image upload** with automatic thumbnail generation
- 🔄 **WebSocket real-time updates** for instant notifications
- 🎯 **Smart clustering** for efficient map rendering
- 🔥 **Heatmap overlay** showing request density
- 🔒 **Admin authentication** with JWT
- ⚡ **Rate limiting** and security features

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Leaflet + Leaflet.markercluster
- Socket.IO Client
- React Hook Form

### Backend
- Node.js + TypeScript
- Fastify
- Socket.IO
- Prisma ORM
- PostgreSQL + PostGIS
- Sharp (image processing)
- MinIO/S3 (image storage)

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)

### Local Development

1. **Clone and install dependencies:**

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../web
npm install
```

2. **Setup environment variables:**

```bash
# Copy example env files
cp server/.env.example server/.env
cp web/.env.example web/.env.local
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/floodrelief?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="floodrelief-images"
S3_REGION="us-east-1"
REDIS_URL="redis://localhost:6379"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

Edit `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

3. **Start infrastructure with Docker:**

```bash
docker-compose up -d
```

This starts:
- PostgreSQL with PostGIS
- MinIO (S3-compatible storage)
- Redis (optional, for caching)

4. **Run database migrations:**

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

5. **Create admin user (optional):**

```bash
cd server
npm run seed
```

Default admin credentials:
- Email: `admin@floodrelief.local`
- Password: `admin123`

6. **Start backend server:**

```bash
cd server
npm run dev
```

7. **Start frontend:**

```bash
cd web
npm run dev
```

8. **Access the application:**

- Public form: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

## Project Structure

```
FloodRelief/
├── web/                    # Next.js frontend
│   ├── app/
│   │   ├── page.tsx       # Public form
│   │   ├── admin/         # Admin dashboard
│   │   └── api/           # Next.js API routes (if needed)
│   ├── components/        # React components
│   ├── lib/              # Utilities, hooks, WebSocket client
│   └── public/
├── server/                # Fastify backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── socket/       # Socket.IO handlers
│   │   ├── utils/        # Utilities
│   │   └── index.ts      # Server entry
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── migrations/   # Database migrations
│   └── tests/            # Tests
├── docker-compose.yml     # Local development infrastructure
└── README.md
```

## API Endpoints

### Public
- `POST /api/requests` - Create a new flood relief request
- `GET /api/requests` - List requests (with filters, pagination)
- `GET /api/requests/:id` - Get request details
- `GET /api/cluster` - Get clustered points for map

### Admin (requires auth)
- `POST /api/auth/login` - Admin login
- `POST /api/requests/:id/resolve` - Mark request as resolved
- `POST /api/requests/:id/assign` - Assign request to responder
- `PUT /api/requests/:id` - Update request (add notes, etc.)

## WebSocket Events

### Client → Server
- `join:admin` - Join admin room
- `request:resolve` - Resolve a request
- `request:assign` - Assign a request

### Server → Client
- `request:created` - New request created
- `request:updated` - Request updated
- `request:resolved` - Request resolved

## Database Schema

### Request
- `id` (UUID)
- `phone` (string, indexed)
- `fullName` (string, optional)
- `description` (text)
- `urgency` (enum: low, medium, high, critical)
- `images` (string array - URLs)
- `location` (PostGIS Point)
- `createdAt` (timestamp)
- `resolvedAt` (timestamp, nullable)
- `status` (enum: pending, assigned, resolved, false_report)
- `assignedTo` (string, nullable)
- `adminNotes` (text, nullable)

### Admin
- `id` (UUID)
- `email` (string, unique)
- `passwordHash` (string)
- `createdAt` (timestamp)

## Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd web
npm test

# E2E tests
npm run test:e2e
```

## Production Deployment

### Backend (AWS ECS / DigitalOcean / Railway)

1. Build Docker image:
```bash
cd server
docker build -t floodrelief-api .
```

2. Set environment variables in your hosting platform
3. Deploy with PostgreSQL + PostGIS database
4. Run migrations: `npx prisma migrate deploy`

### Frontend (Vercel / Netlify)

1. Set environment variables:
   - `NEXT_PUBLIC_API_URL` - Your backend URL
   - `NEXT_PUBLIC_WS_URL` - Your WebSocket URL

2. Deploy:
```bash
cd web
vercel deploy
```

### Database Setup

Enable PostGIS extension:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Environment Variables

See `.env.example` files in `server/` and `web/` directories.

## Rate Limiting

Default limits (configurable via env):
- POST /api/requests: 5 requests per 15 minutes per IP
- POST /api/requests: 3 requests per hour per phone number

## Image Storage

- Supports S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces)
- Automatic thumbnail generation (200px thumb, 1600px max full size)
- Images validated for type and size (max 5MB each, up to 3 images)

## Clustering

- Client-side: Uses Leaflet.markercluster for fast rendering
- Server-side: `/api/cluster` endpoint uses supercluster for pre-computed clusters
- Supports bounding box queries for efficient map loading

## Security Features

- JWT authentication for admin routes
- Rate limiting on public endpoints
- Image validation (MIME type, file magic)
- Input sanitization
- CORS configuration
- Phone number hashing for analytics (optional)

## License

MIT

## Support

For issues and questions, please open an issue on the repository.


import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { createServer } from 'http';
import { env } from './utils/env';
import { authRoutes } from './routes/auth';
import { requestRoutes } from './routes/requests';
import { clusterRoutes } from './routes/cluster';
import { setupSocketIO } from './socket/handlers';

// Extend Fastify to include Socket.IO
declare module 'fastify' {
  interface FastifyInstance {
    io?: ReturnType<typeof setupSocketIO>;
  }
}

export async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  // CORS
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests from CORS_ORIGIN or localhost (for development)
      const allowedOrigins = [
        env.CORS_ORIGIN,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.19:3000',
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  });

  // Multipart support for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
      files: env.MAX_IMAGES_PER_REQUEST,
    },
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(requestRoutes);
  await fastify.register(clusterRoutes);

  return fastify;
}

async function start() {
  try {
    // Create HTTP server first for Socket.IO
    const httpServer = createServer();
    
    // Build Fastify instance normally
    const fastify = await buildServer();
    
    // Setup Socket.IO on the same HTTP server
    const io = setupSocketIO(httpServer, env.CORS_ORIGIN);
    fastify.decorate('io', io);
    
    // Attach Fastify to HTTP server by forwarding requests
    await fastify.ready();
    
    // Forward all requests from httpServer to fastify's server
    httpServer.on('request', (req, res) => {
      // Fastify's server expects IncomingMessage and ServerResponse
      // Forward the request to fastify's internal server
      fastify.server.emit('request', req, res);
    });
    
    // Start server
    const port = env.PORT;
    httpServer.listen(port, '0.0.0.0', () => {
      fastify.log.info(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();


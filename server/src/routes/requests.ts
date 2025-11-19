import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createRequest, getRequests, getRequest, updateRequest } from '../services/requestService';
// Authentication removed - all routes are public
import { validatePhone, normalizePhone } from '../utils/phone';
import { checkIPRateLimit, checkPhoneRateLimit } from '../utils/rateLimit';
import { env } from '../utils/env';
import { UrgencyLevel, RequestStatus } from '@prisma/client';

const createRequestSchema = z.object({
  phone: z.string(),
  fullName: z.string().optional(),
  description: z.string().min(10).max(1000),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const updateRequestSchema = z.object({
  status: z.enum(['pending', 'assigned', 'resolved', 'false_report']).optional(),
  assignedTo: z.string().optional(),
  adminNotes: z.string().optional(),
});

export async function requestRoutes(fastify: FastifyInstance) {
  // Create request (public)
  fastify.post('/api/requests', async (request, reply) => {
    try {
      // Rate limiting
      const ip = request.ip;
      const ipLimit = checkIPRateLimit(
        ip,
        env.RATE_LIMIT_MAX_REQUESTS_PER_IP,
        env.RATE_LIMIT_TIME_WINDOW_MS
      );

      if (!ipLimit.allowed) {
        return reply.status(429).send({
          error: 'Too many requests',
          resetAt: ipLimit.resetAt,
        });
      }

      // Parse multipart form data
      const parts = request.parts();
      const fields: Record<string, any> = {};
      const images: Array<{ buffer: Buffer; filename: string; contentType: string }> = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          // Handle file upload
          if (images.length < env.MAX_IMAGES_PER_REQUEST) {
            const buffer = await part.toBuffer();
            if (buffer.length <= env.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
              images.push({
                buffer,
                filename: part.filename || `image-${Date.now()}.jpg`,
                contentType: part.mimetype || 'image/jpeg',
              });
            }
          }
        } else {
          // Handle form fields
          fields[part.fieldname] = part.value;
        }
      }

      const phone = normalizePhone(fields.phone || '');
      
      if (!validatePhone(phone)) {
        return reply.status(400).send({ error: 'Invalid phone number' });
      }

      // Check phone rate limit
      const phoneLimit = checkPhoneRateLimit(
        phone,
        env.RATE_LIMIT_MAX_REQUESTS_PER_PHONE,
        env.RATE_LIMIT_PHONE_TIME_WINDOW_MS
      );

      if (!phoneLimit.allowed) {
        return reply.status(429).send({
          error: 'Too many requests from this phone number',
          resetAt: phoneLimit.resetAt,
        });
      }

      const input = createRequestSchema.parse({
        phone,
        fullName: fields.fullName,
        description: fields.description,
        urgency: fields.urgency,
        lat: parseFloat(fields.lat || '0'),
        lng: parseFloat(fields.lng || '0'),
      });

      const requestRecord = await createRequest({
        ...input,
        urgency: input.urgency as UrgencyLevel,
        images: images.length > 0 ? images : undefined,
      });

      // Emit WebSocket event
      fastify.io?.to('admins').emit('request:created', requestRecord);

      return {
        id: requestRecord?.id,
        message: 'Request created successfully',
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error creating request:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      return reply.status(500).send({ 
        error: 'Failed to create request',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Get requests (public, with filters)
  fastify.get('/api/requests', async (request, reply) => {
    try {
      const query = request.query as any;
      
      const filters: any = {};
      
      if (query.urgency) {
        filters.urgency = Array.isArray(query.urgency) ? query.urgency : [query.urgency];
      }
      
      if (query.status) {
        filters.status = Array.isArray(query.status) ? query.status : [query.status];
      }
      
      if (query.hasImage !== undefined) {
        filters.hasImage = query.hasImage === 'true';
      }
      
      if (query.minLat && query.minLng && query.maxLat && query.maxLng) {
        filters.bbox = {
          minLat: parseFloat(query.minLat),
          minLng: parseFloat(query.minLng),
          maxLat: parseFloat(query.maxLat),
          maxLng: parseFloat(query.maxLng),
        };
      }
      
      if (query.search) {
        filters.search = query.search;
      }

      filters.limit = query.limit ? parseInt(query.limit, 10) : 50;
      filters.offset = query.offset ? parseInt(query.offset, 10) : 0;

      const result = await getRequests(filters);
      return result;
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      return reply.status(500).send({ error: 'Failed to fetch requests' });
    }
  });

  // Get single request
  fastify.get('/api/requests/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const requestRecord = await getRequest(params.id);
      
      if (!requestRecord) {
        return reply.status(404).send({ error: 'Request not found' });
      }
      
      return requestRecord;
    } catch (error: any) {
      console.error('Error fetching request:', error);
      return reply.status(500).send({ error: 'Failed to fetch request' });
    }
  });

  // Update request (public - no auth required)
  fastify.put('/api/requests/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = updateRequestSchema.parse(request.body);
      
      const updated = await updateRequest(params.id, {
        ...body,
        status: body.status as RequestStatus | undefined,
        resolvedAt: body.status === 'resolved' ? new Date() : undefined,
      });

      // Emit WebSocket event
      fastify.io?.to('admins').emit('request:updated', updated);

      return updated;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Error updating request:', error);
      return reply.status(500).send({ error: 'Failed to update request' });
    }
  });

  // Resolve request (public - no auth required)
  fastify.post('/api/requests/:id/resolve', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      
      const updated = await updateRequest(params.id, {
        status: 'resolved',
        resolvedAt: new Date(),
      });

      // Emit WebSocket event
      fastify.io?.to('admins').emit('request:resolved', updated);

      return updated;
    } catch (error: any) {
      console.error('Error resolving request:', error);
      return reply.status(500).send({ error: 'Failed to resolve request' });
    }
  });
}


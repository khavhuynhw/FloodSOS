import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getClusteredPoints } from '../services/cluster';

const clusterQuerySchema = z.object({
  minLat: z.string().transform(Number),
  minLng: z.string().transform(Number),
  maxLat: z.string().transform(Number),
  maxLng: z.string().transform(Number),
  zoom: z.string().transform(Number).default('10'),
  urgency: z.string().optional(),
  status: z.string().optional(),
  hasImage: z.string().optional(),
});

export async function clusterRoutes(fastify: FastifyInstance) {
  fastify.get('/api/cluster', async (request, reply) => {
    try {
      const query = clusterQuerySchema.parse(request.query);
      
      const bbox = {
        minLat: query.minLat,
        minLng: query.minLng,
        maxLat: query.maxLat,
        maxLng: query.maxLng,
      };

      const filters: any = {};
      if (query.urgency) {
        filters.urgency = query.urgency.split(',');
      }
      if (query.status) {
        filters.status = query.status.split(',');
      }
      if (query.hasImage !== undefined) {
        filters.hasImage = query.hasImage === 'true';
      }

      const clusters = await getClusteredPoints(bbox, query.zoom, filters);
      return { clusters };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid query parameters', details: error.errors });
      }
      console.error('Error fetching clusters:', error);
      return reply.status(500).send({ error: 'Failed to fetch clusters' });
    }
  });
}


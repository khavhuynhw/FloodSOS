import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { login } from '../services/authService';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const result = await login(body.email, body.password);
      return result;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      return reply.status(401).send({ error: error.message || 'Login failed' });
    }
  });
}


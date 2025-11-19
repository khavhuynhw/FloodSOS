import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { verifyAdmin } from '../services/authService';

export async function authenticateAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    const admin = await verifyAdmin(payload.adminId);
    if (!admin) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Attach admin to request
    (request as any).admin = admin;
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}


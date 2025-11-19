import { buildServer } from '../../index';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

describe('Request routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 for invalid request data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/requests',
      payload: {
        phone: '123',
        description: 'short',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  // Add more tests as needed
});


import { PrismaClient, UrgencyLevel, RequestStatus } from '@prisma/client';
import { uploadImage } from './storage';

const prisma = new PrismaClient();

export interface CreateRequestInput {
  phone: string;
  fullName?: string;
  description: string;
  urgency: UrgencyLevel;
  lat: number;
  lng: number;
  images?: Array<{ buffer: Buffer; filename: string; contentType: string }>;
}

export interface UpdateRequestInput {
  status?: RequestStatus;
  assignedTo?: string;
  adminNotes?: string;
  resolvedAt?: Date;
}

export async function createRequest(input: CreateRequestInput) {
  // Upload images if provided
  const imageUrls: string[] = [];
  if (input.images && input.images.length > 0) {
    for (const image of input.images) {
      try {
        const result = await uploadImage(image.buffer, image.filename, image.contentType);
        imageUrls.push(result.url);
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Continue with other images
      }
    }
  }

  // Create request with PostGIS point
  const id = crypto.randomUUID();
  
  await prisma.$executeRaw`
    INSERT INTO requests (
      id, phone, "fullName", description, urgency, images, 
      location, lat, lng, status, "createdAt", "updatedAt"
    )
    VALUES (
      ${id}::uuid,
      ${input.phone},
      ${input.fullName || null},
      ${input.description},
      ${input.urgency}::"UrgencyLevel",
      ${imageUrls}::text[],
      ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326),
      ${input.lat},
      ${input.lng},
      'pending'::"RequestStatus",
      NOW(),
      NOW()
    )
  `;

  // Fetch the created request
  const created = await prisma.request.findUnique({
    where: { id },
  });

  return created!;
}

export async function getRequest(id: string) {
  return prisma.request.findUnique({
    where: { id },
  });
}

export async function getRequests(filters: {
  urgency?: UrgencyLevel[];
  status?: RequestStatus[];
  hasImage?: boolean;
  bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number };
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const where: any = {};

  if (filters.urgency && filters.urgency.length > 0) {
    where.urgency = { in: filters.urgency };
  }

  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters.hasImage !== undefined) {
    if (filters.hasImage) {
      where.images = { isEmpty: false };
    } else {
      where.images = { isEmpty: true };
    }
  }

  if (filters.bbox) {
    where.lat = { gte: filters.bbox.minLat, lte: filters.bbox.maxLat };
    where.lng = { gte: filters.bbox.minLng, lte: filters.bbox.maxLng };
  }

  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.request.count({ where }),
  ]);

  return { requests, total };
}

export async function updateRequest(id: string, input: UpdateRequestInput) {
  return prisma.request.update({
    where: { id },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
}


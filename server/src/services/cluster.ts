import Supercluster from 'supercluster';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ClusterPoint {
  type: 'Feature';
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
    id: string;
    urgency: string;
    status: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export async function getClusteredPoints(
  bbox: BoundingBox,
  zoom: number,
  filters?: {
    urgency?: string[];
    status?: string[];
    hasImage?: boolean;
  }
): Promise<ClusterPoint[]> {
  // Build where clause
  const where: any = {
    lat: { gte: bbox.minLat, lte: bbox.maxLat },
    lng: { gte: bbox.minLng, lte: bbox.maxLng },
  };

  if (filters?.urgency && filters.urgency.length > 0) {
    where.urgency = { in: filters.urgency };
  }

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters?.hasImage !== undefined) {
    if (filters.hasImage) {
      where.images = { isEmpty: false };
    } else {
      where.images = { isEmpty: true };
    }
  }

  // Fetch points from database
  const requests = await prisma.request.findMany({
    where,
    select: {
      id: true,
      lat: true,
      lng: true,
      urgency: true,
      status: true,
      images: true,
    },
  });

  // Convert to GeoJSON features
  const points: ClusterPoint[] = requests.map((req) => ({
    type: 'Feature',
    properties: {
      cluster: false,
      id: req.id,
      urgency: req.urgency,
      status: req.status,
    },
    geometry: {
      type: 'Point',
      coordinates: [req.lng, req.lat],
    },
  }));

  // Create supercluster instance
  const cluster = new Supercluster({
    radius: 50,
    maxZoom: 17,
    minZoom: 0,
    minPoints: 2,
  });

  // Load points into cluster
  cluster.load(points);

  // Get clusters for the given zoom and bbox
  const clusters = cluster.getClusters(
    [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
    Math.floor(zoom)
  );

  return clusters as ClusterPoint[];
}


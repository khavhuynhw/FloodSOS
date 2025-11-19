const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateRequestData {
  phone: string;
  fullName?: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  lat: number;
  lng: number;
  images?: File[];
}

export async function createRequest(data: CreateRequestData): Promise<{ id: string; message: string }> {
  const formData = new FormData();
  
  formData.append('phone', data.phone);
  if (data.fullName) {
    formData.append('fullName', data.fullName);
  }
  formData.append('description', data.description);
  formData.append('urgency', data.urgency);
  formData.append('lat', data.lat.toString());
  formData.append('lng', data.lng.toString());
  
  if (data.images) {
    for (const image of data.images) {
      formData.append('images', image);
    }
  }

  const response = await fetch(`${API_URL}/api/requests`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create request');
  }

  return response.json();
}

export interface Request {
  id: string;
  phone: string;
  fullName?: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  images: string[];
  lat: number;
  lng: number;
  status: 'pending' | 'assigned' | 'resolved' | 'false_report';
  createdAt: string;
  resolvedAt?: string;
}

export interface GetRequestsParams {
  urgency?: string[];
  status?: string[];
  hasImage?: boolean;
  minLat?: number;
  minLng?: number;
  maxLat?: number;
  maxLng?: number;
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getRequests(params?: GetRequestsParams): Promise<{ requests: Request[]; total: number }> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    if (params.urgency) {
      params.urgency.forEach(u => searchParams.append('urgency', u));
    }
    if (params.status) {
      params.status.forEach(s => searchParams.append('status', s));
    }
    if (params.hasImage !== undefined) {
      searchParams.append('hasImage', params.hasImage.toString());
    }
    if (params.minLat !== undefined) {
      searchParams.append('minLat', params.minLat.toString());
      searchParams.append('minLng', params.minLng!.toString());
      searchParams.append('maxLat', params.maxLat!.toString());
      searchParams.append('maxLng', params.maxLng!.toString());
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params.offset) {
      searchParams.append('offset', params.offset.toString());
    }
    if (params.search) {
      searchParams.append('search', params.search);
    }
  }

  const response = await fetch(`${API_URL}/api/requests?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch requests');
  }

  return response.json();
}

export async function getRequest(id: string): Promise<Request> {
  const response = await fetch(`${API_URL}/api/requests/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch request');
  }

  return response.json();
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
  };
}

export async function login(data: LoginData): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

export async function resolveRequest(id: string): Promise<Request> {
  const response = await fetch(`${API_URL}/api/requests/${id}/resolve`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to resolve request');
  }

  return response.json();
}

export async function updateRequest(
  id: string,
  data: { status?: string; assignedTo?: string; adminNotes?: string }
): Promise<Request> {
  const response = await fetch(`${API_URL}/api/requests/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update request');
  }

  return response.json();
}


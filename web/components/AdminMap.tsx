'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Request } from '@/lib/api';

// Fix for default marker icons (only on client side)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface AdminMapProps {
  requests: Request[];
  filters: {
    urgency: string[];
    status: string[];
    hasImage?: boolean;
    search: string;
  };
  selectedRequest: Request | null;
  onRequestSelect: (request: Request | null) => void;
  token?: string;
  showHeatmap?: boolean;
}


function getUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };
  return colors[urgency] || '#6b7280';
}

function getUrgencyWeight(urgency: string): number {
  const weights: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 5,
  };
  return weights[urgency] || 1;
}

// Heatmap Component
function HeatmapOverlay({ requests, showHeatmap }: { requests: Request[]; showHeatmap: boolean }) {
  const map = useMap();
  const heatmapLayerRef = useRef<L.Layer | null>(null);
  const [heatmapLoaded, setHeatmapLoaded] = useState(false);

  useEffect(() => {
    // Load leaflet.heat only on client side
    if (typeof window !== 'undefined' && !heatmapLoaded) {
      try {
        require('leaflet.heat');
        setHeatmapLoaded(true);
      } catch (e) {
        console.warn('leaflet.heat not available');
      }
    }
  }, [heatmapLoaded]);

  useEffect(() => {
    if (!showHeatmap || !heatmapLoaded || requests.length === 0) {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      return;
    }

    // Get HeatmapLayer from Leaflet
    const HeatmapLayer = (L as any).heatLayer;
    if (!HeatmapLayer) {
      return;
    }

    // Prepare heatmap data with urgency weights
    const heatmapData: [number, number, number][] = requests.map((req) => [
      req.lat,
      req.lng,
      getUrgencyWeight(req.urgency),
    ]);

    // Create heatmap layer
    const heatmap = HeatmapLayer(heatmapData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.0: 'blue',
        0.2: 'cyan',
        0.4: 'lime',
        0.6: 'yellow',
        0.8: 'orange',
        1.0: 'red',
      },
      max: 5, // Maximum weight (critical urgency)
    });

    heatmap.addTo(map);
    heatmapLayerRef.current = heatmap;

    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
    };
  }, [map, requests, showHeatmap, heatmapLoaded]);

  return null;
}

function createCustomIcon(urgency: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${getUrgencyColor(urgency)}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function AdminMap({
  requests,
  filters,
  selectedRequest,
  onRequestSelect,
  token,
  showHeatmap = false,
}: AdminMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapRequests, setMapRequests] = useState<Request[]>(requests);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMapRequests(requests);
  }, [requests]);

  if (!mounted) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Center map on Vietnam
  const defaultCenter: [number, number] = [16.0544, 108.2022]; // Central Vietnam
  const defaultZoom = 6;

  // Filter requests based on current filters
  const filteredRequests = mapRequests.filter((req) => {
    if (filters.urgency.length > 0 && !filters.urgency.includes(req.urgency)) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(req.status)) {
      return false;
    }
    if (filters.hasImage !== undefined) {
      const hasImage = req.images && req.images.length > 0;
      if (filters.hasImage !== hasImage) {
        return false;
      }
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        req.phone.toLowerCase().includes(searchLower) ||
        req.fullName?.toLowerCase().includes(searchLower) ||
        req.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="h-[600px] rounded-lg overflow-hidden border border-gray-300 shadow-lg bg-white">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapOverlay requests={filteredRequests} showHeatmap={showHeatmap || false} />
        <MarkerClusterGroup>
          {filteredRequests.map((request) => (
            <Marker
              key={request.id}
              position={[request.lat, request.lng]}
              icon={createCustomIcon(request.urgency)}
              eventHandlers={{
                click: () => {
                  onRequestSelect(request);
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-1">
                    {request.fullName || 'Ẩn danh'}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">{request.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          request.urgency === 'low' ? '#10b981' :
                          request.urgency === 'medium' ? '#f59e0b' :
                          request.urgency === 'high' ? '#ef4444' : '#dc2626'
                      }}
                    >
                      {request.urgency === 'low' ? 'Thấp' : 
                       request.urgency === 'medium' ? 'Trung bình' :
                       request.urgency === 'high' ? 'Cao' : 'Khẩn cấp'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-gray-200">
                      {request.status === 'pending' ? 'Chờ xử lý' :
                       request.status === 'assigned' ? 'Đã phân công' :
                       request.status === 'resolved' ? 'Đã xử lý' : 'Báo sai'}
                    </span>
                  </div>
                  {request.images && request.images.length > 0 && (
                    <div className="mt-2">
                      <img
                        src={request.images[0]}
                        alt="Request"
                        className="w-full h-24 object-cover rounded"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                  <a
                    href={`tel:${request.phone}`}
                    className="text-xs text-blue-600 hover:underline mt-1 block"
                  >
                    📞 {request.phone}
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}


'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

function LocationMarker({ onLocationChange }: { onLocationChange: (location: { lat: number; lng: number }) => void }) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  const map = useMapEvents({
    click(e) {
      const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPosition);
      onLocationChange(newPosition);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (map) {
      // Try to get user location, but default to Vietnam if not available
      map.locate({
        setView: false,
        maxZoom: 13,
        timeout: 5000,
      });
      
      map.on('locationfound', (e) => {
        const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPosition(newPosition);
        onLocationChange(newPosition);
        map.flyTo(e.latlng, 13);
      });
      
      map.on('locationerror', () => {
        // If location error, keep default Vietnam center
        console.log('Location not available, using default Vietnam center');
      });
    }
  }, [map, onLocationChange]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function MapPicker({ initialLocation, onLocationChange }: MapPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Default to Vietnam if no initial location
  const defaultCenter: [number, number] = initialLocation
    ? [initialLocation.lat, initialLocation.lng]
    : [16.0544, 108.2022]; // Central Vietnam

  return (
    <MapContainer
      center={defaultCenter}
      zoom={initialLocation ? 13 : 6}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onLocationChange={onLocationChange} />
      {initialLocation && (
        <Marker position={[initialLocation.lat, initialLocation.lng]} />
      )}
    </MapContainer>
  );
}


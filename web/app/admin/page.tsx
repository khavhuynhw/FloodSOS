'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { wsClient } from '@/lib/websocket';

// Dynamically import AdminDashboard to avoid SSR issues with leaflet
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), { 
  ssr: false 
});

export default function AdminPage() {
  useEffect(() => {
    // Connect WebSocket without authentication
    wsClient.connect();
  }, []);

  const handleLogout = () => {
    // No-op since there's no authentication
    wsClient.disconnect();
  };

  return <AdminDashboard token="" onLogout={handleLogout} />;
}


'use client';

import { useState, useEffect } from 'react';
import AdminMap from './AdminMap';
import RequestTable from './RequestTable';
import RequestFilters from './RequestFilters';
import { Request } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

interface AdminDashboardProps {
  token?: string;
  onLogout: () => void;
}

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [view, setView] = useState<'map' | 'table'>('map');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filters, setFilters] = useState({
    urgency: [] as string[],
    status: [] as string[],
    hasImage: undefined as boolean | undefined,
    search: '',
  });

  useEffect(() => {
    // Fetch initial requests
    const fetchRequests = async () => {
      try {
        const { getRequests } = await import('@/lib/api');
        const result = await getRequests({ limit: 100 });
        setRequests(result.requests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      }
    };

    fetchRequests();

    // Setup WebSocket listeners
    const handleCreated = (newRequest: Request) => {
      setRequests((prev) => [newRequest, ...prev]);
    };

    const handleUpdated = (updatedRequest: Request) => {
      setRequests((prev) =>
        prev.map((req) => (req.id === updatedRequest.id ? updatedRequest : req))
      );
    };

    const handleResolved = (resolvedRequest: Request) => {
      setRequests((prev) =>
        prev.map((req) => (req.id === resolvedRequest.id ? resolvedRequest : req))
      );
    };

    wsClient.on('request:created', handleCreated);
    wsClient.on('request:updated', handleUpdated);
    wsClient.on('request:resolved', handleResolved);

    return () => {
      wsClient.off('request:created', handleCreated);
      wsClient.off('request:updated', handleUpdated);
      wsClient.off('request:resolved', handleResolved);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Bảng Điều Khiển SOS Cứu Trợ</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href="/"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  + Tạo Yêu Cầu Cứu Trợ
                </a>
                <button
                  onClick={() => setView('map')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    view === 'map'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Xem Bản Đồ
                </button>
                <button
                  onClick={() => setView('table')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    view === 'table'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Xem Bảng
                </button>
                {view === 'map' && (
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      showHeatmap
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔥 {showHeatmap ? 'Tắt' : 'Bật'} Heatmap
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white border-b relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <RequestFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          {view === 'map' ? (
            <AdminMap
              requests={requests}
              filters={filters}
              selectedRequest={selectedRequest}
              onRequestSelect={setSelectedRequest}
              token={token || ''}
              showHeatmap={showHeatmap}
            />
          ) : (
            <RequestTable
              requests={requests}
              filters={filters}
              onRequestSelect={setSelectedRequest}
              token={token || ''}
              onRequestUpdate={(updated) => {
                setRequests((prev) =>
                  prev.map((req) => (req.id === updated.id ? updated : req))
                );
              }}
            />
          )}
        </main>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { Request, resolveRequest, updateRequest } from '@/lib/api';
import Image from 'next/image';

interface RequestTableProps {
  requests: Request[];
  filters: {
    urgency: string[];
    status: string[];
    hasImage?: boolean;
    search: string;
  };
  onRequestSelect: (request: Request | null) => void;
  token?: string;
  onRequestUpdate: (request: Request) => void;
}

export default function RequestTable({
  requests,
  filters,
  onRequestSelect,
  token,
  onRequestUpdate,
}: RequestTableProps) {
  const [sortBy, setSortBy] = useState<'createdAt' | 'urgency'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter requests
  const filteredRequests = requests.filter((req) => {
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

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'createdAt') {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'urgency') {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      comparison = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleResolve = async (id: string) => {
    try {
      const updated = await resolveRequest(id);
      onRequestUpdate(updated);
    } catch (error) {
      console.error('Failed to resolve request:', error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await updateRequest(id, { status });
      onRequestUpdate(updated);
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/20">
      <div className="overflow-x-auto relative">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortBy === 'createdAt') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('createdAt');
                    setSortOrder('desc');
                  }
                }}
              >
                Thời gian {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Liên hệ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => {
                  if (sortBy === 'urgency') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('urgency');
                    setSortOrder('desc');
                  }
                }}
              >
                Mức độ {sortBy === 'urgency' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ảnh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRequests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onRequestSelect(request)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(request.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {request.fullName || 'Ẩn danh'}
                  </div>
                  <div className="text-sm text-gray-500">
                    <a href={`tel:${request.phone}`} className="hover:text-blue-600">
                      {request.phone}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-md truncate">
                    {request.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative inline-block">
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-gray-900 border-2 border-gray-300 rounded-md px-3 py-1.5 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none pr-8 min-w-[140px] shadow-sm"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                        color: '#111827',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                    >
                      <option value="pending" className="text-gray-900 bg-white">Chờ xử lý</option>
                      <option value="assigned" className="text-gray-900 bg-white">Đã phân công</option>
                      <option value="resolved" className="text-gray-900 bg-white">Đã xử lý</option>
                      <option value="false_report" className="text-gray-900 bg-white">Báo sai</option>
                    </select>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.images && request.images.length > 0 ? (
                    <div className="flex gap-1">
                      {request.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Yêu cầu ${idx + 1}`}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">Không có ảnh</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolve(request.id);
                    }}
                    disabled={request.status === 'resolved'}
                    className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {request.status === 'resolved' ? 'Đã xử lý' : 'Xử lý'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedRequests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy yêu cầu nào phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>
    </div>
  );
}


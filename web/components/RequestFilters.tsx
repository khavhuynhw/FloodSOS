'use client';

interface RequestFiltersProps {
  filters: {
    urgency: string[];
    status: string[];
    hasImage?: boolean;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function RequestFilters({ filters, onFiltersChange }: RequestFiltersProps) {
  const handleUrgencyChange = (urgency: string) => {
    const newUrgencies = filters.urgency.includes(urgency)
      ? filters.urgency.filter((u) => u !== urgency)
      : [...filters.urgency, urgency];
    onFiltersChange({ ...filters, urgency: newUrgencies });
  };

  const handleStatusChange = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Urgency Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ khẩn cấp</label>
          <div className="flex gap-2">
            {[
              { value: 'low', label: 'Thấp', color: '#10b981' },
              { value: 'medium', label: 'Trung bình', color: '#f59e0b' },
              { value: 'high', label: 'Cao', color: '#ef4444' },
              { value: 'critical', label: 'Khẩn cấp', color: '#dc2626' },
            ].map((level) => (
              <input
                key={level.value}
                type="button"
                onClick={() => handleUrgencyChange(level.value)}
                value={level.label}
                className={`px-3 py-2 rounded text-sm font-medium transition-all cursor-pointer ${
                  filters.urgency.includes(level.value)
                    ? 'text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                style={
                  filters.urgency.includes(level.value)
                    ? { backgroundColor: level.color }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
          <div className="flex gap-2">
            {[
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'assigned', label: 'Đã phân công' },
              { value: 'resolved', label: 'Đã xử lý' },
              { value: 'false_report', label: 'Báo sai' },
            ].map((status) => (
              <input
                key={status.value}
                type="button"
                onClick={() => handleStatusChange(status.value)}
                value={status.label}
                className={`px-3 py-2 rounded text-sm font-medium transition-all cursor-pointer ${
                  filters.status.includes(status.value)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Has Image Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Có ảnh</label>
          <select
            value={filters.hasImage === undefined ? 'all' : filters.hasImage ? 'yes' : 'no'}
            onChange={(e) => {
              const value = e.target.value;
              onFiltersChange({
                ...filters,
                hasImage: value === 'all' ? undefined : value === 'yes',
              });
            }}
            className="px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 min-w-[120px]"
          >
            <option value="all">Tất cả</option>
            <option value="yes">Có</option>
            <option value="no">Không</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Tìm theo số điện thoại, tên, hoặc mô tả..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  );
}


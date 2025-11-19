'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRequest, CreateRequestData } from '@/lib/api';
import { getCurrentLocation, Coordinates } from '@/lib/geolocation';

const formSchema = z.object({
  phone: z.string().min(7, 'Số điện thoại phải có ít nhất 7 chữ số'),
  fullName: z.string().optional(),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').max(1000),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  images: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

const emergencyTypes = [
  { id: 'food', label: 'Cần lương thực', icon: '🍞' },
  { id: 'water', label: 'Cần nước sạch', icon: '💧' },
  { id: 'medicine', label: 'Cần thuốc men', icon: '💊' },
  { id: 'elderly', label: 'Có người già/trẻ em', icon: '👴' },
  { id: 'rising', label: 'Nước đang dâng cao', icon: '🌊' },
  { id: 'boat', label: 'Cần xuồng/ghe', icon: '🚤' },
];

export default function Home() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [locationMode, setLocationMode] = useState<'current' | 'address'>('current');
  const [selectedEmergencyTypes, setSelectedEmergencyTypes] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urgency: 'high',
    },
  });

  const urgency = watch('urgency');

  useEffect(() => {
    // Try to get current location on mount
    if (locationMode === 'current' && !location) {
      setIsGettingLocation(true);
      setLocationError(null);
      getCurrentLocation()
        .then((loc) => {
          setLocation(loc);
          setLocationError(null);
          setIsGettingLocation(false);
        })
        .catch((error) => {
          setLocationError(error.message || 'Không thể lấy vị trí. Vui lòng chọn vị trí thủ công.');
          setIsGettingLocation(false);
        });
    }
  }, [locationMode]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 3);
    setSelectedImages(imageFiles);
  };

  const handleEmergencyTypeToggle = (typeId: string) => {
    setSelectedEmergencyTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!location) {
      setSubmitError('Vui lòng chọn vị trí của bạn');
      return;
    }

    if (selectedEmergencyTypes.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất một tình trạng khẩn cấp');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Combine emergency types into description
      const emergencyText = selectedEmergencyTypes
        .map((id) => emergencyTypes.find((t) => t.id === id)?.label)
        .join(', ');
      
      const fullDescription = emergencyText + (data.description ? `\n\n${data.description}` : '');

      const requestData: CreateRequestData = {
        ...data,
        description: fullDescription,
        lat: location.lat,
        lng: location.lng,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      };

      await createRequest(requestData);
      setSubmitSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setSubmitSuccess(false);
        setSelectedImages([]);
        setSelectedEmergencyTypes([]);
        setValue('phone', '');
        setValue('fullName', '');
        setValue('description', '');
        setValue('urgency', 'high');
        setLocation(null);
      }, 3000);
    } catch (error: any) {
      setSubmitError(error.message || 'Gửi yêu cầu thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-blue-950 text-white relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-900 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>
      
      <div className="max-w-md mx-auto px-4 py-6 relative z-10">
        {/* Central Card Container */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-gray-700/50">
          {/* Header Section */}
          <div className="mb-6 text-center">
            {/* Red Warning Triangle Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-white">SOS Cứu Trợ</h1>
            <p className="text-gray-300 text-sm">Gửi yêu cầu khẩn cấp & Vị trí</p>
          </div>

          {submitSuccess && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-400 text-white rounded-xl shadow-2xl transform transition-all animate-bounce">
              <p className="font-bold text-lg">✅ Gửi yêu cầu thành công!</p>
              <p className="text-sm mt-1 opacity-90">Yêu cầu của bạn đã được ghi nhận. Đội cứu trợ sẽ liên hệ sớm nhất có thể.</p>
            </div>
          )}

          {submitError && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-700 to-red-800 border-2 border-red-500 text-white rounded-xl shadow-2xl animate-shake">
              <p className="font-bold text-lg">❌ Lỗi:</p>
              <p className="text-sm mt-1 opacity-90">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Location Selection */}
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode('current');
                    setIsGettingLocation(true);
                    setLocationError(null);
                    getCurrentLocation()
                      .then((loc) => {
                        setLocation(loc);
                        setLocationError(null);
                        setIsGettingLocation(false);
                      })
                      .catch((error) => {
                        setLocationError(error.message || 'Không thể lấy vị trí. Vui lòng chọn vị trí thủ công.');
                        setIsGettingLocation(false);
                      });
                  }}
                  disabled={isGettingLocation}
                  className={`py-3 px-4 rounded-full font-medium transition-all ${
                    locationMode === 'current'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${isGettingLocation ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isGettingLocation ? (
                    <span className="flex items-center justify-center text-sm">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lấy...
                    </span>
                  ) : (
                    <>
                      <span className="mr-2">📍</span>
                      Vị trí hiện tại
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode('address');
                  }}
                  className={`py-3 px-4 rounded-full font-medium transition-all ${
                    locationMode === 'address'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">🏠</span>
                  Nhập địa chỉ
                </button>
              </div>
              {isGettingLocation && (
                <div className="mt-2 flex items-center text-sm text-blue-400">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lấy vị trí GPS của bạn...
                </div>
              )}
              {locationError && locationMode === 'current' && !isGettingLocation && (
                <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <p className="text-sm text-yellow-400">{locationError}</p>
                  <p className="text-xs text-yellow-300/80 mt-1">Vui lòng cho phép truy cập vị trí trong trình duyệt hoặc chọn "Nhập địa chỉ khác"</p>
                </div>
              )}
              {location && locationMode !== 'address' && !isGettingLocation && (
                <div className="mt-2 p-2 bg-green-900/30 border border-green-600/50 rounded-lg">
                  <p className="text-sm text-green-400 font-medium">✅ Đã lấy vị trí thành công!</p>
                  <p className="text-xs text-green-300/80 mt-1">
                    Vị trí: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              )}
              {locationMode === 'address' && (
                <div className="mt-3 space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                    Nhập địa chỉ:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="address"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Ví dụ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh"
                      className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!addressInput.trim()) {
                          setLocationError('Vui lòng nhập địa chỉ');
                          return;
                        }
                        setIsGeocoding(true);
                        setLocationError(null);
                        try {
                          // Sử dụng Nominatim (OpenStreetMap) để geocoding
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=1&countrycodes=vn`
                          );
                          const data = await response.json();
                          if (data && data.length > 0) {
                            const result = data[0];
                            const newLocation = {
                              lat: parseFloat(result.lat),
                              lng: parseFloat(result.lon),
                            };
                            setLocation(newLocation);
                            setLocationError(null);
                          } else {
                            setLocationError('Không tìm thấy địa chỉ. Vui lòng thử lại hoặc chọn trên bản đồ.');
                          }
                        } catch (error) {
                          setLocationError('Lỗi khi tìm địa chỉ. Vui lòng thử lại hoặc chọn trên bản đồ.');
                        } finally {
                          setIsGeocoding(false);
                        }
                      }}
                      disabled={isGeocoding || !addressInput.trim()}
                      className="px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all"
                    >
                      {isGeocoding ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        'Tìm'
                      )}
                    </button>
                  </div>
                  {locationError && locationMode === 'address' && (
                    <div className="p-2 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                      <p className="text-sm text-yellow-400">{locationError}</p>
                    </div>
                  )}
                  {location && locationMode === 'address' && !isGeocoding && (
                    <div className="p-2 bg-green-900/30 border border-green-600/50 rounded-lg">
                      <p className="text-sm text-green-400 font-medium">✅ Đã tìm thấy địa chỉ!</p>
                      <p className="text-xs text-green-300/80 mt-1">
                        Vị trí: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <span className="mr-2">📱</span>
                Số điện thoại của bạn
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Nhập số điện thoại"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Emergency Status */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                <span className="mr-2">⚠️</span>
                Tình trạng khẩn cấp
              </label>
              <div className="grid grid-cols-2 gap-3">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleEmergencyTypeToggle(type.id)}
                    className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                      selectedEmergencyTypes.includes(type.id)
                        ? 'bg-red-600 text-white border-2 border-red-500 shadow-lg shadow-red-600/50'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Description */}
            <div>
              <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                <span className="mr-2">💬</span>
                Mô tả thêm (không bắt buộc)
              </label>
              <div className="relative">
                <textarea
                  {...register('description')}
                  id="description"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all pr-12"
                  placeholder="Nói hoặc gõ thêm chi tiết..."
                />
                <button
                  type="button"
                  className="absolute right-3 bottom-3 p-2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => {
                    // Voice input functionality can be added here
                    alert('Tính năng ghi âm sẽ được thêm sau');
                  }}
                >
                  🎤
                </button>
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Images (Optional) */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-300 mb-2">
                📸 Ảnh (tùy chọn, tối đa 3 ảnh, mỗi ảnh tối đa 5MB)
              </label>
              <input
                type="file"
                id="images"
                accept="image/jpeg,image/png,image/jpg"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
              />
              {selectedImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="text-sm text-gray-400">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !location || selectedEmergencyTypes.length === 0}
              className="w-full bg-red-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50 disabled:shadow-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                'Gửi yêu cầu cứu trợ'
              )}
            </button>
          </form>

          {/* Navigation Button to Dashboard */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <a
              href="/admin"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Xem Bản Đồ & Heatmap
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

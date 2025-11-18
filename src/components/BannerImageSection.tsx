import { useState, useRef } from 'react';
import Image from 'next/image';
import Button from './Button';
import { CloudArrowUpIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface BannerImageSectionProps {
  currentBanner?: {
    url: string;
    alt: string;
  };
  onBannerUpdate: (file: File | null) => Promise<void>;
}

export default function BannerImageSection({ 
  currentBanner, 
  onBannerUpdate 
}: BannerImageSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      alert('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (2MB max for banner)
    if (file.size > 2 * 1024 * 1024) {
      alert('Banner image must be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      await onBannerUpdate(file);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveBanner = async () => {
    if (confirm('Are you sure you want to remove the banner image?')) {
      try {
        setUploading(true);
        await onBannerUpdate(null);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Banner Image</h3>
        
        <div className="space-y-4">
          {/* Current Banner Preview */}
          {currentBanner ? (
            <div className="relative">
              <div className="relative h-48 md:h-64 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={currentBanner.url}
                  alt={currentBanner.alt || 'Service banner'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Replace Banner
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={TrashIcon}
                  onClick={handleRemoveBanner}
                  disabled={uploading}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 ${
                dragActive ? 'border-[#F5821F] bg-orange-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#F5821F] hover:bg-[#e0741c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5821F]"
                    disabled={uploading}
                  >
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    Upload Banner
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    or drag and drop
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  JPEG, PNG, WebP up to 2MB (Recommended: 1200x400px)
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileInput}
                disabled={uploading}
              />
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-[#F5821F] h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Uploading banner image...</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-1">Banner Image Guidelines:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Recommended dimensions: 1200x400 pixels</li>
              <li>Maximum file size: 2MB</li>
              <li>Supported formats: JPEG, PNG, WebP</li>
              <li>The banner will be displayed at the top of your service page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Modal, { ModalBody, ModalFooter } from './Modal';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement } from '@/lib/serviceManagement';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: string;
}

export default function ImageUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  serviceId 
}: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: showError, success: showSuccess } = useToast();

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (2MB limit for primary images)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      showError('Image size must be less than 2MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError('Please select an image to upload');
      return;
    }

    setLoading(true);
    try {
      await serviceManagement.updateServicePrimaryImage(serviceId, selectedFile);
      showSuccess('Primary image uploaded successfully');
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Primary Image"
      maxWidth="md"
      theme="orange"
    >
      <ModalBody className="space-y-6">
        <div className="text-sm text-gray-600">
          Upload a new primary image for this service. The image will be displayed at the top of the service details page.
        </div>

        {/* File Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging 
              ? 'border-[#F5821F] bg-orange-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {preview ? (
            <div className="space-y-4">
              <div className="relative">
                <Image
                  src={preview}
                  alt="Preview"
                  width={400}
                  height={192}
                  className="mx-auto max-h-48 rounded-lg shadow-md object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedFile();
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-gray-800 rounded-full hover:bg-red-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedFile?.name}</p>
                <p>{selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-800">
                  Drop your image here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 2MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Image Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Image Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Recommended size: 1200×400 pixels</li>
            <li>• Maximum file size: 2MB</li>
            <li>• Supported formats: JPG, PNG, GIF</li>
            <li>• Image will be optimized automatically</li>
          </ul>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="ml-3 px-4 py-2 text-sm font-medium text-white bg-[#F25F29] border border-transparent rounded-md shadow-sm hover:bg-[#F23E16] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5821F] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </ModalFooter>
    </Modal>
  );
}
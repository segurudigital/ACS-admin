'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal, { ModalBody, ModalFooter } from './Modal';
import MediaLibraryModal from './MediaLibraryModal';
import Button from './Button';
import { useToast } from '@/contexts/ToastContext';
import { MediaFile } from '@/lib/mediaService';
import {
  testimoniesAPI,
  TestimonyListItem,
  TestimonyCreateRequest,
} from '@/lib/testimoniesAPI';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface TestimonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestimonySaved: () => void;
  testimony?: TestimonyListItem;
}

export default function TestimonyModal({
  isOpen,
  onClose,
  onTestimonySaved,
  testimony,
}: TestimonyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    review: '',
    imageUrl: '',
    imageAlt: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  const { success: showSuccessToast, error: showErrorToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (testimony) {
        // Editing existing testimony
        setFormData({
          name: testimony.name,
          location: testimony.location,
          review: testimony.review,
          imageUrl: testimony.image.url,
          imageAlt: testimony.image.alt || '',
        });
      } else {
        // Creating new testimony
        resetForm();
      }
      setErrors({});
    }
  }, [isOpen, testimony]);

  const handleMediaSelect = (mediaFile: MediaFile) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: mediaFile.url,
      imageAlt: mediaFile.alt || prev.imageAlt,
    }));
    setIsMediaLibraryOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      review: '',
      imageUrl: '',
      imageAlt: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length > 200) {
      newErrors.location = 'Location must be 200 characters or less';
    }

    if (!formData.review.trim()) {
      newErrors.review = 'Review/testimonial text is required';
    } else if (formData.review.length > 2000) {
      newErrors.review = 'Review must be 2000 characters or less';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Please select a profile image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const testimonyData: TestimonyCreateRequest = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        review: formData.review.trim(),
        image: {
          url: formData.imageUrl.trim(),
          alt: formData.imageAlt.trim() || formData.name.trim(),
        },
      };

      if (testimony) {
        await testimoniesAPI.updateTestimony(testimony._id, testimonyData);
        showSuccessToast('Testimony updated successfully');
      } else {
        await testimoniesAPI.createTestimony(testimonyData);
        showSuccessToast('Testimony created successfully');
      }

      resetForm();
      onTestimonySaved();
    } catch (error) {
      console.error('Failed to save testimony:', error);
      showErrorToast(
        `Failed to save testimony: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getButtonText = (): string => {
    if (loading) return 'Saving...';
    return testimony ? 'Update Testimony' : 'Create Testimony';
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={testimony ? 'Edit Testimony' : 'Create Testimony'}
      maxWidth="2xl"
      removeBorder={true}
    >
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  placeholder="Enter person's name"
                  maxLength={100}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className={`w-full px-3 py-2 border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  placeholder="e.g., Sydney, NSW"
                  maxLength={200}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                )}
              </div>

              {/* Profile Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Profile Image *
                </label>
                <div className="flex items-center gap-4">
                  {formData.imageUrl ? (
                    <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={formData.imageUrl}
                        alt={formData.imageAlt || 'Profile preview'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`h-20 w-20 rounded-full flex items-center justify-center ${errors.imageUrl ? 'border-2 border-red-500 bg-red-50' : 'border-2 border-dashed border-gray-300 bg-gray-50'}`}>
                      <PhotoIcon className={`h-8 w-8 ${errors.imageUrl ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMediaLibraryOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      {formData.imageUrl ? 'Change Image' : 'Select Image'}
                    </button>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '', imageAlt: '' });
                        }}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {errors.imageUrl && (
                  <p className="mt-2 text-sm text-red-500">{errors.imageUrl}</p>
                )}
              </div>

              {/* Image Alt Text */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Image Alt Text (optional)
                </label>
                <input
                  type="text"
                  value={formData.imageAlt}
                  onChange={(e) =>
                    setFormData({ ...formData, imageAlt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Description of the image for accessibility"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If left empty, the person&apos;s name will be used as alt text
                </p>
              </div>

              {/* Review/Testimonial */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Testimonial *
                </label>
                <textarea
                  value={formData.review}
                  onChange={(e) =>
                    setFormData({ ...formData, review: e.target.value })
                  }
                  rows={5}
                  className={`w-full px-3 py-2 border ${errors.review ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  placeholder="Enter the testimonial text..."
                  maxLength={2000}
                />
                <div className="mt-1 flex justify-between">
                  <p className="text-sm text-red-500">{errors.review || ''}</p>
                  <span className="text-xs text-gray-500">
                    {formData.review.length}/2000
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {getButtonText()}
          </Button>
        </div>
      </ModalFooter>
    </Modal>

    <MediaLibraryModal
      isOpen={isMediaLibraryOpen}
      onClose={() => setIsMediaLibraryOpen(false)}
      onSelect={handleMediaSelect}
      title="Select Profile Image"
      allowedTypes={['avatar', 'gallery', 'thumbnail']}
      category="user"
      type="avatar"
    />
    </>
  );
}

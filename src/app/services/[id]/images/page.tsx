'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Button from '@/components/Button';
import BannerImageSection from '@/components/BannerImageSection';
import GallerySection from '@/components/GallerySection';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement } from '@/lib/serviceManagement';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ServiceImagesData {
  banner?: {
    url: string;
    key: string;
    alt: string;
  };
  gallery: Array<{
    _id: string;
    url: string;
    key: string;
    thumbnailUrl?: string;
    thumbnailKey?: string;
    alt: string;
    caption: string;
  }>;
}

export default function ServiceImagesPage() {
  const params = useParams();
  const router = useRouter();
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const serviceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [serviceName, setServiceName] = useState<string>('');
  const [hasPermission, setHasPermission] = useState(false);
  const [images, setImages] = useState<ServiceImagesData>({
    gallery: []
  });

  const fetchServiceImages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch service details to get the name and permissions
      const serviceDetails = await serviceManagement.getServiceDetails(serviceId);
      setServiceName(serviceDetails.service.name);
      
      // Check if user has permission to manage images
      if (!serviceDetails.permissions.canUpdate) {
        showErrorToast('You do not have permission to manage images for this service');
        router.push(`/services/${serviceId}`);
        return;
      }
      
      setHasPermission(true);
      
      // Fetch images
      const imagesResponse = await serviceManagement.getServiceImages(serviceId);
      setImages({
        banner: imagesResponse.banner,
        gallery: imagesResponse.gallery || []
      });
    } catch (error) {
      console.error('Failed to fetch service images:', error);
      showErrorToast('Failed to load service images');
    } finally {
      setLoading(false);
    }
  }, [serviceId, showErrorToast, router]);

  useEffect(() => {
    fetchServiceImages();
  }, [fetchServiceImages]);

  const handleBannerUpdate = async (file: File | null) => {
    if (!file) {
      // Handle banner removal if needed
      return;
    }

    try {
      await serviceManagement.updateServiceBanner(serviceId, file);
      showSuccessToast('Banner image updated successfully');
      fetchServiceImages();
    } catch (error) {
      console.error('Failed to update banner:', error);
      showErrorToast('Failed to update banner image');
    }
  };

  const handleGalleryUpdate = async (files: File[]) => {
    try {
      await serviceManagement.addGalleryImages(serviceId, files);
      showSuccessToast(`${files.length} images added to gallery`);
      fetchServiceImages();
    } catch (error) {
      console.error('Failed to add gallery images:', error);
      showErrorToast('Failed to add gallery images');
    }
  };

  const handleGalleryDelete = async (imageId: string) => {
    try {
      await serviceManagement.removeGalleryImage(serviceId, imageId);
      showSuccessToast('Image removed from gallery');
      fetchServiceImages();
    } catch (error) {
      console.error('Failed to remove gallery image:', error);
      showErrorToast('Failed to remove image');
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title="Service Images"
        description="Loading..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5821F] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading images...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Don't render upload components if user doesn't have permission
  if (!hasPermission && !loading) {
    return (
      <AdminLayout
        title="Access Denied"
        description="You don't have permission to access this page"
      >
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You do not have permission to manage images for this service.</p>
          <Button
            variant="primary"
            leftIcon={ArrowLeftIcon}
            onClick={() => router.push(`/services/${serviceId}`)}
          >
            Back to Service Details
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Images - ${serviceName}`}
      description="Manage banner and gallery images for this service"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Button
            variant="ghost"
            leftIcon={ArrowLeftIcon}
            onClick={() => router.push(`/services/${serviceId}`)}
          >
            Back to Service Details
          </Button>
        </div>

        {/* Banner Section */}
        <BannerImageSection
          currentBanner={images.banner}
          onBannerUpdate={handleBannerUpdate}
        />

        {/* Gallery Section */}
        <GallerySection
          images={images.gallery}
          onImagesUpdate={handleGalleryUpdate}
          onImageDelete={handleGalleryDelete}
        />
      </div>
    </AdminLayout>
  );
}
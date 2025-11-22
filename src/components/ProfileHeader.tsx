'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { usePermissions } from '../contexts/HierarchicalPermissionContext';
import { useToast } from '../contexts/ToastContext';
import { ProfileManagement } from '../lib/profileManagement';
import Button from './Button';
import Card from './Card';

export default function ProfileHeader() {
  const { user, reloadPermissions } = usePermissions();
  const { info, error, success } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Please select an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      error('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await ProfileManagement.updateProfileAvatar(file);
      
      if (result.success) {
        success('Profile picture updated successfully');
        // Reset image load error state and refresh user data to get the new avatar URL
        setImageLoadError(false);
        await reloadPermissions();
      }
    } catch (uploadError) {
      console.error('Avatar upload error:', uploadError);
      error(uploadError instanceof Error ? uploadError.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasValidAvatar = () => {
    if (!user.avatar) return false;
    
    // Handle both object format from backend and string format for compatibility
    if (typeof user.avatar === 'object' && user.avatar.url) {
      return user.avatar.url.trim() !== "";
    }
    
    if (typeof user.avatar === 'string') {
      return user.avatar.trim() !== "";
    }
    
    return false;
  };

  const getAvatarUrl = () => {
    if (!user.avatar) return '';
    
    // Handle both object format from backend and string format for compatibility
    if (typeof user.avatar === 'object' && user.avatar.url) {
      return user.avatar.url;
    }
    
    if (typeof user.avatar === 'string') {
      return user.avatar;
    }
    
    return '';
  };

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="relative group w-24 h-24 rounded-full flex items-center justify-center overflow-hidden hover:ring-4 hover:ring-blue-500/20 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: hasValidAvatar() && !imageLoadError ? 'transparent' : '#454545' }}
              aria-label="Change profile picture"
            >
              {hasValidAvatar() && !imageLoadError ? (
                <Image 
                  src={getAvatarUrl()} 
                  alt="Profile" 
                  width={96}
                  height={96}
                  className="rounded-full object-cover w-24 h-24"
                  onError={() => {
                    setImageLoadError(true);
                  }}
                  onLoad={() => {
                    setImageLoadError(false);
                  }}
                  style={{ 
                    position: 'relative',
                    zIndex: 10
                  }}
                />
              ) : (
                <span className="text-white text-2xl font-medium">
                  {getInitials(user.name)}
                </span>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 rounded-full flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* User Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center mt-2">
              <div className={`w-2 h-2 rounded-full mr-2 ${user.verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={`text-sm ${user.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.verified ? 'Email Verified' : 'Email Not Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 sm:mt-0">
          {!user.verified && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => info('Email verification feature coming soon')}
            >
              Verify Email
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
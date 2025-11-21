import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  children: React.ReactNode;
  className?: string;
}

interface AvatarImageProps {
  src?: string | { url: string; key: string };
  alt?: string;
  className?: string;
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
}

export const Avatar = ({ children, className = '' }: AvatarProps) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt = '', className = '' }: AvatarImageProps) => {
  // Handle both object format from backend and string format for compatibility
  let imageUrl = '';
  if (typeof src === 'object' && src && 'url' in src) {
    imageUrl = (src as { url: string; key: string }).url;
  } else if (typeof src === 'string') {
    imageUrl = src;
  }
  
  if (!imageUrl || imageUrl.trim() === '') return null;
  
  return (
    <Image
      className={`aspect-square h-full w-full object-cover ${className}`}
      src={imageUrl}
      alt={alt}
      fill
      sizes="40px"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

export const AvatarFallback = ({ children, className = '' }: AvatarFallbackProps) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium ${className}`}>
    {children}
  </div>
);
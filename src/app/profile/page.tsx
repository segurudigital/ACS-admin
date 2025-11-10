'use client';

import AdminLayout from '../../components/AdminLayout';
import PlaceholderCard from '../../components/PlaceholderCard';

export default function Profile() {
  return (
    <AdminLayout 
      title="Profile" 
      description="Manage your admin account and personal settings"
    >
      <div className="space-y-6">
        <PlaceholderCard
          title="User Profile"
          description="Update your profile information, change password, and manage account preferences."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      </div>
    </AdminLayout>
  );
}
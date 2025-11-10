'use client';

import AdminLayout from '../../components/AdminLayout';
import PlaceholderCard from '../../components/PlaceholderCard';

export default function Notifications() {
  return (
    <AdminLayout 
      title="Notifications" 
      description="Send and manage system notifications"
    >
      <div className="space-y-6">
        <PlaceholderCard
          title="Notifications Center"
          description="Create, send, and manage push notifications for mobile app users."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19v-7a7 7 0 1114 0v7M4 19h11" />
            </svg>
          }
        />
      </div>
    </AdminLayout>
  );
}
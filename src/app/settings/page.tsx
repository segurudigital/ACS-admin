'use client';

import AdminLayout from '../../components/AdminLayout';
import PlaceholderCard from '../../components/PlaceholderCard';
import Link from 'next/link';
import { useAuth } from '../../contexts/PermissionContext';

export default function Settings() {
  const { hasPermission } = useAuth();
  const canManageServiceTypes = hasPermission('manage_service_types') || hasPermission('*');

  return (
    <AdminLayout 
      title="Settings" 
      description="Configure system settings and preferences"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlaceholderCard
          title="System Settings"
          description="Configure application settings, email preferences, security options, and system configurations."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        
        {canManageServiceTypes && (
          <Link href="/settings/service-types" className="block">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 text-blue-600 dark:text-blue-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Service Types</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Manage the types of services available in the system. Add, edit, or remove service categories.
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </AdminLayout>
  );
}
'use client';

import { useAuth } from '../../../contexts/HierarchicalPermissionContext';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import { useEffect } from 'react';

export default function SystemConfig() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasPermission('*')) {
      router.push('/settings');
      return;
    }
  }, [hasPermission, router]);

  if (!hasPermission('*')) {
    return null;
  }

  return (
    <AdminLayout 
      title="System Configuration" 
      description="Configure application settings, email preferences, security options, and system defaults"
    >
      <div className="space-y-6">
        {/* Coming Soon Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Coming Soon
              </h3>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                This system configuration page is under development. Soon you&apos;ll be able to configure email settings, security options, and other system defaults here.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Cards for Future Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Email Configuration */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 opacity-60">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Settings</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Configure SMTP settings, email templates, and notification preferences.
                </p>
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 opacity-60">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Options</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Configure password policies, session timeouts, and two-factor authentication.
                </p>
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          {/* Application Defaults */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 opacity-60">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Application Defaults</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Set default values for time zones, date formats, and regional preferences.
                </p>
                <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Available Now Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Available Configuration Options
          </h2>
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Role & Access Limits
                </h3>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  You can already configure role-based account limits through the{' '}
                  <a href="/settings/role-limits" className="underline font-medium">
                    Role & Access Limits
                  </a>{' '}
                  page.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
'use client';

import AdminLayout from '../../components/AdminLayout';
import PlaceholderCard from '../../components/PlaceholderCard';

export default function Reports() {
  return (
    <AdminLayout 
      title="Reports" 
      description="Generate and view system reports and analytics"
    >
      <div className="space-y-6">
        <PlaceholderCard
          title="Reports & Analytics"
          description="Generate detailed reports on user activity, system performance, and community service metrics."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>
    </AdminLayout>
  );
}
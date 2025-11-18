'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AuthService } from '../lib/auth';
import Sidebar from './Sidebar';

interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  hideTitle?: boolean;
  hideHeader?: boolean;
}

export default function AdminLayout({ children, title, description, hideTitle, hideHeader }: AdminLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = AuthService.getToken();
      
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await AuthService.verifyAuth(token);
        
        if (response.success && response.data) {
          setUser(response.data.user);
        } else {
          AuthService.removeToken();
          router.push('/');
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        AuthService.removeToken();
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on small screens, collapsible on larger screens */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out flex-shrink-0 hidden lg:block`}>
        <div className="fixed top-0 left-0 h-full bg-white shadow-lg z-30" 
             style={{ width: sidebarCollapsed ? '4rem' : '16rem' }}>
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50">
            <Sidebar collapsed={false} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        {!hideHeader && (
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center">
              {/* Mobile hamburger menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Desktop sidebar toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hidden lg:inline-flex"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="ml-4">
                {!hideTitle && title && (
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                )}
                {!hideTitle && description && (
                  <p className="text-gray-600 text-sm mt-1">{description}</p>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#454545' }}>
                {user.avatar ? (
                  <Image 
                    src={user.avatar} 
                    alt="Profile" 
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AuthService } from '../lib/auth';
import SidebarItem from './SidebarItem';
import SidebarSectionHeader from './SidebarSectionHeader';
import { MenuIcon } from './MenuIcon';
import { useMenuAccess } from '@/hooks/useMenuAccess';
import { useHierarchicalPermissions } from '../contexts/HierarchicalPermissionContext';
import { MenuItem, MenuContext } from '@/types/menu';

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const router = useRouter();
  const { teamRole, currentTeam, permissions, currentLevel, roleCategory } = useHierarchicalPermissions();
  const { sections, itemsBySection } = useMenuAccess();

  // Build context for dynamic hrefs
  const menuContext: MenuContext = {
    teamRole,
    currentTeam,
    roleCategory,
    permissions,
    hierarchyLevel: currentLevel,
  };

  const handleLogout = async () => {
    console.log('[Sidebar] Logout initiated');
    try {
      await AuthService.logout();
      console.log('[Sidebar] AuthService.logout() completed - waiting for context to handle redirect');
    } catch (error) {
      console.error('[Sidebar] Logout error:', error);
      router.push('/');
    }
  };

  // Helper to resolve dynamic hrefs
  const resolveHref = (item: MenuItem): string => {
    if (typeof item.href === 'function') {
      return item.href(menuContext);
    }
    return item.href;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#F25F29] to-[#F23E16]">
      {/* Logo Section */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-orange-700/30">
        <Image
          src="/logo.png"
          alt="Adventist Community Services Logo"
          width={collapsed ? 40 : 140}
          height={collapsed ? 40 : 140}
          className="object-contain rounded-xl shadow-lg"
        />
        {/* Mobile close button */}
        {!collapsed && onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-white hover:bg-white/10 rounded absolute right-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Team Context Indicator */}
      {currentTeam && !collapsed && (
        <div className="px-4 py-3 border-b border-orange-700/30">
          <div className="text-xs text-white mb-1">Current Team</div>
          <div className="text-sm font-medium text-white flex items-center">
            <span className="truncate">{currentTeam.name}</span>
            {teamRole && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                {teamRole.charAt(0).toUpperCase() + teamRole.slice(1)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation - Config Driven */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {sections.map((section, index) => {
          const sectionItems = itemsBySection[section.id];
          const isLastSection = index === sections.length - 1;

          return (
            <div key={section.id} className={isLastSection ? '' : 'mb-6'}>
              {/* Show section header if title exists */}
              {section.title && (
                <SidebarSectionHeader
                  title={section.title}
                  collapsed={collapsed}
                />
              )}

              {/* Render menu items for this section */}
              <div className="space-y-0.5">
                {sectionItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    href={resolveHref(item)}
                    icon={<MenuIcon icon={item.icon} />}
                    label={item.label}
                    badge={item.badge}
                    collapsed={collapsed}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Section & Logout */}
      <div className="border-t border-orange-700/30 p-4 space-y-1">
        <button
          onClick={() => {
            handleLogout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-white/10 transition-colors duration-200 group"
        >
          {collapsed ? (
            <span className="w-5 h-5 text-white mx-auto">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
          ) : (
            <span className="flex-1 text-left">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
}

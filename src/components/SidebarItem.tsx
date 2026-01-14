'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string | number;
  onClick?: () => void;
  collapsed?: boolean;
}

export default function SidebarItem({ href, icon, label, badge, onClick, collapsed = false }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const baseClasses = "flex items-center px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 group";
  const activeClasses = isActive 
    ? "bg-white/20 text-white" 
    : "text-white hover:bg-white/10 hover:text-white";

  const iconClasses = isActive 
    ? "text-white" 
    : "text-white group-hover:text-white";

  return (
    <Link 
      href={href} 
      className={`${baseClasses} ${activeClasses}`}
      onClick={handleClick}
    >
      {collapsed ? (
        <span className={`w-5 h-5 ${iconClasses} mx-auto`}>
          {icon}
        </span>
      ) : (
        <>
          <span className="flex-1 truncate">{label}</span>
          
          {badge && (
            <span className="ml-3 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-white/20 text-white">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
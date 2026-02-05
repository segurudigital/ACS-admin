'use client';

import { useMemo } from 'react';
import { useHierarchicalPermissions } from '@/contexts/HierarchicalPermissionContext';
import { MENU_ITEMS, MENU_SECTIONS } from '@/config/menuConfig';
import {
  MenuItem,
  MenuContext,
  FilteredMenuResult,
  RoleCategory,
  MenuSection,
} from '@/types/menu';

/**
 * Determines the user's role category based on hierarchy level, role name, and team role
 */
function determineRoleCategory(
  permissions: string[],
  hierarchyLevel: number,
  roleName: string | null,
  teamRole: 'leader' | 'member' | 'communications' | null
): RoleCategory {
  // Super admin check - wildcard permissions
  if (permissions.includes('*') || permissions.includes('all')) {
    return 'super_admin';
  }

  // Check role name for explicit category
  if (roleName) {
    const lowerRole = roleName.toLowerCase();
    if (lowerRole.includes('super_admin') || lowerRole === 'super_admin') {
      return 'super_admin';
    }
    if (lowerRole.includes('union_admin') || lowerRole === 'union_admin') {
      return 'union_admin';
    }
    if (lowerRole.includes('conference_admin') || lowerRole === 'conference_admin') {
      return 'conference_admin';
    }
    if (lowerRole.includes('viewer') || lowerRole === 'viewer') {
      return 'viewer';
    }
  }

  // Map hierarchy level to role category
  // Level 0 = Union level (super_admin or union_admin)
  // Level 1 = Conference level
  // Level 2 = Church level
  // Level 3 = Team level
  // Level 4 = Service level
  switch (hierarchyLevel) {
    case 0:
      if (roleName?.includes('union')) return 'union_admin';
      return 'super_admin';
    case 1:
      return 'conference_admin';
    case 2:
      return 'team_leader';
    case 3:
    case 4:
      if (teamRole === 'leader') return 'team_leader';
      if (teamRole === 'communications') return 'communications';
      return 'team_member';
    default:
      return 'viewer';
  }
}

/**
 * Hook for filtering menu items based on user's role and permissions
 */
export function useMenuAccess(): FilteredMenuResult {
  const {
    permissions,
    hasPermission,
    teamRole,
    currentTeam,
    currentLevel,
    role,
  } = useHierarchicalPermissions();

  // Determine roleCategory from hierarchy level and role name
  const roleCategory = useMemo((): RoleCategory => {
    return determineRoleCategory(permissions, currentLevel, role, teamRole);
  }, [permissions, currentLevel, role, teamRole]);

  // Build menu context
  const menuContext = useMemo(
    (): MenuContext => ({
      teamRole,
      currentTeam,
      roleCategory,
      permissions,
      hierarchyLevel: currentLevel,
    }),
    [teamRole, currentTeam, roleCategory, permissions, currentLevel]
  );

  // Filter menu items based on role and permissions
  const filteredItems = useMemo((): MenuItem[] => {
    return MENU_ITEMS.filter((item) => {
      // Check role category access
      if (!item.allowedRoles.includes(roleCategory)) {
        return false;
      }

      // Check required permission if specified
      if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
        return false;
      }

      // Check multiple permissions if specified
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        const permissionCheck = item.requireAllPermissions
          ? item.requiredPermissions.every((p) => hasPermission(p))
          : item.requiredPermissions.some((p) => hasPermission(p));

        if (!permissionCheck) return false;
      }

      // Check custom condition if specified
      if (item.condition && !item.condition(menuContext)) {
        return false;
      }

      return true;
    });
  }, [roleCategory, hasPermission, menuContext]);

  // Group items by section
  const itemsBySection = useMemo((): Record<MenuSection, MenuItem[]> => {
    const result: Record<MenuSection, MenuItem[]> = {
      main: [],
      hierarchy: [],
      services_events: [],
      user_management: [],
      content: [],
      media: [],
      my_team: [],
      system: [],
    };

    filteredItems.forEach((item) => {
      result[item.section].push(item);
    });

    return result;
  }, [filteredItems]);

  // Filter sections to only include those with visible items
  const visibleSections = useMemo(() => {
    return MENU_SECTIONS.filter(
      (section) => itemsBySection[section.id].length > 0
    ).sort((a, b) => a.order - b.order);
  }, [itemsBySection]);

  return {
    sections: visibleSections,
    items: filteredItems,
    itemsBySection,
  };
}

/**
 * Utility hook to check single menu item visibility
 */
export function useMenuItemVisible(menuId: string): boolean {
  const { items } = useMenuAccess();
  return items.some((item) => item.id === menuId);
}

/**
 * Utility hook to get current role category
 */
export function useRoleCategory(): RoleCategory {
  const { permissions, currentLevel, role, teamRole } = useHierarchicalPermissions();
  return determineRoleCategory(permissions, currentLevel, role, teamRole);
}

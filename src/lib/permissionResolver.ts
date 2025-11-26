import { HierarchyLevel, isInSubtree, getParentPath } from './hierarchyUtils';

export interface User {
  id: string;
  hierarchyLevel: number;
  hierarchyPath: string;
  managedLevels: number[];
  permissions?: string[];
  teamAssignments?: Array<{
    teamId: string;
    role: 'leader' | 'member' | 'communications';
    team?: { _id: string; hierarchyPath: string };
  }>;
}

export interface Entity {
  _id: string;
  hierarchyPath: string;
  hierarchyLevel?: string | number;
  type?: string;
}

export type PermissionScope = 'all' | 'subordinate' | 'own' | 'none';
export type EntityAction = 'view' | 'create' | 'edit' | 'delete' | 'manage';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  scope?: PermissionScope;
}

/**
 * Unified permission resolver for hierarchical permission checks
 */
export class PermissionResolver {
  private permissionCache: Map<string, { result: PermissionCheckResult; timestamp: number }>;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.permissionCache = new Map();
  }

  /**
   * Clear the permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.permissionCache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  /**
   * Check if user can perform an action on an entity
   */
  canPerformAction(
    user: User | null,
    action: EntityAction,
    entity: Entity | null,
    entityType: string
  ): PermissionCheckResult {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    const cacheKey = `${user.id}:${action}:${entity?._id || 'new'}:${entityType}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    // Super admin can do anything
    if (user.hierarchyLevel === HierarchyLevel.SUPER_ADMIN) {
      return this.setCachedResult(cacheKey, { allowed: true, scope: 'all' });
    }

    let result: PermissionCheckResult;

    switch (action) {
      case 'view':
        result = this.checkViewPermission(user, entity, entityType);
        break;
      case 'create':
        result = this.checkCreatePermission(user, entity, entityType);
        break;
      case 'edit':
        result = this.checkEditPermission(user, entity, entityType);
        break;
      case 'delete':
        result = this.checkDeletePermission(user, entity, entityType);
        break;
      case 'manage':
        result = this.checkManagePermission(user, entity, entityType);
        break;
      default:
        result = { allowed: false, reason: 'Unknown action' };
    }

    return this.setCachedResult(cacheKey, result);
  }

  /**
   * Check view permission
   */
  private checkViewPermission(user: User, entity: Entity | null, entityType: string): PermissionCheckResult {
    // Everyone can view active entities in their hierarchy
    if (!entity) {
      return { allowed: true, scope: 'subordinate' };
    }

    // Check if entity is in user's subtree
    if (isInSubtree(entity.hierarchyPath, user.hierarchyPath)) {
      return { allowed: true, scope: 'subordinate' };
    }

    // Check explicit permissions
    const permission = `${entityType}.view`;
    if (this.hasPermission(user, permission)) {
      return { allowed: true, scope: 'all' };
    }

    if (this.hasPermission(user, `${permission}:subordinate`) && 
        isInSubtree(entity.hierarchyPath, user.hierarchyPath)) {
      return { allowed: true, scope: 'subordinate' };
    }

    return { allowed: false, reason: 'Entity outside user hierarchy' };
  }

  /**
   * Check create permission
   */
  private checkCreatePermission(user: User, parentEntity: Entity | null, entityType: string): PermissionCheckResult {
    // Determine required level for creation
    const requiredLevels: Record<string, number> = {
      'entity': 1, // Conference can create churches
      'team': 2,         // Church can create teams
      'service': 3       // Team can create services
    };

    const requiredLevel = requiredLevels[entityType];
    if (requiredLevel === undefined) {
      return { allowed: false, reason: 'Unknown entity type' };
    }

    // Check user level
    if (user.hierarchyLevel > requiredLevel - 1) {
      return { allowed: false, reason: 'Insufficient hierarchy level' };
    }

    // Check if parent is in user's subtree
    if (parentEntity && !isInSubtree(parentEntity.hierarchyPath, user.hierarchyPath)) {
      return { allowed: false, reason: 'Parent entity outside user hierarchy' };
    }

    // Check explicit permissions
    const permission = `${entityType}.create`;
    if (this.hasPermission(user, permission)) {
      return { allowed: true, scope: 'all' };
    }

    if (this.hasPermission(user, `${permission}:subordinate`)) {
      return { allowed: true, scope: 'subordinate' };
    }

    // Implicit permissions based on level
    if (user.hierarchyLevel <= requiredLevel - 1) {
      return { allowed: true, scope: 'subordinate' };
    }

    return { allowed: false, reason: 'No create permission' };
  }

  /**
   * Check edit permission
   */
  private checkEditPermission(user: User, entity: Entity | null, entityType: string): PermissionCheckResult {
    if (!entity) {
      return { allowed: false, reason: 'Entity not found' };
    }

    // Check if entity is in user's subtree
    const inSubtree = isInSubtree(entity.hierarchyPath, user.hierarchyPath);

    // Check explicit permissions
    const permission = `${entityType}.edit`;
    if (this.hasPermission(user, permission)) {
      return { allowed: true, scope: 'all' };
    }

    if (this.hasPermission(user, `${permission}:subordinate`) && inSubtree) {
      return { allowed: true, scope: 'subordinate' };
    }

    if (this.hasPermission(user, `${permission}:own`)) {
      const parentPath = getParentPath(entity.hierarchyPath);
      if (parentPath === user.hierarchyPath) {
        return { allowed: true, scope: 'own' };
      }
    }

    // Check management permissions
    const entityLevel = this.getEntityLevel(entity, entityType);
    if (user.managedLevels.includes(entityLevel) && inSubtree) {
      return { allowed: true, scope: 'subordinate' };
    }

    return { allowed: false, reason: 'No edit permission' };
  }

  /**
   * Check delete permission
   */
  private checkDeletePermission(user: User, entity: Entity | null, entityType: string): PermissionCheckResult {
    if (!entity) {
      return { allowed: false, reason: 'Entity not found' };
    }

    // Check if entity is in user's subtree
    const inSubtree = isInSubtree(entity.hierarchyPath, user.hierarchyPath);

    // Check explicit permissions
    const permission = `${entityType}.delete`;
    if (this.hasPermission(user, permission)) {
      return { allowed: true, scope: 'all' };
    }

    if (this.hasPermission(user, `${permission}:subordinate`) && inSubtree) {
      return { allowed: true, scope: 'subordinate' };
    }

    // Only allow deletion of entities at lower levels
    const entityLevel = this.getEntityLevel(entity, entityType);
    if (user.hierarchyLevel < entityLevel && inSubtree) {
      return { allowed: true, scope: 'subordinate' };
    }

    return { allowed: false, reason: 'No delete permission' };
  }

  /**
   * Check manage permission
   */
  private checkManagePermission(user: User, entity: Entity | null, entityType: string): PermissionCheckResult {
    if (!entity) {
      // Check if user can manage this type in general
      const permission = `${entityType}.manage`;
      if (this.hasPermission(user, permission) || this.hasPermission(user, `${permission}:subordinate`)) {
        return { allowed: true, scope: 'subordinate' };
      }
      return { allowed: false, reason: 'No manage permission' };
    }

    // Check if entity is in user's subtree
    const inSubtree = isInSubtree(entity.hierarchyPath, user.hierarchyPath);
    if (!inSubtree) {
      return { allowed: false, reason: 'Entity outside user hierarchy' };
    }

    // Check if user's level can manage entity's level
    const entityLevel = this.getEntityLevel(entity, entityType);
    if (!user.managedLevels.includes(entityLevel)) {
      return { allowed: false, reason: 'Cannot manage this hierarchy level' };
    }

    return { allowed: true, scope: 'subordinate' };
  }

  /**
   * Check if user has a specific permission
   */
  private hasPermission(user: User, permission: string): boolean {
    if (!user.permissions) return false;

    // Check for wildcard
    if (user.permissions.includes('*')) return true;

    // Check exact permission
    if (user.permissions.includes(permission)) return true;

    // Check resource wildcard
    const [resource] = permission.split('.');
    if (user.permissions.includes(`${resource}.*`)) return true;

    // Check team role permissions
    // TODO: Implement team-based permission checking
    if (user.teamAssignments?.length) {
      // Team-based permission logic will be implemented here
    }

    return false;
  }

  /**
   * Get entity hierarchy level
   */
  private getEntityLevel(entity: Entity, entityType: string): number {
    // If entity has explicit level, use it
    if (entity.hierarchyLevel !== undefined) {
      return typeof entity.hierarchyLevel === 'number' ? entity.hierarchyLevel : this.parseLevel(entity.hierarchyLevel);
    }

    // Otherwise, infer from entity type
    const typeLevels: Record<string, number> = {
      'entity': 2, // Churches
      'team': 3,
      'service': 4
    };

    return typeLevels[entityType] || 4;
  }

  /**
   * Parse hierarchy level string to number
   */
  private parseLevel(level: string): number {
    const levelMap: Record<string, number> = {
      'super_admin': 0,
      'union': 1,
      'conference': 1,
      'church': 2,
      'team': 3,
      'service': 4
    };

    return levelMap[level] || 4;
  }

  /**
   * Get cached result
   */
  private getCachedResult(key: string): PermissionCheckResult | null {
    const cached = this.permissionCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.permissionCache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * Set cached result
   */
  private setCachedResult(key: string, result: PermissionCheckResult): PermissionCheckResult {
    this.permissionCache.set(key, {
      result,
      timestamp: Date.now()
    });
    return result;
  }

  /**
   * Check multiple permissions at once
   */
  canPerformActions(
    user: User | null,
    actions: EntityAction[],
    entity: Entity | null,
    entityType: string
  ): Record<EntityAction, PermissionCheckResult> {
    const results: Record<EntityAction, PermissionCheckResult> = {} as Record<EntityAction, PermissionCheckResult>;

    for (const action of actions) {
      results[action] = this.canPerformAction(user, action, entity, entityType);
    }

    return results;
  }

  /**
   * Get all allowed actions for an entity
   */
  getAllowedActions(
    user: User | null,
    entity: Entity | null,
    entityType: string
  ): EntityAction[] {
    const allActions: EntityAction[] = ['view', 'create', 'edit', 'delete', 'manage'];
    const allowed: EntityAction[] = [];

    for (const action of allActions) {
      const result = this.canPerformAction(user, action, entity, entityType);
      if (result.allowed) {
        allowed.push(action);
      }
    }

    return allowed;
  }

  /**
   * Check if user can access a specific hierarchy path
   */
  canAccessPath(user: User | null, targetPath: string): boolean {
    if (!user) return false;

    // Super admin can access everything
    if (user.hierarchyLevel === HierarchyLevel.SUPER_ADMIN) return true;

    // Check if target is in user's subtree
    return isInSubtree(targetPath, user.hierarchyPath);
  }

  /**
   * Get the scope of user's permissions for an entity
   */
  getPermissionScope(user: User | null, entity: Entity | null): PermissionScope {
    if (!user) return 'none';
    if (user.hierarchyLevel === HierarchyLevel.SUPER_ADMIN) return 'all';
    
    if (!entity) return 'subordinate';

    if (isInSubtree(entity.hierarchyPath, user.hierarchyPath)) {
      const parentPath = getParentPath(entity.hierarchyPath);
      if (parentPath === user.hierarchyPath) {
        return 'own';
      }
      return 'subordinate';
    }

    return 'none';
  }
}

// Export singleton instance
export const permissionResolver = new PermissionResolver();
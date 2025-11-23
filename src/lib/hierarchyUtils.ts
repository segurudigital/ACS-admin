export enum HierarchyLevel {
  SUPER_ADMIN = 0,
  UNION = 1,
  CONFERENCE = 2,
  CHURCH = 3,
  TEAM = 4,
  SERVICE = 5
}

export const HIERARCHY_LEVEL_NAMES: Record<number, string> = {
  0: 'super_admin',
  1: 'union',
  2: 'conference',
  3: 'church',
  4: 'team',
  5: 'service'
};

export const ENTITY_TYPE_LEVELS: Record<string, number> = {
  'organization': 3, // Churches are at level 3
  'team': 4,
  'service': 5
};

export interface HierarchySegment {
  id: string;
  level: number;
  type?: string;
}

export interface HierarchyValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface HierarchyEntity {
  _id: string;
  hierarchyPath: string;
  hierarchyLevel: string | number;
  hierarchyDepth?: number;
  parentId?: string;
  isActive?: boolean;
}

/**
 * Parses a hierarchy path into segments with level information
 */
export function parseHierarchyPath(path: string): HierarchySegment[] {
  if (!path || path === '') return [];
  
  const segments = path.split('/');
  return segments.map((segment, index) => {
    // Determine type from segment pattern if possible
    let type: string | undefined;
    if (segment.startsWith('team_')) {
      type = 'team';
    } else if (segment.startsWith('service_')) {
      type = 'service';
    } else {
      // Infer from position
      type = HIERARCHY_LEVEL_NAMES[index + 1];
    }
    
    return {
      id: segment,
      level: index + 1,
      type
    };
  });
}

/**
 * Gets the depth of a hierarchy path
 */
export function getHierarchyDepth(path: string): number {
  if (!path || path === '') return 0;
  return path.split('/').length;
}

/**
 * Validates if a parent-child relationship is valid based on levels
 */
export function isValidParent(childLevel: number, parentLevel: number): boolean {
  // Child must be exactly one level below parent
  return childLevel === parentLevel + 1;
}

/**
 * Builds a hierarchy path for a new entity
 */
export function buildHierarchyPath(parentPath: string, entityId: string): string {
  if (!entityId) {
    throw new Error('Entity ID is required to build hierarchy path');
  }
  
  if (!parentPath || parentPath === '') {
    return entityId;
  }
  
  return `${parentPath}/${entityId}`;
}

/**
 * Extracts the entity level from a hierarchy path
 */
export function extractEntityLevel(path: string): HierarchyLevel {
  const depth = getHierarchyDepth(path);
  
  // Map depth to hierarchy level
  switch (depth) {
    case 0: return HierarchyLevel.SUPER_ADMIN;
    case 1: return HierarchyLevel.UNION;
    case 2: return HierarchyLevel.CHURCH;
    case 3: return HierarchyLevel.TEAM;
    case 4: return HierarchyLevel.SERVICE;
    default: return HierarchyLevel.SERVICE; // Default to lowest level
  }
}

/**
 * Checks if an entity is in the subtree of another entity
 */
export function isInSubtree(entityPath: string, ancestorPath: string): boolean {
  if (!entityPath || !ancestorPath) return false;
  
  // Entity is in subtree if its path starts with ancestor path + /
  return entityPath.startsWith(ancestorPath + '/');
}

/**
 * Gets all ancestor paths from a hierarchy path
 */
export function getAncestorPaths(path: string): string[] {
  if (!path || path === '') return [];
  
  const segments = path.split('/');
  const ancestors: string[] = [];
  
  for (let i = 1; i <= segments.length; i++) {
    ancestors.push(segments.slice(0, i).join('/'));
  }
  
  return ancestors;
}

/**
 * Validates a hierarchy path format
 */
export function isValidPathFormat(path: string): boolean {
  if (path === '') return true; // Empty path is valid for root
  if (!path || typeof path !== 'string') return false;
  
  // Path segments should be alphanumeric with underscores
  const pathRegex = /^[a-zA-Z0-9_]+(\/[a-zA-Z0-9_]+)*$/;
  return pathRegex.test(path);
}

/**
 * Gets the immediate parent path from a hierarchy path
 */
export function getParentPath(path: string): string | null {
  if (!path || path === '') return null;
  
  const lastSlashIndex = path.lastIndexOf('/');
  if (lastSlashIndex === -1) return null;
  
  return path.substring(0, lastSlashIndex);
}

/**
 * Gets the entity ID from a hierarchy path (last segment)
 */
export function getEntityIdFromPath(path: string): string | null {
  if (!path || path === '') return null;
  
  const segments = path.split('/');
  return segments[segments.length - 1];
}

/**
 * Validates that an entity can be created at a specific level
 */
export function canCreateAtLevel(
  userLevel: number,
  entityType: string,
  parentPath?: string
): HierarchyValidationResult {
  const result: HierarchyValidationResult = {
    isValid: true,
    errors: []
  };
  
  const requiredLevel = ENTITY_TYPE_LEVELS[entityType.toLowerCase()];
  if (requiredLevel === undefined) {
    result.isValid = false;
    result.errors.push(`Unknown entity type: ${entityType}`);
    return result;
  }
  
  // User must be at or above the required level to create
  if (userLevel > requiredLevel - 1) {
    result.isValid = false;
    result.errors.push(`Insufficient privileges to create ${entityType}`);
  }
  
  // If parent path provided, validate it
  if (parentPath && !isValidPathFormat(parentPath)) {
    result.isValid = false;
    result.errors.push('Invalid parent hierarchy path format');
  }
  
  return result;
}

/**
 * Checks for circular dependencies in hierarchy
 */
export function hasCircularDependency(
  entityId: string,
  newParentPath: string,
  currentPath?: string
): boolean {
  if (!newParentPath) return false;
  
  // Simple check: entity ID should not be in its own parent path
  if (newParentPath.includes(entityId)) {
    return true;
  }
  
  // If current path provided, check if new parent is currently a child
  if (currentPath && isInSubtree(newParentPath, currentPath)) {
    return true;
  }
  
  return false;
}

/**
 * Formats a hierarchy path for display
 */
export function formatHierarchyPath(path: string): string {
  if (!path) return '';
  
  const segments = parseHierarchyPath(path);
  return segments
    .map(seg => seg.type ? `${seg.type}:${seg.id}` : seg.id)
    .join(' > ');
}

/**
 * Validates organization hierarchy constraints
 */
export function validateOrganizationHierarchy(
  hierarchyLevel: string,
  parentLevel?: string
): HierarchyValidationResult {
  const result: HierarchyValidationResult = {
    isValid: true,
    errors: []
  };
  
  const validLevels = ['union', 'conference', 'church'];
  
  if (!validLevels.includes(hierarchyLevel)) {
    result.isValid = false;
    result.errors.push(`Invalid hierarchy level: ${hierarchyLevel}`);
  }
  
  if (parentLevel) {
    const parentIndex = validLevels.indexOf(parentLevel);
    const childIndex = validLevels.indexOf(hierarchyLevel);
    
    if (childIndex !== parentIndex + 1) {
      result.isValid = false;
      result.errors.push('Invalid parent-child hierarchy relationship');
    }
    
    if (parentLevel === 'church') {
      result.isValid = false;
      result.errors.push('Churches cannot have child organizations');
    }
  }
  
  return result;
}

/**
 * Filters entities by hierarchy access
 */
export function filterByHierarchyAccess<T extends HierarchyEntity>(
  entities: T[],
  userPath: string,
  userLevel: number
): T[] {
  return entities.filter(entity => {
    // Super admin can see everything
    if (userLevel === HierarchyLevel.SUPER_ADMIN) return true;
    
    // Entity must be in user's subtree
    return entity.hierarchyPath.startsWith(userPath);
  });
}

/**
 * Sorts entities by hierarchy path (depth-first)
 */
export function sortByHierarchy<T extends HierarchyEntity>(entities: T[]): T[] {
  return entities.sort((a, b) => {
    // Sort by path to maintain hierarchy order
    return a.hierarchyPath.localeCompare(b.hierarchyPath);
  });
}

/**
 * Groups entities by their parent path
 */
export function groupByParent<T extends HierarchyEntity>(
  entities: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  
  entities.forEach(entity => {
    const parentPath = getParentPath(entity.hierarchyPath) || 'root';
    if (!groups[parentPath]) {
      groups[parentPath] = [];
    }
    groups[parentPath].push(entity);
  });
  
  return groups;
}
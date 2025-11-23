// New Hierarchical Organization Utilities
// Replaces hierarchyLevel-based system with Union/Conference/Church specific utilities

import { Union, Conference, Church, HierarchicalEntity } from '../types/rbac';
import { EntityType, EntityLevel, ENTITY_LEVEL_MAP } from '../types/hierarchy';

/**
 * Type guards for organizational entities
 */
export function isUnion(entity: HierarchicalEntity): entity is Union {
  return entity.type === 'union';
}

export function isConference(entity: HierarchicalEntity): entity is Conference {
  return entity.type === 'conference';
}

export function isChurch(entity: HierarchicalEntity): entity is Church {
  return entity.type === 'church';
}

/**
 * Get entity level from type
 */
export function getEntityLevel(type: EntityType): EntityLevel {
  return ENTITY_LEVEL_MAP[type].level;
}

/**
 * Get entity type from level
 */
export function getEntityTypeFromLevel(level: EntityLevel): EntityType {
  const entry = Object.entries(ENTITY_LEVEL_MAP).find(([, info]) => info.level === level);
  if (!entry) {
    throw new Error(`Invalid entity level: ${level}`);
  }
  return entry[0] as EntityType;
}

/**
 * Get parent type for an entity type
 */
export function getParentType(type: EntityType): EntityType | null {
  return ENTITY_LEVEL_MAP[type].parentType || null;
}

/**
 * Get child type for an entity type
 */
export function getChildType(type: EntityType): EntityType | null {
  return ENTITY_LEVEL_MAP[type].childType || null;
}

/**
 * Validate parent-child relationship
 */
export function isValidParentChild(parentType: EntityType, childType: EntityType): boolean {
  const expectedParent = getParentType(childType);
  return expectedParent === parentType;
}

/**
 * Get hierarchy path for organizational entities
 */
export function getHierarchyPath(entity: HierarchicalEntity): string[] {
  const path: string[] = [];
  
  if (isChurch(entity)) {
    path.push(entity.unionId, entity.conferenceId, entity._id);
  } else if (isConference(entity)) {
    path.push(entity.unionId, entity._id);
  } else if (isUnion(entity)) {
    path.push(entity._id);
  }
  
  return path;
}

/**
 * Check if entity can manage another entity (based on hierarchy)
 */
export function canManageEntity(
  manager: HierarchicalEntity,
  target: HierarchicalEntity
): boolean {
  const managerPath = getHierarchyPath(manager);
  const targetPath = getHierarchyPath(target);
  
  // Manager can manage entities at same level or below in their subtree
  if (manager._id === target._id) return true;
  
  // Check if target is in manager's subtree
  const managerPathStr = managerPath.join('/');
  const targetPathStr = targetPath.join('/');
  
  return targetPathStr.startsWith(managerPathStr + '/') || targetPathStr === managerPathStr;
}

/**
 * Get accessible entities for a user based on their organizational assignments
 */
export function getAccessibleEntities<T extends HierarchicalEntity>(
  entities: T[],
  userEntities: HierarchicalEntity[]
): T[] {
  const accessible: T[] = [];
  
  for (const entity of entities) {
    for (const userEntity of userEntities) {
      if (canManageEntity(userEntity, entity)) {
        accessible.push(entity);
        break;
      }
    }
  }
  
  return accessible;
}

/**
 * Build entity tree structure
 */
export interface EntityTreeNode<T extends HierarchicalEntity = HierarchicalEntity> {
  entity: T;
  children: EntityTreeNode[];
  level: EntityLevel;
}

export function buildEntityTree(entities: HierarchicalEntity[]): EntityTreeNode[] {
  const entityMap = new Map<string, HierarchicalEntity>();
  const tree: EntityTreeNode[] = [];
  
  // Create map for quick lookup
  entities.forEach(entity => {
    entityMap.set(entity._id, entity);
  });
  
  // Build tree structure
  const nodeMap = new Map<string, EntityTreeNode>();
  
  entities.forEach(entity => {
    const node: EntityTreeNode = {
      entity,
      children: [],
      level: getEntityLevel(entity.type)
    };
    nodeMap.set(entity._id, node);
  });
  
  // Link children to parents
  nodeMap.forEach((node) => {
    const entity = node.entity;
    
    if (isChurch(entity)) {
      const conferenceNode = nodeMap.get(entity.conferenceId);
      if (conferenceNode) {
        conferenceNode.children.push(node);
      } else {
        // Orphaned church, add to root
        tree.push(node);
      }
    } else if (isConference(entity)) {
      const unionNode = nodeMap.get(entity.unionId);
      if (unionNode) {
        unionNode.children.push(node);
      } else {
        // Orphaned conference, add to root
        tree.push(node);
      }
    } else if (isUnion(entity)) {
      // Unions are root nodes
      tree.push(node);
    }
  });
  
  // Sort tree by name
  function sortTree(nodes: EntityTreeNode[]): void {
    nodes.sort((a, b) => a.entity.name.localeCompare(b.entity.name));
    nodes.forEach(node => sortTree(node.children));
  }
  
  sortTree(tree);
  return tree;
}

/**
 * Get entity ancestors (parent chain)
 */
export function getEntityAncestors(
  entity: HierarchicalEntity,
  entityMap: Map<string, HierarchicalEntity>
): HierarchicalEntity[] {
  const ancestors: HierarchicalEntity[] = [];
  
  if (isChurch(entity)) {
    const conference = entityMap.get(entity.conferenceId);
    if (conference && isConference(conference)) {
      ancestors.push(conference);
      const union = entityMap.get(conference.unionId);
      if (union && isUnion(union)) {
        ancestors.push(union);
      }
    }
  } else if (isConference(entity)) {
    const union = entityMap.get(entity.unionId);
    if (union && isUnion(union)) {
      ancestors.push(union);
    }
  }
  
  return ancestors.reverse(); // Return in top-down order
}

/**
 * Get entity descendants (all children)
 */
export function getEntityDescendants(
  entity: HierarchicalEntity,
  allEntities: HierarchicalEntity[]
): HierarchicalEntity[] {
  const descendants: HierarchicalEntity[] = [];
  
  if (isUnion(entity)) {
    const conferences = allEntities.filter(e => 
      isConference(e) && e.unionId === entity._id
    );
    descendants.push(...conferences);
    
    conferences.forEach(conference => {
      const churches = allEntities.filter(e => 
        isChurch(e) && e.conferenceId === conference._id
      );
      descendants.push(...churches);
    });
  } else if (isConference(entity)) {
    const churches = allEntities.filter(e => 
      isChurch(e) && e.conferenceId === entity._id
    );
    descendants.push(...churches);
  }
  
  return descendants;
}

/**
 * Check if user can create entity of specified type
 */
export function canCreateEntityType(
  userEntityType: EntityType,
  targetEntityType: EntityType
): boolean {
  const userLevel = getEntityLevel(userEntityType);
  const targetLevel = getEntityLevel(targetEntityType);
  
  // Can create entities at same level or below
  return userLevel <= targetLevel;
}

/**
 * Get breadcrumb path for entity
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
  type: EntityType;
  level: EntityLevel;
}

export function getEntityBreadcrumbs(
  entity: HierarchicalEntity,
  entityMap: Map<string, HierarchicalEntity>
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  const ancestors = getEntityAncestors(entity, entityMap);
  
  // Add ancestors
  ancestors.forEach(ancestor => {
    breadcrumbs.push({
      id: ancestor._id,
      name: ancestor.name,
      type: ancestor.type,
      level: getEntityLevel(ancestor.type)
    });
  });
  
  // Add current entity
  breadcrumbs.push({
    id: entity._id,
    name: entity.name,
    type: entity.type,
    level: getEntityLevel(entity.type)
  });
  
  return breadcrumbs;
}

/**
 * Filter entities by access level
 */
export function filterEntitiesByAccess<T extends HierarchicalEntity>(
  entities: T[],
  userEntity: HierarchicalEntity,
  includeDescendants: boolean = true
): T[] {
  return entities.filter(entity => {
    // Same entity
    if (entity._id === userEntity._id) return true;
    
    // Check if entity is a descendant of user's entity
    if (includeDescendants) {
      const userPath = getHierarchyPath(userEntity);
      const entityPath = getHierarchyPath(entity);
      const userPathStr = userPath.join('/');
      const entityPathStr = entityPath.join('/');
      
      return entityPathStr.startsWith(userPathStr + '/');
    }
    
    return false;
  });
}

/**
 * Get entity display name with hierarchy context
 */
export function getEntityDisplayName(
  entity: HierarchicalEntity,
  entityMap: Map<string, HierarchicalEntity>,
  includeAncestors: boolean = false
): string {
  if (!includeAncestors) return entity.name;
  
  const ancestors = getEntityAncestors(entity, entityMap);
  const ancestorNames = ancestors.map(a => a.name);
  
  return [...ancestorNames, entity.name].join(' > ');
}

/**
 * Validate entity creation data
 */
export interface EntityValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEntityCreation(
  type: EntityType,
  data: { name: string; unionId?: string; conferenceId?: string },
  entityMap: Map<string, HierarchicalEntity>
): EntityValidationResult {
  const result: EntityValidationResult = {
    isValid: true,
    errors: []
  };
  
  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    result.errors.push('Name is required');
  }
  
  // Validate parent requirements
  if (type === 'conference') {
    if (!data.unionId) {
      result.errors.push('Union ID is required for conferences');
    } else {
      const union = entityMap.get(data.unionId);
      if (!union || !isUnion(union)) {
        result.errors.push('Invalid union ID');
      }
    }
  }
  
  if (type === 'church') {
    if (!data.conferenceId) {
      result.errors.push('Conference ID is required for churches');
    } else {
      const conference = entityMap.get(data.conferenceId);
      if (!conference || !isConference(conference)) {
        result.errors.push('Invalid conference ID');
      } else if (data.unionId && conference.unionId !== data.unionId) {
        result.errors.push('Union ID must match conference union');
      }
    }
  }
  
  result.isValid = result.errors.length === 0;
  return result;
}

/**
 * Search entities by name with hierarchy context
 */
export function searchEntities<T extends HierarchicalEntity>(
  entities: T[],
  query: string,
  entityMap?: Map<string, HierarchicalEntity>
): T[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return entities;
  
  return entities.filter(entity => {
    // Search by entity name
    if (entity.name.toLowerCase().includes(normalizedQuery)) return true;
    
    // Search by ancestor names if map provided
    if (entityMap) {
      const ancestors = getEntityAncestors(entity, entityMap);
      return ancestors.some(ancestor => 
        ancestor.name.toLowerCase().includes(normalizedQuery)
      );
    }
    
    return false;
  });
}
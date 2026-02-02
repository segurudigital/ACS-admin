// Hierarchical Service - Unified service for managing unions, conferences, and churches

import { UnionService } from './unionService';
import { ConferenceService } from './conferenceService';
import { ChurchService } from './churchService';
import { AuthService } from './auth';
import { Union } from '../types/hierarchy';
import { Conference, Church } from '../types/rbac';
import { EntityType, HierarchyTreeNode, HierarchyPermissionContext } from '../types/hierarchy';

// Combined hierarchical entity type
type HierarchicalEntity = Union | Conference | Church;

import { 
  buildEntityTree, 
  getEntityAncestors, 
  getEntityDescendants,
  filterEntitiesByAccess,
  getEntityBreadcrumbs,
  EntityTreeNode
} from './hierarchicalUtils';


export class HierarchicalService {
  
  /**
   * Get all entities for a user (unions, conferences, churches)
   */
  static async getAllUserEntities(): Promise<{
    unions: Union[];
    conferences: Conference[];
    churches: Church[];
  }> {
    try {
      const [unionsRes, conferencesRes, churchesRes] = await Promise.all([
        UnionService.getAllUnions(),
        ConferenceService.getAllConferences(),
        ChurchService.getAllChurches()
      ]);

      return {
        unions: unionsRes.data || [],
        conferences: conferencesRes.data || [],
        churches: churchesRes.data || []
      };
    } catch (error) {
      console.error('Error fetching user entities:', error);
      throw new Error('Failed to fetch hierarchical entities');
    }
  }

  /**
   * Convert EntityTreeNode to HierarchyTreeNode
   */
  private static convertToHierarchyTreeNode(entityNode: EntityTreeNode): HierarchyTreeNode {
    const entityType = entityNode.entity.type as EntityType;
    return {
      entity: entityNode.entity,
      children: entityNode.children.map((child: EntityTreeNode) => this.convertToHierarchyTreeNode(child)),
      level: entityType
    };
  }

  /**
   * Build complete hierarchical tree
   */
  static async getHierarchicalTree(): Promise<HierarchyTreeNode[]> {
    try {
      const entities = await this.getAllUserEntities();
      const allEntities: HierarchicalEntity[] = [
        ...entities.unions,
        ...entities.conferences,
        ...entities.churches
      ];

      const entityTree = buildEntityTree(allEntities);
      return entityTree.map(node => this.convertToHierarchyTreeNode(node));
    } catch (error) {
      console.error('Error building hierarchical tree:', error);
      throw error;
    }
  }

  /**
   * Get entity by ID and type
   */
  static async getEntityById(id: string, type: EntityType): Promise<HierarchicalEntity> {
    try {
      switch (type) {
        case 'union':
          const unionRes = await UnionService.getUnionById(id);
          return unionRes.data;
        case 'conference':
          const conferenceRes = await ConferenceService.getConferenceById(id);
          return conferenceRes.data;
        case 'church':
          const churchRes = await ChurchService.getChurchById(id);
          return churchRes.data;
        default:
          throw new Error(`Invalid entity type: ${type}`);
      }
    } catch (error) {
      console.error(`Error fetching ${type} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get entity hierarchy (ancestors and descendants)
   */
  static async getEntityHierarchy(id: string, type: EntityType): Promise<{
    entity: HierarchicalEntity;
    ancestors: HierarchicalEntity[];
    descendants: HierarchicalEntity[];
    breadcrumbs: Array<{ id: string; name: string; type: EntityType }>;
  }> {
    try {
      const [entity, allEntities] = await Promise.all([
        this.getEntityById(id, type),
        this.getAllUserEntities()
      ]);

      const allEntitiesArray: HierarchicalEntity[] = [
        ...allEntities.unions,
        ...allEntities.conferences,
        ...allEntities.churches
      ];

      const entityMap = new Map(allEntitiesArray.map(e => [e._id, e]));
      const ancestors = getEntityAncestors(entity, entityMap);
      const descendants = getEntityDescendants(entity, allEntitiesArray);
      const breadcrumbs = getEntityBreadcrumbs(entity, entityMap);

      return {
        entity,
        ancestors,
        descendants,
        breadcrumbs
      };
    } catch (error) {
      console.error('Error fetching entity hierarchy:', error);
      throw error;
    }
  }

  /**
   * Search across all entity types
   */
  static async searchEntities(query: string, entityType?: EntityType): Promise<{
    unions: Union[];
    conferences: Conference[];
    churches: Church[];
  }> {
    try {
      const searchPromises = [];

      if (!entityType || entityType === 'union') {
        searchPromises.push(UnionService.getAllUnions({ search: query }));
      }
      if (!entityType || entityType === 'conference') {
        searchPromises.push(ConferenceService.getAllConferences({ search: query }));
      }
      if (!entityType || entityType === 'church') {
        searchPromises.push(ChurchService.getAllChurches({ search: query }));
      }

      const results = await Promise.all(searchPromises);

      let unionIdx = 0;
      let confIdx = 0;
      let churchIdx = 0;

      if (!entityType || entityType === 'union') unionIdx = 0;
      if (!entityType || entityType === 'conference') confIdx = entityType === 'conference' ? 0 : 1;
      if (!entityType || entityType === 'church') {
        if (entityType === 'church') churchIdx = 0;
        else if (entityType) churchIdx = 1;
        else churchIdx = 2;
      }

      const unions: Union[] = (!entityType || entityType === 'union') ? (results[unionIdx]?.data || []) as Union[] : [];
      const conferences: Conference[] = (!entityType || entityType === 'conference') ? (results[confIdx]?.data || []) as Conference[] : [];
      const churches: Church[] = (!entityType || entityType === 'church') ? (results[churchIdx]?.data || []) as Church[] : [];

      return {
        unions,
        conferences,
        churches
      };
    } catch (error) {
      console.error('Error searching entities:', error);
      throw error;
    }
  }

  /**
   * Get entities accessible to a user based on their hierarchical assignments
   */
  static async getAccessibleEntities(userEntityId: string, userEntityType: EntityType): Promise<{
    unions: Union[];
    conferences: Conference[];
    churches: Church[];
  }> {
    try {
      const [userEntity, allEntities] = await Promise.all([
        this.getEntityById(userEntityId, userEntityType),
        this.getAllUserEntities()
      ]);

      return {
        unions: filterEntitiesByAccess(allEntities.unions, userEntity),
        conferences: filterEntitiesByAccess(allEntities.conferences, userEntity),
        churches: filterEntitiesByAccess(allEntities.churches, userEntity)
      };
    } catch (error) {
      console.error('Error fetching accessible entities:', error);
      throw error;
    }
  }

  /**
   * Get user permission context for hierarchical system
   */
  static async getUserPermissionContext(): Promise<HierarchyPermissionContext> {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const userInfo = await AuthService.verifyAuthHierarchical(token);
      if (!userInfo.success) {
        throw new Error('User authentication verification failed');
      }

      // Get all entities user has access to
      const allEntities = await this.getAllUserEntities();

      // TODO: Implement actual permission checking based on user roles
      // For now, return basic structure
      return {
        accessibleUnions: allEntities.unions,
        accessibleConferences: allEntities.conferences,
        accessibleChurches: allEntities.churches,
        userPermissions: [], // TODO: Get from user permissions
        canCreateUnion: false, // TODO: Check permissions
        canCreateConference: false, // TODO: Check permissions
        canCreateChurch: false, // TODO: Check permissions
      };
    } catch (error) {
      console.error('Error getting user permission context:', error);
      throw error;
    }
  }

  /**
   * Bulk operations across entity types
   */
  static async bulkDeleteEntities(entities: Array<{id: string; type: EntityType}>): Promise<{
    successful: Array<{id: string; type: EntityType}>;
    failed: Array<{id: string; type: EntityType; error: string}>;
  }> {
    const successful: Array<{id: string; type: EntityType}> = [];
    const failed: Array<{id: string; type: EntityType; error: string}> = [];

    for (const entity of entities) {
      try {
        switch (entity.type) {
          case 'union':
            await UnionService.deleteUnion(entity.id);
            break;
          case 'conference':
            await ConferenceService.deleteConference(entity.id);
            break;
          case 'church':
            await ChurchService.deleteChurch(entity.id);
            break;
        }
        successful.push(entity);
      } catch (error) {
        failed.push({
          ...entity,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get entity statistics
   */
  static async getHierarchyStatistics(): Promise<{
    totalUnions: number;
    totalConferences: number;
    totalChurches: number;
    activeUnions: number;
    activeConferences: number;
    activeChurches: number;
  }> {
    try {
      const [allEntities, activeEntities] = await Promise.all([
        this.getAllUserEntities(),
        Promise.all([
          UnionService.getAllUnions({ isActive: true }),
          ConferenceService.getAllConferences({ isActive: true }),
          ChurchService.getAllChurches({ isActive: true })
        ])
      ]);

      return {
        totalUnions: allEntities.unions.length,
        totalConferences: allEntities.conferences.length,
        totalChurches: allEntities.churches.length,
        activeUnions: activeEntities[0].data?.length || 0,
        activeConferences: activeEntities[1].data?.length || 0,
        activeChurches: activeEntities[2].data?.length || 0
      };
    } catch (error) {
      console.error('Error getting hierarchy statistics:', error);
      throw error;
    }
  }


  /**
   * Legacy compatibility method - converts new hierarchical data to old entity format
   * @deprecated Use specific entity services instead
   */
  static async getLegacyEntities(): Promise<Array<{
    _id: string;
    name: string;
    type: 'union' | 'conference' | 'church';
    parentEntity?: { _id: string; name: string; type: string };
    metadata?: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>> {
    try {
      const entities = await this.getAllUserEntities();
      const legacyEntities: Array<{
        _id: string;
        name: string;
        type: 'union' | 'conference' | 'church';
        parentEntity?: { _id: string; name: string; type: string };
        metadata?: Record<string, unknown>;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }> = [];

      // Convert unions
      entities.unions.forEach(union => {
        legacyEntities.push({
          _id: union._id,
          name: union.name,
          type: 'union' as const,
          metadata: union.metadata,
          isActive: union.isActive,
          createdAt: union.createdAt,
          updatedAt: union.updatedAt
        });
      });

      // Convert conferences
      entities.conferences.forEach(conference => {
        const parentUnion = entities.unions.find(u => u._id === conference.unionId);
        legacyEntities.push({
          _id: conference._id,
          name: conference.name,
          type: 'conference' as const,
          parentEntity: parentUnion ? {
            _id: parentUnion._id,
            name: parentUnion.name,
            type: 'union'
          } : undefined,
          metadata: conference.metadata,
          isActive: conference.isActive,
          createdAt: conference.createdAt,
          updatedAt: conference.updatedAt
        });
      });

      // Convert churches
      entities.churches.forEach(church => {
        const parentConference = entities.conferences.find(c => c._id === church.conferenceId);
        legacyEntities.push({
          _id: church._id,
          name: church.name,
          type: 'church' as const,
          parentEntity: parentConference ? {
            _id: parentConference._id,
            name: parentConference.name,
            type: 'conference'
          } : undefined,
          metadata: church.metadata,
          isActive: church.isActive,
          createdAt: church.createdAt,
          updatedAt: church.updatedAt
        });
      });

      return legacyEntities;
    } catch (error) {
      console.error('Error converting to legacy format:', error);
      throw error;
    }
  }
}
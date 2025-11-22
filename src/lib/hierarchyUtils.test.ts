import { describe, it, expect } from 'vitest';
import {
  HierarchyLevel,
  parseHierarchyPath,
  getHierarchyDepth,
  isValidParent,
  buildHierarchyPath,
  extractEntityLevel,
  isInSubtree,
  getAncestorPaths,
  isValidPathFormat,
  getParentPath,
  getEntityIdFromPath,
  canCreateAtLevel,
  hasCircularDependency,
  formatHierarchyPath,
  validateOrganizationHierarchy,
  filterByHierarchyAccess,
  sortByHierarchy,
  groupByParent
} from './hierarchyUtils';

describe('hierarchyUtils', () => {
  describe('parseHierarchyPath', () => {
    it('should parse valid hierarchy paths', () => {
      const segments = parseHierarchyPath('union123/conf456/church789');
      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ id: 'union123', level: 1, type: 'conference' });
      expect(segments[1]).toEqual({ id: 'conf456', level: 2, type: 'church' });
      expect(segments[2]).toEqual({ id: 'church789', level: 3, type: 'team' });
    });

    it('should handle team and service prefixed segments', () => {
      const segments = parseHierarchyPath('union1/conf2/church3/team_abc/service_xyz');
      expect(segments[3].type).toBe('team');
      expect(segments[4].type).toBe('service');
    });

    it('should return empty array for empty path', () => {
      expect(parseHierarchyPath('')).toEqual([]);
      expect(parseHierarchyPath(null as any)).toEqual([]);
    });
  });

  describe('getHierarchyDepth', () => {
    it('should calculate correct depth', () => {
      expect(getHierarchyDepth('')).toBe(0);
      expect(getHierarchyDepth('union123')).toBe(1);
      expect(getHierarchyDepth('union123/conf456')).toBe(2);
      expect(getHierarchyDepth('union123/conf456/church789')).toBe(3);
    });
  });

  describe('isValidParent', () => {
    it('should validate correct parent-child relationships', () => {
      expect(isValidParent(1, 0)).toBe(true); // Union under Super Admin
      expect(isValidParent(2, 1)).toBe(true); // Church under Conference
      expect(isValidParent(3, 2)).toBe(true); // Team under Church
      expect(isValidParent(4, 3)).toBe(true); // Service under Team
    });

    it('should reject invalid relationships', () => {
      expect(isValidParent(2, 0)).toBe(false); // Church under Super Admin
      expect(isValidParent(3, 1)).toBe(false); // Team under Conference
      expect(isValidParent(1, 1)).toBe(false); // Same level
      expect(isValidParent(0, 1)).toBe(false); // Parent below child
    });
  });

  describe('buildHierarchyPath', () => {
    it('should build correct hierarchy paths', () => {
      expect(buildHierarchyPath('', 'union123')).toBe('union123');
      expect(buildHierarchyPath('union123', 'conf456')).toBe('union123/conf456');
      expect(buildHierarchyPath('union123/conf456', 'church789')).toBe('union123/conf456/church789');
    });

    it('should throw error for missing entity ID', () => {
      expect(() => buildHierarchyPath('parent', '')).toThrow();
      expect(() => buildHierarchyPath('parent', null as any)).toThrow();
    });
  });

  describe('extractEntityLevel', () => {
    it('should extract correct entity levels from paths', () => {
      expect(extractEntityLevel('')).toBe(HierarchyLevel.SUPER_ADMIN);
      expect(extractEntityLevel('union123')).toBe(HierarchyLevel.UNION);
      expect(extractEntityLevel('union123/conf456')).toBe(HierarchyLevel.CHURCH);
      expect(extractEntityLevel('union123/conf456/church789')).toBe(HierarchyLevel.TEAM);
      expect(extractEntityLevel('union123/conf456/church789/team123')).toBe(HierarchyLevel.SERVICE);
    });
  });

  describe('isInSubtree', () => {
    it('should correctly identify subtree relationships', () => {
      expect(isInSubtree('union1/conf2/church3', 'union1')).toBe(true);
      expect(isInSubtree('union1/conf2/church3', 'union1/conf2')).toBe(true);
      expect(isInSubtree('union1/conf2/church3', 'union2')).toBe(false);
      expect(isInSubtree('union1/conf2', 'union1/conf2/church3')).toBe(false);
    });
  });

  describe('getAncestorPaths', () => {
    it('should return all ancestor paths', () => {
      const ancestors = getAncestorPaths('union1/conf2/church3/team4');
      expect(ancestors).toEqual([
        'union1',
        'union1/conf2',
        'union1/conf2/church3',
        'union1/conf2/church3/team4'
      ]);
    });

    it('should handle edge cases', () => {
      expect(getAncestorPaths('')).toEqual([]);
      expect(getAncestorPaths('single')).toEqual(['single']);
    });
  });

  describe('isValidPathFormat', () => {
    it('should validate path formats', () => {
      expect(isValidPathFormat('')).toBe(true);
      expect(isValidPathFormat('union123')).toBe(true);
      expect(isValidPathFormat('union_123/conf_456')).toBe(true);
      expect(isValidPathFormat('union 123')).toBe(false);
      expect(isValidPathFormat('/union123')).toBe(false);
      expect(isValidPathFormat('union123/')).toBe(false);
      expect(isValidPathFormat(null as any)).toBe(false);
    });
  });

  describe('getParentPath', () => {
    it('should extract parent paths', () => {
      expect(getParentPath('union1/conf2/church3')).toBe('union1/conf2');
      expect(getParentPath('union1/conf2')).toBe('union1');
      expect(getParentPath('union1')).toBeNull();
      expect(getParentPath('')).toBeNull();
    });
  });

  describe('getEntityIdFromPath', () => {
    it('should extract entity IDs from paths', () => {
      expect(getEntityIdFromPath('union1/conf2/church3')).toBe('church3');
      expect(getEntityIdFromPath('union1')).toBe('union1');
      expect(getEntityIdFromPath('')).toBeNull();
      expect(getEntityIdFromPath(null as any)).toBeNull();
    });
  });

  describe('canCreateAtLevel', () => {
    it('should validate creation permissions', () => {
      const result1 = canCreateAtLevel(1, 'organization', 'union1');
      expect(result1.isValid).toBe(true);

      const result2 = canCreateAtLevel(2, 'team', 'union1/conf2');
      expect(result2.isValid).toBe(true);

      const result3 = canCreateAtLevel(3, 'organization');
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Insufficient privileges to create organization');
    });

    it('should validate entity types', () => {
      const result = canCreateAtLevel(1, 'invalid_type');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown entity type: invalid_type');
    });
  });

  describe('hasCircularDependency', () => {
    it('should detect circular dependencies', () => {
      expect(hasCircularDependency('conf456', 'union1/conf456')).toBe(true);
      expect(hasCircularDependency('church789', 'union1/conf2/church789/team1')).toBe(true);
    });

    it('should detect deep circular dependencies', () => {
      const currentPath = 'union1/conf456';
      const newParentPath = 'union1/conf456/church789';
      expect(hasCircularDependency('conf456', newParentPath, currentPath)).toBe(true);
    });

    it('should not flag valid hierarchies', () => {
      expect(hasCircularDependency('church789', 'union1/conf456')).toBe(false);
      expect(hasCircularDependency('team123', 'union1/conf456/church789')).toBe(false);
    });
  });

  describe('formatHierarchyPath', () => {
    it('should format hierarchy paths for display', () => {
      expect(formatHierarchyPath('union1/conf2/church3')).toBe('conference:union1 > church:conf2 > team:church3');
      expect(formatHierarchyPath('union1/conf2/church3/team_abc')).toBe('conference:union1 > church:conf2 > team:church3 > team:team_abc');
      expect(formatHierarchyPath('')).toBe('');
    });
  });

  describe('validateOrganizationHierarchy', () => {
    it('should validate organization hierarchies', () => {
      const result1 = validateOrganizationHierarchy('union');
      expect(result1.isValid).toBe(true);

      const result2 = validateOrganizationHierarchy('conference', 'union');
      expect(result2.isValid).toBe(true);

      const result3 = validateOrganizationHierarchy('church', 'conference');
      expect(result3.isValid).toBe(true);
    });

    it('should reject invalid hierarchies', () => {
      const result1 = validateOrganizationHierarchy('invalid');
      expect(result1.isValid).toBe(false);

      const result2 = validateOrganizationHierarchy('church', 'church');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Churches cannot have child organizations');

      const result3 = validateOrganizationHierarchy('church', 'union');
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Invalid parent-child hierarchy relationship');
    });
  });

  describe('filterByHierarchyAccess', () => {
    it('should filter entities by hierarchy access', () => {
      const entities = [
        { _id: '1', hierarchyPath: 'union1/conf2/church3' },
        { _id: '2', hierarchyPath: 'union1/conf2/church4' },
        { _id: '3', hierarchyPath: 'union2/conf5/church6' },
      ];

      const filtered1 = filterByHierarchyAccess(entities, 'union1', 1);
      expect(filtered1).toHaveLength(2);

      const filtered2 = filterByHierarchyAccess(entities, 'union1/conf2', 2);
      expect(filtered2).toHaveLength(2);

      const filtered3 = filterByHierarchyAccess(entities, 'union2', 1);
      expect(filtered3).toHaveLength(1);

      // Super admin can see everything
      const filtered4 = filterByHierarchyAccess(entities, '', HierarchyLevel.SUPER_ADMIN);
      expect(filtered4).toHaveLength(3);
    });
  });

  describe('sortByHierarchy', () => {
    it('should sort entities by hierarchy path', () => {
      const entities = [
        { _id: '3', hierarchyPath: 'union2/conf5' },
        { _id: '1', hierarchyPath: 'union1/conf2' },
        { _id: '2', hierarchyPath: 'union1/conf3' },
      ];

      const sorted = sortByHierarchy(entities);
      expect(sorted[0]._id).toBe('1');
      expect(sorted[1]._id).toBe('2');
      expect(sorted[2]._id).toBe('3');
    });
  });

  describe('groupByParent', () => {
    it('should group entities by parent path', () => {
      const entities = [
        { _id: '1', hierarchyPath: 'union1' },
        { _id: '2', hierarchyPath: 'union1/conf2' },
        { _id: '3', hierarchyPath: 'union1/conf3' },
        { _id: '4', hierarchyPath: 'union1/conf2/church4' },
      ];

      const grouped = groupByParent(entities);
      expect(grouped['root']).toHaveLength(1);
      expect(grouped['union1']).toHaveLength(2);
      expect(grouped['union1/conf2']).toHaveLength(1);
    });
  });
});
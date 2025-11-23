'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Column, ActionCell, IconButton, StatusBadge } from '@/components/DataTable';
import Button from '@/components/Button';
import { Users, UserPlus, Settings, Trash } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { teamService, Team } from '@/lib/teams';
import { teamTypeService, TeamType } from '@/lib/teamTypes';
import { usePermissions } from '@/contexts/HierarchicalPermissionContext';
import { CreateTeamModal } from '@/components/teams/CreateTeamModal';
import { TeamMembersModal } from '@/components/teams/TeamMembersModal';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamTypes, setTeamTypes] = useState<TeamType[]>([]);
  const router = useRouter();
  const { currentUnion, currentConference, currentChurch } = usePermissions();
  const { isSuperAdmin } = useSuperAdmin();

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      if (isSuperAdmin) {
        // Super admin views all teams from MongoDB collection across all hierarchies
        response = await teamService.getAllTeams();
      } else {
        // Regular user - view teams for their current entity (church, conference, or union)
        const currentEntityId = currentChurch || currentConference || currentUnion;
        if (!currentEntityId) {
          setLoading(false);
          return;
        }
        response = await teamService.getOrganizationTeams(currentEntityId);
      }
      
      const teamsData = response.data || [];
      setTeams(teamsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load teams';
      setTeams([]);
      toast({
        title: 'Error Loading Teams',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentChurch, currentConference, currentUnion, isSuperAdmin]);

  const loadTeamTypes = useCallback(async () => {
    const currentEntityId = currentChurch || currentConference || currentUnion;
    if (!currentEntityId) return;

    try {
      const response = await teamTypeService.getOrganizationTeamTypes(currentEntityId);
      setTeamTypes(response.data);
    } catch {
      // Don't show toast for team types error as it's not critical
    }
  }, [currentChurch, currentConference, currentUnion]);


  useEffect(() => {
    if (isSuperAdmin) {
      loadTeams();
    } else {
      const currentEntityId = currentChurch || currentConference || currentUnion;
      if (currentEntityId) {
        loadTeams();
        loadTeamTypes();
      }
    }
  }, [currentChurch, currentConference, currentUnion, loadTeams, loadTeamTypes, isSuperAdmin]);

  const handleCreateTeam = async (teamData: {
    name: string;
    type: string;
    description?: string;
    maxMembers: number;
  }) => {
    const currentEntityId = currentChurch || currentConference || currentUnion;
    if (!currentEntityId) {
      toast({
        title: 'Error',
        description: 'No current entity selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      await teamService.createTeam({
        ...teamData,
        type: teamData.type as "communications" | "acs" | "general",
        organizationId: currentEntityId
      });
      toast({
        title: 'Success',
        description: 'Team created successfully',
      });
      loadTeams();
      setCreateModalOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create team';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await teamService.deleteTeam(teamId);
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });
      loadTeams();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };


  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTeamTypeData = (typeName: string) => {
    const teamType = teamTypes.find(t => t.name === typeName);
    if (!teamType) {
      return {
        icon: '👥',
        colorClass: 'bg-gray-100 text-gray-800',
        description: 'Unknown type'
      };
    }
    
    return {
      icon: '👥', // Default icon since TeamType doesn't have icon property
      colorClass: 'bg-gray-100 text-gray-800', // Default color since TeamType doesn't have color property
      description: teamType.description || ''
    };
  };

  const columns: Column<Team>[] = [
    {
      key: 'name',
      header: 'Team',
      accessor: (team) => {
        const typeData = getTeamTypeData(team.type);
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                {typeData.icon}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{team.name}</div>
              <div className="text-sm text-gray-500">
                {team.description || typeData.description || 'No description'}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (team) => {
        const typeData = getTeamTypeData(team.type);
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeData.colorClass}`}>
            {team.type}
          </span>
        );
      }
    },
    // Add Organization column for super admin viewing all teams
    ...(isSuperAdmin ? [{
      key: 'organization' as keyof Team,
      header: 'Organization',
      accessor: (team: Team) => (
        <span className="text-sm text-gray-900">
          {team.organization?.name || 'Unknown'}
        </span>
      )
    }] : []),
    {
      key: 'members',
      header: 'Members',
      accessor: (team) => (
        <div className="text-sm text-gray-900">
          <span className="font-medium">{team.memberCount || 0}</span>
          <span className="text-gray-500"> / {team.maxMembers || 'Unlimited'}</span>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'Capacity',
      accessor: (team) => {
        if (!team.maxMembers) return <span className="text-sm text-gray-500">-</span>;
        const capacity = ((team.memberCount || 0) / team.maxMembers) * 100;
        const colors = capacity >= 90 ? { bg: 'bg-red-100', text: 'text-red-800' } 
                     : capacity >= 75 ? { bg: 'bg-yellow-100', text: 'text-yellow-800' }
                     : { bg: 'bg-green-100', text: 'text-green-800' };
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors.bg} ${colors.text}`}>
            {capacity.toFixed(0)}%
          </span>
        );
      }
    },
    // Add Created By column for super admin
    ...(isSuperAdmin ? [{
      key: 'createdBy' as keyof Team,
      header: 'Created By',
      accessor: (team: Team) => (
        <span className="text-sm text-gray-900">
          {team.createdBy?.name || team.createdBy?.email || 'System Admin'}
        </span>
      )
    }] : []),
    {
      key: 'status',
      header: 'Status',
      accessor: (team) => (
        <StatusBadge
          status={team.isActive}
          trueLabel="Active"
          falseLabel="Inactive"
          trueColor="green"
          falseColor="red"
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
      className: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
      accessor: (team) => (
        <ActionCell>
          <PermissionGate permission="teams.read">
            <IconButton
              onClick={() => router.push(`/teams/${team._id}`)}
              title="View Team Details"
              icon={<Users className="h-5 w-5" />}
            />
          </PermissionGate>
          <PermissionGate permission="teams.update">
            <IconButton
              onClick={() => router.push(`/teams/${team._id}`)}
              title="Edit Team"
              icon={<Settings className="h-5 w-5" />}
            />
          </PermissionGate>
          <PermissionGate permission="teams.delete">
            <IconButton
              onClick={() => handleDeleteTeam(team._id)}
              title="Delete Team"
              icon={<Trash className="h-5 w-5" />}
              variant="danger"
            />
          </PermissionGate>
        </ActionCell>
      )
    }
  ];


  const currentEntityId = currentChurch || currentConference || currentUnion;
  if (!currentEntityId && !isSuperAdmin) {
    return (
      <AdminLayout title="Teams" description="Manage teams for your entity">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-6 py-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">No Entity Selected</h3>
            <p className="mt-1 text-sm text-gray-500">Please select a church, conference, or union to view teams.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getCurrentEntityName = () => {
    if (currentChurch) return 'your church';
    if (currentConference) return 'your conference';
    if (currentUnion) return 'your union';
    return 'your entity';
  };

  const description = isSuperAdmin 
    ? "Manage teams across all hierarchies"
    : `Manage teams for ${getCurrentEntityName()}`;

  return (
    <AdminLayout 
      title="Teams" 
      description={description}
    >
        <div className="space-y-6">
          {/* Table with custom header */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Custom header with search and button */}
            <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="max-w-xs">
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full px-4 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                  />
                </div>
              </div>
              <PermissionGate permission="teams.create">
                <Button onClick={() => setCreateModalOpen(true)} className="whitespace-nowrap" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </PermissionGate>
            </div>
          </div>
          
          {/* Table content */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-5 text-center">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <Users className="h-12 w-12" />
                </div>
                <p className="text-sm text-gray-500">No teams found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className={
                          column.headerClassName ||
                          'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                        }
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTeams.map((team) => (
                    <tr key={team._id} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={column.className || 'px-6 py-4 whitespace-nowrap text-sm'}
                        >
                          {column.accessor(team)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <CreateTeamModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSubmit={handleCreateTeam}
        />

        {selectedTeam && (
          <TeamMembersModal
            open={membersModalOpen}
            onOpenChange={setMembersModalOpen}
            team={selectedTeam}
            onUpdate={loadTeams}
          />
        )}
      </div>
    </AdminLayout>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Save, 
  Users, 
  Settings, 
  BarChart, 
  Shield, 
  MessageSquare, 
  UserPlus, 
  UserX, 
  User,
  Trash,
  Edit3
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { teamService, Team, TeamStatistics, TeamMember } from '@/lib/teams';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/contexts/PermissionContext';
import { AddTeamMemberModal } from '@/components/teams/AddTeamMemberModal';

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [team, setTeam] = useState<Team | null>(null);
  const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    settings: {
      allowSelfJoin: false,
      requireApproval: true,
      visibility: 'organization' as 'organization' | 'private' | 'public',
    },
  });

  const loadTeamData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamResponse, statsResponse, membersResponse] = await Promise.all([
        teamService.getTeamDetails(teamId as string),
        teamService.getTeamStatistics(teamId as string),
        teamService.getTeamMembers(teamId as string),
      ]);
      
      const teamData = teamResponse.data;
      setTeam(teamData);
      setStatistics(statsResponse.data);
      setMembers(membersResponse.data);
      
      // Initialize form with team data
      setFormData({
        name: teamData.name,
        description: teamData.description || '',
        maxMembers: teamData.maxMembers,
        settings: teamData.settings,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load team details';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId, loadTeamData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await teamService.updateTeam(teamId as string, formData);
      toast({
        title: 'Success',
        description: 'Team updated successfully',
      });
      loadTeamData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (userId: string, role: 'leader' | 'member' | 'communications') => {
    try {
      await teamService.addTeamMember(teamId, userId, role);
      toast({
        title: 'Success',
        description: 'Member added successfully',
      });
      setAddMemberOpen(false);
      loadTeamData();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'leader' | 'member' | 'communications') => {
    try {
      await teamService.updateMemberRole(teamId, userId, newRole);
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
      loadTeamData();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;

    try {
      await teamService.removeTeamMember(teamId, userId);
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
      loadTeamData();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;

    try {
      await teamService.deleteTeam(teamId);
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });
      router.push('/teams');
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete team',
        variant: 'destructive',
      });
    }
  };

  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'acs':
        return <Shield className="w-5 h-5" />;
      case 'communications':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader':
        return <Shield className="w-4 h-4" />;
      case 'communications':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'leader':
        return 'default';
      case 'communications':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading || !team || !statistics) {
    return (
      <AdminLayout title="Loading..." description="Loading team details...">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={team.name} 
      description={`Team details and member management for ${team.name}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/teams')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Teams
            </Button>
            <div className="flex items-center gap-2">
              {getTeamTypeIcon(team.type)}
              <Badge variant={team.isActive ? 'default' : 'secondary'}>
                {team.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <PermissionGate permission="teams.delete">
              <Button 
                variant="destructive" 
                onClick={handleDeleteTeam}
                size="sm"
              >
                <Trash className="w-4 h-4 mr-1" />
                Delete Team
              </Button>
            </PermissionGate>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.memberCount}</div>
            <p className="text-sm text-muted-foreground">of {statistics.maxMembers} max</p>
            <Progress value={statistics.capacity} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.serviceCount}</div>
            <p className="text-sm text-muted-foreground">Active services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Leaders</span>
                <span className="font-medium">{statistics.roleDistribution.leader}</span>
              </div>
              <div className="flex justify-between">
                <span>Members</span>
                <span className="font-medium">{statistics.roleDistribution.member}</span>
              </div>
              <div className="flex justify-between">
                <span>Communications</span>
                <span className="font-medium">{statistics.roleDistribution.communications}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Team Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
            <CardDescription>
              Manage team information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!hasPermission('teams.update')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={!hasPermission('teams.update')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxMembers">Maximum Members</Label>
              <Input
                id="maxMembers"
                type="number"
                min="1"
                max="500"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 50 })}
                disabled={!hasPermission('teams.update')}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Team Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Self Join</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to join the team without approval
                  </p>
                </div>
                <Switch
                  checked={formData.settings.allowSelfJoin}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowSelfJoin: checked },
                    })
                  }
                  disabled={!hasPermission('teams.update')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Require team leader approval for new members
                  </p>
                </div>
                <Switch
                  checked={formData.settings.requireApproval}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, requireApproval: checked },
                    })
                  }
                  disabled={!hasPermission('teams.update')}
                />
              </div>
            </div>

            <PermissionGate permission="teams.update">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>

        {/* Team Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {members.length} of {team.maxMembers || 'unlimited'} members
                </CardDescription>
              </div>
              <PermissionGate permission="teams.manage_members">
                <Button
                  onClick={() => setAddMemberOpen(true)}
                  disabled={team.maxMembers > 0 && members.length >= team.maxMembers}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </PermissionGate>
            </div>
          </CardHeader>
          <CardContent>
            {/* Members List */}
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No members in this team yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {members.map((member) => (
                  <div key={member._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <Badge 
                            variant={getRoleBadgeVariant(member.teamRole)}
                            className="mt-2"
                          >
                            {getRoleIcon(member.teamRole)}
                            <span className="ml-1">{member.teamRole}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <PermissionGate permission="teams.manage_members">
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.teamRole}
                            onValueChange={(value) => handleUpdateRole(member._id, value as any)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="leader">Leader</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="communications">Communications</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </PermissionGate>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onSubmit={handleAddMember}
        currentMembers={members.map(m => m._id)}
      />
      </div>
    </AdminLayout>
  );
}
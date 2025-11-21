'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, Users, Settings, BarChart, Shield, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { teamService, Team, TeamStatistics } from '@/lib/teams';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/contexts/PermissionContext';

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [team, setTeam] = useState<Team | null>(null);
  const [statistics, setStatistics] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const [teamResponse, statsResponse] = await Promise.all([
        teamService.getTeamDetails(teamId as string),
        teamService.getTeamStatistics(teamId as string),
      ]);
      
      const teamData = teamResponse.data;
      setTeam(teamData);
      setStatistics(statsResponse.data);
      
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

  if (loading || !team || !statistics) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {getTeamTypeIcon(team.type)}
            <h1 className="text-3xl font-bold">{team.name}</h1>
          </div>
          <Badge variant={team.isActive ? 'default' : 'secondary'}>
            {team.isActive ? 'Active' : 'Inactive'}
          </Badge>
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

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <Settings className="w-4 h-4 mr-1" />
            Details
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-1" />
            Members
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart className="w-4 h-4 mr-1" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View and manage team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push(`/teams?membersModal=${teamId}`)}
              >
                <Users className="w-4 h-4 mr-1" />
                Manage Members
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Team Statistics</CardTitle>
              <CardDescription>
                View detailed team analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Created At</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(statistics.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Team Type</Label>
                    <Badge variant="outline">{team.type.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
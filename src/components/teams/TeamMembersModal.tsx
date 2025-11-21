'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, UserX, Shield, User, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { teamService, Team, TeamMember } from '@/lib/teams';
import { PermissionGate } from '@/components/PermissionGate';
import { AddTeamMemberModal } from './AddTeamMemberModal';

interface TeamMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onUpdate: () => void;
}

export function TeamMembersModal({ open, onOpenChange, team, onUpdate }: TeamMembersModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!team?._id) return;
    
    try {
      setLoading(true);
      const response = await teamService.getTeamMembers(team._id);
      setMembers(response.data);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [team?._id]);

  useEffect(() => {
    if (open && team) {
      loadMembers();
    }
  }, [open, team, loadMembers]);

  const handleUpdateRole = async (userId: string, newRole: 'leader' | 'member' | 'communications') => {
    try {
      await teamService.updateMemberRole(team._id, userId, newRole);
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
      loadMembers();
      onUpdate();
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
      await teamService.removeTeamMember(team._id, userId);
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
      loadMembers();
      onUpdate();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleAddMember = async (userId: string, role: 'leader' | 'member' | 'communications') => {
    try {
      await teamService.addTeamMember(team._id, userId, role);
      toast({
        title: 'Success',
        description: 'Member added successfully',
      });
      setAddMemberOpen(false);
      loadMembers();
      onUpdate();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add member',
        variant: 'destructive',
      });
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Members - {team.name}</DialogTitle>
            <DialogDescription>
              {members.length} of {team.maxMembers} members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  Leaders: {members.filter(m => m.teamRole === 'leader').length}
                </Badge>
                <Badge variant="outline">
                  <User className="w-3 h-3 mr-1" />
                  Members: {members.filter(m => m.teamRole === 'member').length}
                </Badge>
                <Badge variant="outline">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Communications: {members.filter(m => m.teamRole === 'communications').length}
                </Badge>
              </div>
              <PermissionGate permission="teams.manage_members">
                <Button
                  size="sm"
                  onClick={() => setAddMemberOpen(true)}
                  disabled={team.memberCount >= team.maxMembers}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add Member
                </Button>
              </PermissionGate>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members in this team yet
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="p-4 rounded-lg border space-y-3"
                  >
                    {/* Member Info Row */}
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant={getRoleBadgeVariant(member.teamRole)}>
                        {getRoleIcon(member.teamRole)}
                        <span className="ml-1">{member.teamRole}</span>
                      </Badge>
                    </div>
                    
                    {/* Actions Row */}
                    <PermissionGate permission="teams.manage_members">
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Change Role:
                          </label>
                          <Select
                            value={member.teamRole}
                            onValueChange={(value: string) => handleUpdateRole(member._id, value as 'leader' | 'member' | 'communications')}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="leader">Leader</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="communications">Communications</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Actions:
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </PermissionGate>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddTeamMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onSubmit={handleAddMember}
        currentMembers={members.map(m => m._id)}
      />
    </>
  );
}
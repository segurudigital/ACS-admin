'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { rbacService } from '@/lib/rbac';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AddTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userId: string, role: 'leader' | 'member' | 'communications') => Promise<void>;
  currentMembers: string[];
}

export function AddTeamMemberModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  currentMembers 
}: AddTeamMemberModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'leader' | 'member' | 'communications'>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadOrganizationUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await rbacService.getUsers();
      setUsers(response || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadOrganizationUsers();
    }
  }, [open, loadOrganizationUsers]);

  useEffect(() => {
    // Filter users based on search query and exclude current members
    const filtered = users
      .filter(user => !currentMembers.includes(user._id))
      .filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    setFilteredUsers(filtered);
  }, [searchQuery, users, currentMembers]);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(selectedUserId, selectedRole);
      
      // Reset form
      setSelectedUserId('');
      setSelectedRole('member');
      setSearchQuery('');
    } catch (error: unknown) {
      // Error is handled in parent
      console.error('Error in handleSubmit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Select a user to add to the team and assign their role
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Search Users</Label>
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>

          {loading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchQuery ? 'No users found matching your search' : 'No available users to add'}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Select User</Label>
              <RadioGroup value={selectedUserId} onValueChange={setSelectedUserId}>
                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                  {filteredUsers.map((user) => (
                    <label
                      key={user._id}
                      htmlFor={user._id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <RadioGroupItem value={user._id} id={user._id} />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="role">Team Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as 'leader' | 'member' | 'communications')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leader">Team Leader</SelectItem>
                <SelectItem value="member">Team Member</SelectItem>
                <SelectItem value="communications">Communications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || submitting}
          >
            {submitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
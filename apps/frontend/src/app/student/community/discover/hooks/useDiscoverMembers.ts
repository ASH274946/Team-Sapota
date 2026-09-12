import { useState, useEffect, useMemo, useCallback } from 'react';
import { Member, RoleFilter } from '../types';
import { DiscoverService } from '../services/discover.service';
import { toast } from 'react-hot-toast';

export function useDiscoverMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DiscoverService.fetchOrgMembers();
      setMembers(data);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to load organization members';
      setError(errMsg);
      toast.error(errMsg);
      console.error('DiscoverPage error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleToggleFollow = useCallback(async (targetUserId: string) => {
    // Optimistic UI update
    setFollowingMap(prev => ({
      ...prev,
      [targetUserId]: !prev[targetUserId]
    }));

    try {
      const success = await DiscoverService.toggleFollow(targetUserId);
      if (!success) {
        throw new Error('Connection operation failed');
      }
    } catch (err: any) {
      // Revert on error
      setFollowingMap(prev => ({
        ...prev,
        [targetUserId]: !prev[targetUserId]
      }));
      toast.error(err?.message || 'Failed to update connection');
    }
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = 
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (member.researchInterest && member.researchInterest.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = 
        selectedRole === 'ALL' || 
        member.role.toUpperCase() === selectedRole.toUpperCase();

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, selectedRole]);

  return {
    members: filteredMembers,
    allMembers: members,
    loading,
    error,
    followingMap,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    handleToggleFollow,
    refresh: fetchMembers
  };
}

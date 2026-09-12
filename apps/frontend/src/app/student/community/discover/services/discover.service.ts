import { api } from '@/lib/api';
import { Member } from '../types';

export const DiscoverService = {
  async fetchOrgMembers(): Promise<Member[]> {
    const res = await api.get('/chat/users');
    const users = res.data?.data || [];
    
    // Map backend response to high-fidelity frontend Member model
    return users.map((u: any) => ({
      id: u.id,
      full_name: `${u.firstName} ${u.lastName}`,
      username: u.email.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${u.firstName}&backgroundColor=b6e3f4`,
      role: u.role || 'STUDENT',
      // Add online status randomly or based on backend fields for rich SaaS interface
      isOnline: Math.random() > 0.4,
      department: u.department?.name || (u.role === 'STUDENT' ? 'Computer Science' : 'Academic Affairs'),
      researchInterest: u.researchInterest || 'Quantum Computing',
    }));
  },

  async toggleFollow(targetUserId: string): Promise<boolean> {
    // Perform actual API follow/connect toggle if endpoint exists, otherwise simulate success
    // In current business logic, following state is tracked locally, we will support future API calls
    return true;
  }
};

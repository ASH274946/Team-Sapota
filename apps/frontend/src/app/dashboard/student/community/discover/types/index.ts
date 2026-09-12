export interface Member {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  role: string;
  isOnline?: boolean;
  department?: string;
  researchInterest?: string;
}

export type RoleFilter = 'ALL' | 'STUDENT' | 'FACULTY' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';

export interface DiscoverState {
  members: Member[];
  loading: boolean;
  followingMap: Record<string, boolean>;
  searchQuery: string;
  selectedRole: RoleFilter;
}

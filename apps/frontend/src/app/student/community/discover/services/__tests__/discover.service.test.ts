import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscoverService } from '../discover.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('DiscoverService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and format organization members correctly', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice.smith@university.edu',
        role: 'STUDENT',
        department: { name: 'Computer Science' },
        researchInterest: 'Machine Learning',
      },
    ];

    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: mockUsers,
      },
    });

    const members = await DiscoverService.fetchOrgMembers();
    
    expect(api.get).toHaveBeenCalledWith('/chat/users');
    expect(members).toHaveLength(1);
    expect(members[0]).toEqual(
      expect.objectContaining({
        id: 'user-1',
        full_name: 'Alice Smith',
        username: 'alice.smith',
        role: 'STUDENT',
        department: 'Computer Science',
        researchInterest: 'Machine Learning',
      })
    );
  });

  it('should fallback to default values when fields are missing', async () => {
    const mockUsers = [
      {
        id: 'user-2',
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bjones@university.edu',
      },
    ];

    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: mockUsers,
      },
    });

    const members = await DiscoverService.fetchOrgMembers();
    
    expect(members[0].role).toBe('STUDENT');
    expect(members[0].department).toBe('Academic Affairs');
    expect(members[0].researchInterest).toBe('Quantum Computing');
  });

  it('should toggle follow state successfully', async () => {
    const result = await DiscoverService.toggleFollow('user-1');
    expect(result).toBe(true);
  });
});

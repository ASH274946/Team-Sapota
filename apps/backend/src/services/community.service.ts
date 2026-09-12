import prisma from '../config/prisma';


export class CommunityService {
  private static async getValidOrgId(orgId?: string): Promise<string | undefined> {
    if (!orgId || typeof orgId !== 'string' || !orgId.trim()) return undefined;
    try {
      const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
      return org ? org.id : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * List community groups visible to the current user.
   */
  static async getGroups(organizationId: string | undefined, userId: string) {
    const validOrgId = await CommunityService.getValidOrgId(organizationId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userEmail = user?.email || '';

    const groupStudents = await prisma.groupStudent.findMany({
      where: { email: userEmail }
    });
    const academicGroupIds = groupStudents.map(gs => gs.groupId);

    const groups = await prisma.communityGroup.findMany({
      where: {
        OR: [
          // Public and invite-only groups in the organization
          {
            type: { in: ['PUBLIC', 'INVITE_ONLY'] },
            ...(validOrgId ? { organizationId: validOrgId } : {}),
          },
          // Private groups the user is already a member of
          {
            type: 'PRIVATE',
            members: { some: { userId } }
          },
          // Academic groups where the user is a GroupStudent
          {
            id: { in: academicGroupIds }
          }
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        members: {
          select: { userId: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      avatar: group.avatar,
      owner: group.owner,
      organizationId: group.organizationId,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      isMember: group.members.some((member) => member.userId === userId) || academicGroupIds.includes(group.id),
    }));
  }

  /**
   * Create a new community post
   */
  static async createPost(
    authorId: string,
    content: string,
    type: string,
    visibility: string,
    attachments: any[] = [],
    organizationId?: string,
    title?: string,
    tags?: string[]
  ) {
    const validOrgId = await CommunityService.getValidOrgId(organizationId);
    return prisma.communityPost.create({
      data: {
        authorId,
        title,
        content,
        type,
        visibility,
        attachments,
        tags: tags ?? [],
        organizationId: validOrgId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  /**
   * Fetch a feed of posts
   */
  static async getFeed(organizationId?: string, limit: number = 20, cursor?: string) {
    const validOrgId = await CommunityService.getValidOrgId(organizationId);
    const whereClause: any = {};
    if (validOrgId) {
      whereClause.OR = [
        { visibility: 'PUBLIC' },
        { organizationId: validOrgId, visibility: 'ORG_ONLY' },
      ];
    } else {
      whereClause.visibility = 'PUBLIC';
    }

    return prisma.communityPost.findMany({
      where: whereClause,
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  /**
   * Create a community group
   */
  static async createGroup(
    ownerId: string,
    name: string,
    description: string,
    type: string,
    organizationId?: string
  ) {
    const validOrgId = await CommunityService.getValidOrgId(organizationId);
    return prisma.communityGroup.create({
      data: {
        name,
        description,
        type,
        ownerId,
        organizationId: validOrgId,
        members: {
          create: [{ userId: ownerId, role: 'OWNER' }],
        },
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Join a community group
   */
  static async joinGroup(groupId: string, userId: string) {
    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new Error('Group not found');
    if (group.type === 'INVITE_ONLY' || group.type === 'PRIVATE') {
      throw new Error('This group requires an invitation to join.');
    }

    return prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      update: {},
      create: {
        groupId,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Search for users to invite to a group
   */
  static async searchUsers(query: string, excludeGroupId?: string) {
    const whereClause: any = {};
    if (query && query.length >= 2) {
      whereClause.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: {
        ...whereClause,
        ...(excludeGroupId ? {
          NOT: {
            groupMemberships: {
              some: { groupId: excludeGroupId }
            }
          }
        } : {})
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      take: 10
    });
    
    return users;
  }

  /**
   * Invite a user to a group (by owner)
   */
  static async inviteToGroup(groupId: string, ownerId: string, inviteeIdentifier: string) {
    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new Error('Group not found');
    if (group.ownerId !== ownerId) throw new Error('Only the group owner can invite members');

    // Find the user to invite (by email or ID)
    const userToInvite = await prisma.user.findFirst({
      where: {
        OR: [
          { email: inviteeIdentifier },
          { id: inviteeIdentifier }
        ]
      }
    });

    if (!userToInvite) throw new Error('User not found');

    return prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: userToInvite.id,
        },
      },
      update: {},
      create: {
        groupId,
        userId: userToInvite.id,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  static async getGroupMembers(groupId: string, _userId?: string) {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      },
      orderBy: { role: 'asc' } // OWNER first
    });

    const groupStudents = await prisma.groupStudent.findMany({
      where: { groupId }
    });

    if (groupStudents.length > 0) {
      const emails = groupStudents.map(s => s.email).filter(Boolean);
      const matchingUsers = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, firstName: true, lastName: true, avatar: true }
      });

      const existingUserIds = new Set(members.map(m => m.userId));

      for (const u of matchingUsers) {
        if (!existingUserIds.has(u.id)) {
          members.push({
            groupId,
            userId: u.id,
            role: 'MEMBER',
            joinedAt: new Date(),
            user: u
          } as any);
          existingUserIds.add(u.id);
        }
      }
    }

    return members;
  }

  static async kickMember(groupId: string, requesterId: string, memberId: string) {
    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new Error('Group not found');
    if (group.ownerId !== requesterId) throw new Error('Only the group owner can remove members');
    if (memberId === requesterId) throw new Error('Owner cannot remove themselves');

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: memberId } }
    });
    if (!membership) throw new Error('Member not found in group');

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: memberId } }
    });
  }

  // --- New Methods for Posts ---

  static async getPost(postId: string) {
    return prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        }
      }
    });
  }

  static async updatePost(postId: string, userId: string, data: { title?: string, content?: string, status?: string }) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== userId) throw new Error('Unauthorized');
    return prisma.communityPost.update({
      where: { id: postId },
      data
    });
  }

  static async deletePost(postId: string, userId: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (post.authorId !== userId) throw new Error('Unauthorized');
    return prisma.communityPost.delete({ where: { id: postId } });
  }

  // --- Comments ---

  static async getComments(postId: string) {
    return prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      }
    });
  }

  static async addComment(postId: string, authorId: string, content: string) {
    const comment = await prisma.communityComment.create({
      data: {
        postId,
        authorId,
        content
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      }
    });

    // Update comment count
    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } }
    });

    return comment;
  }

  // --- Save / Bookmark ---

  static async toggleSavePost(postId: string, userId: string) {
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });

    if (existing) {
      await prisma.savedPost.delete({
        where: { id: existing.id }
      });
      return { saved: false };
    } else {
      await prisma.savedPost.create({
        data: { userId, postId }
      });
      return { saved: true };
    }
  }

  // --- New Methods for Group Chat ---

  private static async checkGroupAccess(groupId: string, userId: string) {
    // Validate if the user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (membership) return true;

    const group = await prisma.communityGroup.findUnique({ where: { id: groupId } });
    if (group && (group.type !== 'PRIVATE' || group.ownerId === userId)) return true;

    // Check if it's an academic group and user is faculty or student
    const academicGroup = await prisma.group.findUnique({ where: { id: groupId } });
    if (academicGroup) {
      if (academicGroup.facultyId === userId) return true;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const student = await prisma.groupStudent.findFirst({
          where: { groupId, email: user.email }
        });
        if (student) return true;
      }
    }

    return false;
  }

  static async getGroupMessages(groupId: string, userId: string, limit = 50, cursor?: string) {
    const hasAccess = await this.checkGroupAccess(groupId, userId);
    if (!hasAccess) throw new Error('Unauthorized');

    const messages = await prisma.message.findMany({
      where: { conversationId: groupId },
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      }
    });

    return messages.reverse();
  }

  static async sendGroupMessage(groupId: string, userId: string, content: string, attachments: any[] = []) {
    const hasAccess = await this.checkGroupAccess(groupId, userId);
    if (!hasAccess) throw new Error('Unauthorized');

    const message = await prisma.message.create({
      data: {
        conversationId: groupId,
        senderId: userId,
        message: content,
        attachments
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
      }
    });

    return message;
  }

  // --- Top Contributors ---

  static async getTopContributors(organizationId?: string, limit = 5) {
    const validOrgId = await CommunityService.getValidOrgId(organizationId);
    const users = await prisma.user.findMany({
      where: validOrgId ? { organizationId: validOrgId } : {},
      include: {
        _count: {
          select: { communityPosts: true, communityComments: true }
        },
        department: {
          select: { name: true }
        }
      },
      take: 100, // Fetch more to sort by karma locally since Prisma can't easily sort by derived sum
    });

    const ranked = users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      subject: u.department?.name || 'General',
      karma: (u._count.communityPosts * 50) + (u._count.communityComments * 10)
    })).sort((a, b) => b.karma - a.karma).slice(0, limit);
    
    return ranked;
  }
}

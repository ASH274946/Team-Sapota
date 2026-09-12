import prisma from '../config/prisma';


export class ModerationService {
  /**
   * Delete a community post (Admin only)
   */
  static async deletePost(postId: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    return prisma.communityPost.delete({ where: { id: postId } });
  }

  /**
   * Delete a message (Admin only)
   */
  static async deleteMessage(messageId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new Error('Message not found');
    return prisma.message.delete({ where: { id: messageId } });
  }

  /**
   * List all groups for auditing
   */
  static async auditGroups(organizationId?: string) {
    return prisma.communityGroup.findMany({
      ...(organizationId && { where: { organizationId } }),
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Suspend a group
   */
  static async suspendGroup(groupId: string) {
    // We could add an "isActive" field to CommunityGroup or simply delete it
    return prisma.communityGroup.delete({ where: { id: groupId } });
  }
}

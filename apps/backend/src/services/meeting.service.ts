import prisma from '../config/prisma';

export class MeetingService {
  static async getMeetings(organizationId?: string) {
    return prisma.meeting.findMany({
      where: {
        ...(organizationId && { organizationId }),
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  static async createMeeting(
    hostId: string,
    title: string,
    scheduledAt: Date,
    meetingLink?: string,
    organizationId?: string
  ) {
    return prisma.meeting.create({
      data: {
        title,
        hostId,
        scheduledAt,
        meetingLink,
        organizationId,
      },
      include: {
        host: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }
}

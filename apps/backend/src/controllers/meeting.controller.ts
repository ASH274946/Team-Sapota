import { Request, Response } from 'express';
import { z } from 'zod';
import { MeetingService } from '../services/meeting.service';

const createMeetingSchema = z.object({
  title: z.string().min(3),
  scheduledAt: z.coerce.date(),
  meetingLink: z.string().url().optional().or(z.literal('')),
});

export const getMeetings = async (req: Request, res: Response) => {
  const meetings = await MeetingService.getMeetings(req.user!.organizationId || undefined);
  res.status(200).json({ status: 'success', data: meetings });
};

export const createMeeting = async (req: Request, res: Response) => {
  const data = createMeetingSchema.parse(req.body);
  const meeting = await MeetingService.createMeeting(
    req.user!.id,
    data.title,
    data.scheduledAt,
    data.meetingLink || undefined,
    req.user!.organizationId || undefined
  );
  res.status(201).json({ status: 'success', data: meeting });
};

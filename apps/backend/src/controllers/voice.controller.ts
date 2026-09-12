import { Request, Response } from 'express';
import { VoiceService } from '../services/voice.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['STUDY', 'PROJECT', 'CASUAL', 'INTERVIEW']).default('CASUAL'),
});

export const createVoiceRoom = async (req: Request, res: Response) => {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await VoiceService.createVoiceRoom(
      data.name,
      data.type,
      req.user!.id,
      req.user!.organizationId || undefined
    );
    res.status(201).json({ status: 'success', data: room });
  } catch (err: any) {
    logger.error(err, '[VoiceController] Error creating room');
    res.status(400).json({ status: 'error', error: err.message });
  }
};

export const getActiveRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await VoiceService.getActiveRooms(req.user!.organizationId || undefined);
    res.status(200).json({ status: 'success', data: rooms });
  } catch (err: any) {
    logger.error(err, '[VoiceController] Error fetching rooms');
    res.status(500).json({ status: 'error', error: err.message });
  }
};

export const generateToken = async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;
    const user = req.user!;
    // Fetch full user name from DB since req.user only has partial fields
    const participantIdentity = user.id;
    const participantName = user.id.slice(0, 8); // fallback

    const token = await VoiceService.generateToken(roomName, participantName, participantIdentity);
    const livekitUrl = VoiceService.getLiveKitUrl();
    res.status(200).json({ status: 'success', data: { token, livekitUrl, roomName } });
  } catch (err: any) {
    logger.error(err, '[VoiceController] Error generating token');
    res.status(500).json({ status: 'error', error: err.message });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    await VoiceService.joinRoom(roomId, req.user!.id);
    res.status(200).json({ status: 'success', data: { joined: true } });
  } catch (err: any) {
    logger.error(err, '[VoiceController] Error joining room');
    res.status(400).json({ status: 'error', error: err.message });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    await VoiceService.leaveRoom(roomId, req.user!.id);
    res.status(200).json({ status: 'success', data: { left: true } });
  } catch (err: any) {
    logger.error(err, '[VoiceController] Error leaving room');
    res.status(400).json({ status: 'error', error: err.message });
  }
};

export const closeRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    await VoiceService.closeRoom(roomId, req.user!.id);
    res.status(200).json({ status: 'success', data: { closed: true } });
  } catch (err: any) {
    logger.error(err, '[VoiceController] Error closing room');
    res.status(403).json({ status: 'error', error: err.message });
  }
};

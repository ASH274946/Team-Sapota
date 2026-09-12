import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const conversationId = req.params.conversationId;
  const limit = parseInt(req.query.limit as string) || 100;
  const cursor = req.query.cursor as string;

  const messages = await ChatService.getMessages(conversationId, limit, cursor);
  res.status(200).json({ status: 'success', data: messages });
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  const reqAuth = req as any;
  const userId = reqAuth.user?.id;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
    return;
  }

  const conversations = await ChatService.getConversations(userId);
  res.status(200).json({ status: 'success', data: conversations });
};

export const getOrgUsers = async (req: Request, res: Response): Promise<void> => {
  const reqAuth = req as any;
  const userId = reqAuth.user?.id;
  const orgId = reqAuth.user?.organizationId || null;

  if (!userId) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
    return;
  }

  const users = await ChatService.getOrgUsers(orgId, userId);
  res.status(200).json({ status: 'success', data: users });
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const reqAuth = req as any;
  const userId = reqAuth.user?.id;
  const { conversationId, message, attachments } = req.body;

  if (!userId) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
    return;
  }

  if (!conversationId || !message) {
    res.status(400).json({ status: 'error', message: 'Missing conversationId or message' });
    return;
  }

  const saved = await ChatService.saveMessage(conversationId, userId, message, attachments || []);
  res.status(200).json({ status: 'success', data: saved });
};

import { Request, Response } from 'express';
import { CommunityService } from '../services/community.service';
import { z } from 'zod';
import { emitToGroup } from '../sockets/socket.server';

const createPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  type: z.enum(['DISCUSSION', 'QUESTION', 'PROJECT', 'ANNOUNCEMENT']).default('DISCUSSION'),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'ORG_ONLY']).default('PUBLIC'),
  attachments: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

const createGroupSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
});

export const createPost = async (req: Request, res: Response) => {
  const data = createPostSchema.parse(req.body);
  const post = await CommunityService.createPost(
    req.user!.id,
    data.content,
    data.type,
    data.visibility,
    data.attachments,
    req.user!.organizationId ? req.user!.organizationId : undefined,
    data.title,
    data.tags
  );
  res.status(201).json({ status: 'success', data: post });
};

export const getFeed = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string;
  const posts = await CommunityService.getFeed(req.user!.organizationId ? req.user!.organizationId : undefined, limit, cursor);
  res.status(200).json({ status: 'success', data: posts });
};

export const getGroups = async (req: Request, res: Response) => {
  const groups = await CommunityService.getGroups(
    req.user!.organizationId ? req.user!.organizationId : undefined,
    req.user!.id
  );
  res.status(200).json({ status: 'success', data: groups });
};

export const createGroup = async (req: Request, res: Response) => {
  const data = createGroupSchema.parse(req.body);
  const group = await CommunityService.createGroup(
    req.user!.id,
    data.name,
    data.description || '',
    data.type,
    req.user!.organizationId ?? undefined
  );
  res.status(201).json({ status: 'success', data: group });
};

export const joinGroup = async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const membership = await CommunityService.joinGroup(groupId, req.user!.id);
  res.status(200).json({ status: 'success', data: membership });
};

export const inviteMember = async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const { inviteeIdentifier } = req.body;
  if (!inviteeIdentifier) {
    res.status(400).json({ status: 'error', message: 'Identifier required' });
    return;
  }
  
  const membership = await CommunityService.inviteToGroup(groupId, req.user!.id, inviteeIdentifier);
  res.status(200).json({ status: 'success', data: membership });
};

export const getGroupMembers = async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const members = await CommunityService.getGroupMembers(groupId, req.user!.id);
  res.status(200).json({ status: 'success', data: members });
};

export const getGroupMessages = async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const cursor = req.query.cursor as string | undefined;
  const messages = await CommunityService.getGroupMessages(groupId, req.user!.id, limit, cursor);
  res.status(200).json({ status: 'success', data: messages });
};

export const sendGroupMessage = async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
  const { content, attachments } = req.body;
  if (!content) {
    res.status(400).json({ status: 'error', message: 'Content required' });
    return;
  }

  const message = await CommunityService.sendGroupMessage(groupId, req.user!.id, content, attachments);

  // Broadcast to the group room via Socket.IO
  emitToGroup(groupId, 'chat:message', message);

  res.status(201).json({ status: 'success', data: message });
};

// --- New Controller Methods ---

const updatePostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
});

const addCommentSchema = z.object({
  content: z.string().min(1),
});

export const getPost = async (req: Request, res: Response) => {
  const post = await CommunityService.getPost(req.params.id);
  if (!post) {
    res.status(404).json({ status: 'error', message: 'Post not found' });
    return;
  }
  res.status(200).json({ status: 'success', data: post });
};

export const updatePost = async (req: Request, res: Response) => {
  const data = updatePostSchema.parse(req.body);
  const post = await CommunityService.updatePost(req.params.id, req.user!.id, data);
  res.status(200).json({ status: 'success', data: post });
};

export const deletePost = async (req: Request, res: Response) => {
  await CommunityService.deletePost(req.params.id, req.user!.id);
  res.status(200).json({ status: 'success', message: 'Post deleted' });
};



export const kickMember = async (req: Request, res: Response) => {
  const { memberId } = req.body;
  await CommunityService.kickMember(req.params.groupId, req.user!.id, memberId);
  res.json({ success: true, message: 'Member removed from the group' });
};

export const getComments = async (req: Request, res: Response) => {
  const comments = await CommunityService.getComments(req.params.id);
  res.status(200).json({ status: 'success', data: comments });
};

export const addComment = async (req: Request, res: Response) => {
  const data = addCommentSchema.parse(req.body);
  const comment = await CommunityService.addComment(req.params.id, req.user!.id, data.content);
  res.status(201).json({ status: 'success', data: comment });
};

export const toggleSavePost = async (req: Request, res: Response) => {
  const result = await CommunityService.toggleSavePost(req.params.id, req.user!.id);
  res.status(200).json({ status: 'success', data: result });
};

export const searchUsers = async (req: Request, res: Response) => {
  const { q, excludeGroupId } = req.query;
  const users = await CommunityService.searchUsers(
    q as string, 
    excludeGroupId as string | undefined
  );
  res.json({ success: true, data: users });
};

export const getTopContributors = async (req: Request, res: Response) => {
  const topUsers = await CommunityService.getTopContributors(req.user!.organizationId ? req.user!.organizationId : undefined);
  res.status(200).json({ status: 'success', data: topUsers });
};


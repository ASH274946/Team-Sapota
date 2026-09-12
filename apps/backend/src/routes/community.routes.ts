import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import * as CommunityController from '../controllers/community.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['STUDENT', 'TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']));

router.post('/posts', asyncHandler(CommunityController.createPost));
router.get('/posts/feed', asyncHandler(CommunityController.getFeed));
router.get('/posts/:id', asyncHandler(CommunityController.getPost));
router.put('/posts/:id', asyncHandler(CommunityController.updatePost));
router.delete('/posts/:id', asyncHandler(CommunityController.deletePost));
router.get('/posts/:id/comments', asyncHandler(CommunityController.getComments));
router.post('/posts/:id/comments', asyncHandler(CommunityController.addComment));
router.post('/posts/:id/save', asyncHandler(CommunityController.toggleSavePost));

router.post('/groups', asyncHandler(CommunityController.createGroup));
router.get('/groups', asyncHandler(CommunityController.getGroups));
router.post('/groups/:groupId/join', asyncHandler(CommunityController.joinGroup));
router.post('/groups/:groupId/invite', asyncHandler(CommunityController.inviteMember));
router.get('/groups/:groupId/members', asyncHandler(CommunityController.getGroupMembers));
router.post('/groups/:groupId/kick', asyncHandler(CommunityController.kickMember));
router.get('/groups/:groupId/messages', asyncHandler(CommunityController.getGroupMessages));
router.post('/groups/:groupId/messages', asyncHandler(CommunityController.sendGroupMessage));

router.get('/users/search', asyncHandler(CommunityController.searchUsers));
router.get('/users/top', asyncHandler(CommunityController.getTopContributors));

export default router;

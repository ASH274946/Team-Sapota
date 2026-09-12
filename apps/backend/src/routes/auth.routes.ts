import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/async-handler';
import {
  getMe,
  updateProfile,
  updatePreferences,
  updateOrganization,
  getAvailableOrganizations,
  getPublicOrganizations,
  switchOrganization,
  getSessions,
  revokeSessionById,
  changePassword,
  getStorageUsage,
  signup,
  login,
  refresh,
  logout,
  completeOnboarding,
  acceptInvite,
  ssoLogin,
  googleSignin,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Strict rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
});

// Per-user/ip rate limiting for refresh token endpoint (5 per minute)
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many refresh attempts. Please try again later.' },
});

// Public auth endpoints (with strict rate limiting)
router.get('/public-organizations', asyncHandler(getPublicOrganizations));
router.post('/signup', authLimiter, asyncHandler(signup));
router.post('/accept-invite', authLimiter, asyncHandler(acceptInvite));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/sso', authLimiter, asyncHandler(ssoLogin));
router.post('/google', authLimiter, asyncHandler(googleSignin));
router.post('/refresh', refreshLimiter, asyncHandler(refresh));
router.post('/logout', authLimiter, asyncHandler(logout));

// Protected auth endpoints
router.use(authenticate);

router.get('/me', asyncHandler(getMe));
router.post('/onboarding/complete', asyncHandler(completeOnboarding));
router.put('/me/profile', asyncHandler(updateProfile));
router.put('/me/preferences', asyncHandler(updatePreferences));
router.get('/me/organizations', asyncHandler(getAvailableOrganizations));
router.post('/me/switch-organization', asyncHandler(switchOrganization));
router.put('/me/organization', asyncHandler(updateOrganization));

router.get('/me/sessions', asyncHandler(getSessions));
router.delete('/me/sessions/:id', asyncHandler(revokeSessionById));
router.put('/me/password', asyncHandler(changePassword));
router.get('/me/storage', asyncHandler(getStorageUsage));

export default router;

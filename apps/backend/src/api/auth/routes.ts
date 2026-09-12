import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  signupSchema,
  loginSchema,
  ssoSchema,
  acceptInviteSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
  switchOrganizationSchema,
} from './validators';
import {
  signup,
  login,
  refresh,
  logout,
  ssoLogin,
  acceptInvite,
  getPublicOrganizations,
  getMe,
  updateProfile,
  updatePreferences,
  changePassword,
  getSessions,
  revokeSessionById,
  switchOrganization,
  getUserOrganizations,
  getStorageUsage,
  completeOnboarding,
  googleSignin,
} from './controller';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many refresh attempts. Please try again later.' },
});

router.get('/public-organizations', asyncHandler(getPublicOrganizations));
router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(signup));
router.post('/accept-invite', authLimiter, validate(acceptInviteSchema), asyncHandler(acceptInvite));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.post('/sso', authLimiter, validate(ssoSchema), asyncHandler(ssoLogin));
router.post('/google', authLimiter, asyncHandler(googleSignin));
router.post('/refresh', refreshLimiter, asyncHandler(refresh));
router.post('/logout', authLimiter, asyncHandler(logout));

router.use(authenticate);

router.get('/me', asyncHandler(getMe));
router.put('/me/profile', validate(updateProfileSchema), asyncHandler(updateProfile));
router.put('/me/preferences', validate(updatePreferencesSchema), asyncHandler(updatePreferences));
router.put('/me/password', validate(changePasswordSchema), asyncHandler(changePassword));
router.get('/me/sessions', asyncHandler(getSessions));
router.delete('/me/sessions/:id', asyncHandler(revokeSessionById));
router.post('/me/switch-organization', validate(switchOrganizationSchema), asyncHandler(switchOrganization));
router.get('/me/organizations', asyncHandler(getUserOrganizations));
router.get('/me/storage', asyncHandler(getStorageUsage));
router.post('/onboarding/complete', asyncHandler(completeOnboarding));

export default router;

import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Enforce auth and admin permission requirements
router.use(authenticate);
router.use(authorize(['SUPER_ADMIN', 'ADMIN', 'ORG_ADMIN']));
router.use(requirePermission('MANAGE_USERS'));

// ── 1. Organization Management ──
router.get('/organizations', asyncHandler(AdminController.getOrganizations));
router.post('/organizations', asyncHandler(AdminController.createOrganization));
router.put('/organizations/:id', asyncHandler(AdminController.updateOrganization));
router.post('/organizations/:id/update', asyncHandler(AdminController.updateOrganization));
router.delete('/organizations/:id', asyncHandler(AdminController.deleteOrganization));
router.put('/organizations/:id/suspend', asyncHandler(AdminController.suspendOrganization));
router.get('/organizations/:id/analytics', asyncHandler(AdminController.getOrganizationAnalytics));

// ── 2. Department Management ──
router.get('/departments', asyncHandler(AdminController.getDepartments));
router.post('/departments', asyncHandler(AdminController.createDepartment));
router.put('/departments/:id', asyncHandler(AdminController.updateDepartment));
router.delete('/departments/:id', asyncHandler(AdminController.archiveDepartment));
router.post('/departments/:id/assign-hod', asyncHandler(AdminController.assignHOD));
router.post('/departments/transfer-faculty', asyncHandler(AdminController.transferFaculty));

// ── 3. User Management ──
router.get('/users', asyncHandler(AdminController.getUsers));
router.get('/users/global-directory', asyncHandler(AdminController.getGlobalDirectoryData));
router.post('/users', asyncHandler(AdminController.createUser));
router.put('/users/:id', asyncHandler(AdminController.updateUser));
router.delete('/users/:id', asyncHandler(AdminController.deleteUser));
router.put('/users/:id/suspend', asyncHandler(AdminController.suspendUser));
router.post('/users/:id/reset-password', asyncHandler(AdminController.resetPassword));
router.post('/users/:id/impersonate', asyncHandler(AdminController.impersonateUser));
router.post('/users/self/reset-password-force', asyncHandler(AdminController.forceResetOwnPassword));
router.post('/users/invite', asyncHandler(AdminController.inviteUser));
router.post('/users/import', uploadMiddleware.single('file'), asyncHandler(AdminController.importUsersCsv));

// ── 4. Role & Permission Management ──
router.get('/roles', asyncHandler(AdminController.getRoles));
router.post('/roles', asyncHandler(AdminController.createRole));
router.put('/roles/:id', asyncHandler(AdminController.updateRole));
router.delete('/roles/:id', asyncHandler(AdminController.deleteRole));
router.get('/permissions', asyncHandler(AdminController.getPermissions));
router.post('/roles/:id/permissions', asyncHandler(AdminController.assignPermissions));
// ── 5.1. Classroom Management ──
router.get('/classrooms', asyncHandler(AdminController.getClassrooms));
router.post('/classrooms', asyncHandler(AdminController.createClassroom));
router.put('/classrooms/:id', asyncHandler(AdminController.updateClassroom));
router.delete('/classrooms/:id', asyncHandler(AdminController.deleteClassroom));

// ── 6. Group Management ──
router.get('/groups', asyncHandler(AdminController.getGroups));
router.post('/groups', asyncHandler(AdminController.createGroup));
router.put('/groups/:id', asyncHandler(AdminController.updateGroup));
router.delete('/groups/:id', asyncHandler(AdminController.deleteGroup));
router.post('/groups/:id/assign-faculty', asyncHandler(AdminController.assignGroupFaculty));
router.post('/groups/:id/assign-students', asyncHandler(AdminController.assignGroupStudents));
router.post('/groups/:id/import', asyncHandler(AdminController.importGroupStudents));
router.post('/groups/:id/assign-papers', asyncHandler(AdminController.assignGroupPapers));

// ── 7. Paper Management ──
router.get('/papers', asyncHandler(AdminController.getPapers));
router.put('/papers/:id/archive', asyncHandler(AdminController.archivePaper));
router.delete('/papers/:id', asyncHandler(AdminController.deletePaper));
router.post('/papers/:id/regenerate', asyncHandler(AdminController.regeneratePaper));
router.post('/papers/:id/reassign', asyncHandler(AdminController.reassignPaper));
router.get('/papers/analytics/stats', asyncHandler(AdminController.getPaperAnalytics));

// ── 9. Assignment Management ──
router.get('/assignments', asyncHandler(AdminController.getAssignments));
router.post('/assignments/:id/reassign', asyncHandler(AdminController.reassignAssignment));
router.put('/assignments/:id/close', asyncHandler(AdminController.closeAssignment));
router.put('/assignments/:id/reopen', asyncHandler(AdminController.reopenAssignment));
router.get('/assignments/:id/export', asyncHandler(AdminController.exportAssignmentResults));

// ── 10. Analytics Dashboard ──
router.get('/analytics', asyncHandler(AdminController.getAnalytics));

// ── 11. Audit Logs ──
router.get('/audit', asyncHandler(AdminController.getAuditLogs));

// ── 12. Billing & Subscription Management ──
router.get('/billing/subscriptions', asyncHandler(AdminController.getBillingSubscriptions));
router.get('/billing/subscriptions/:organizationId', asyncHandler(AdminController.getSubscription));
router.put('/billing/subscriptions/:organizationId', asyncHandler(AdminController.updateSubscription));
router.get('/billing/invoices/:subscriptionId', asyncHandler(AdminController.getSubscriptionInvoices));
router.post('/billing/invoices', asyncHandler(AdminController.createSubscriptionInvoice));
router.get('/billing/usage/:organizationId', asyncHandler(AdminController.getBillingUsage));

// ── 13. AI Provider Management ──
router.get('/ai-providers', asyncHandler(AdminController.getAiProviders));
router.post('/ai-providers/health', asyncHandler(AdminController.testProviderHealth));
router.put('/ai-providers/failover', asyncHandler(AdminController.updateFailoverSettings));

// ── 14. Queue Management ──
router.get('/queues/health', asyncHandler(AdminController.getQueueHealth));
router.get('/queues/failed', asyncHandler(AdminController.getFailedJobs));
router.post('/queues/retry', asyncHandler(AdminController.retryQueueJob));

// ── 15. System Settings ──
// System settings are fetched from SettingsController.
import * as SettingsController from '../controllers/settings.controller';
router.get('/settings', SettingsController.getSettings);
router.put('/settings', SettingsController.updateSettings);

// ── 16. Faculty Management ──
router.get('/faculty', asyncHandler(AdminController.getFaculty));
router.post('/faculty', asyncHandler(AdminController.createFaculty));
router.put('/faculty/:id', asyncHandler(AdminController.updateFaculty));
router.put('/faculty/:id/status', asyncHandler(AdminController.deactivateFaculty));
router.post('/faculty/invite', asyncHandler(AdminController.inviteFaculty));
router.post('/faculty/reset-password/:id', asyncHandler(AdminController.resetFacultyPassword));
router.post('/faculty/import', asyncHandler(AdminController.importFacultyCsv));

// ── 17. Student Management ──
router.get('/students', asyncHandler(AdminController.getStudents));
router.post('/students', asyncHandler(AdminController.createStudent));
router.put('/students/:id', asyncHandler(AdminController.updateStudent));
router.put('/students/:id/status', asyncHandler(AdminController.deactivateStudent));
router.post('/students/import', asyncHandler(AdminController.importStudentsCsv));

// ── 18. Approvals Management ──
router.get('/approvals', asyncHandler(AdminController.getPendingApprovals));
router.post('/approvals/:id/approve', asyncHandler(AdminController.approveAssessment));
router.post('/approvals/:id/reject', asyncHandler(AdminController.rejectAssessment));
router.post('/approvals/:id/request-changes', asyncHandler(AdminController.requestChanges));
router.post('/approvals/:id/publish', asyncHandler(AdminController.publishAssessment));

// ── 18. Knowledge Base Stats & Resources ──
router.get('/knowledge/stats', asyncHandler(AdminController.getKnowledgeStats));
router.post('/knowledge/resources', uploadMiddleware.single('file'), asyncHandler(AdminController.createKnowledgeResource));
router.delete('/knowledge/resources/:id', asyncHandler(AdminController.deleteKnowledgeResource));

// ── 19. Organization Analytics Dashboard ──
router.get('/analytics/dashboard', asyncHandler(AdminController.getOrgAnalyticsDashboard));

// ── 20. Organization Settings ──
router.get('/organization/settings', asyncHandler(AdminController.getOrganizationSettings));
router.put('/organization/settings', asyncHandler(AdminController.updateOrganizationSettings));

// ── 21. Dashboard Stats ──
router.get('/dashboard/stats', asyncHandler(AdminController.getDashboardStats));

// ── 22. System Health ──
router.get('/health', asyncHandler(AdminController.getSystemHealth));

// ── 23. AI Providers ──
router.get('/providers', asyncHandler(AdminController.getProviders));

export default router;

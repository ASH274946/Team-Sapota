export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  FACULTY = 'FACULTY',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export const ROUTES = {
  SUPER_ADMIN: {
    DASHBOARD: '/super-admin',
    SYSTEM_HEALTH: '/super-admin/system-health',
    PROVIDERS: '/super-admin/providers',
    KNOWLEDGE_BASE: '/super-admin/knowledge',
    USERS: '/super-admin/users',
    ORGANIZATIONS: '/super-admin/organizations',
    SUBSCRIPTIONS: '/super-admin/subscriptions',
    SETTINGS: '/super-admin/settings',
    AUDIT: '/super-admin/audit',
    ANALYTICS: '/super-admin/analytics'
  },
  ORG_ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    CLASSES: '/admin/classes',
    APPROVALS: '/admin/approvals',
    ANALYTICS: '/admin/analytics',
    SESSIONS: '/admin/sessions',
    SETTINGS: '/admin/settings'
  },
  FACULTY: {
    DASHBOARD: '/faculty'
  },
  TEACHER: {
    DASHBOARD: '/teacher'
  },
  STUDENT: {
    DASHBOARD: '/student'
  }
} as const;

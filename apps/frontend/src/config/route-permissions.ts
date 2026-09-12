/** Routes explicitly allowed per role. Sub-path access uses prefix matching except where denied. */
export const ROUTE_PERMISSIONS = {
  SUPER_ADMIN: [
    '/super-admin',
    '/dashboard', '/settings', '/profile'
  ],
  ADMIN: [
    '/admin',
    '/dashboard', '/settings', '/profile'
  ],
  ORG_ADMIN: [
    '/admin',
    '/dashboard', '/settings', '/profile'
  ],
  FACULTY: [
    '/faculty',
    '/dashboard', '/assignments', '/assignments/create', '/settings', '/generate', '/ai-toolkit', '/grader', '/my-classes', '/papers', '/profile'
  ],
  TEACHER: [
    '/teacher',
    '/dashboard', '/assignments', '/assignments/create', '/settings', '/generate', '/ai-toolkit', '/grader', '/my-classes', '/papers', '/profile'
  ],
  STUDENT: [
    '/student',
    '/assignments',
    '/dashboard', '/settings', '/profile'
  ],
};

const STUDENT_DENIED_PREFIXES = [
  '/teacher',
  '/faculty',
  '/admin',
  '/super-admin',
  '/dashboard/teacher',
  '/dashboard/faculty',
  '/dashboard/admin',
  '/super-admin',
  '/assignments/create',
  '/assessments/create',
  '/grader',
  '/generate',
  '/papers',
];

export const canAccessRoute = (role: string, path: string): boolean => {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();

  if (normalizedRole === 'SUPER_ADMIN') return true;

  const isSuperAdminRoute = path === '/super-admin' || path.startsWith('/super-admin/') || path === '/super-admin' || path.startsWith('/super-admin/');
  if (isSuperAdminRoute) {
    return false; // Already checked for SUPER_ADMIN above
  }

  if (normalizedRole === 'STUDENT') {
    if (STUDENT_DENIED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return false;
    }
  }

  const allowedRoutes = ROUTE_PERMISSIONS[normalizedRole as keyof typeof ROUTE_PERMISSIONS] || [];

  return allowedRoutes.some((route) => path === route || path.startsWith(`${route}/`));
};

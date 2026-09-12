import { UserRole, ROUTES } from '../config/routes';

export function getDashboardRoute(role: string): string {
  const normalizedRole = role?.toUpperCase();
  switch (normalizedRole) {
    case UserRole.SUPER_ADMIN:
      return ROUTES.SUPER_ADMIN.DASHBOARD;
    case UserRole.ADMIN:
    case UserRole.ORG_ADMIN:
      return ROUTES.ORG_ADMIN.DASHBOARD;
    case UserRole.FACULTY:
      return ROUTES.FACULTY.DASHBOARD;
    case UserRole.TEACHER:
      return ROUTES.TEACHER.DASHBOARD;
    case UserRole.STUDENT:
      return ROUTES.STUDENT.DASHBOARD;
    default:
      return ROUTES.STUDENT.DASHBOARD;
  }
}

export function validateRouteAccess(role: string, pathname: string): void {
  // Only throw in development to avoid crashing production unnecessarily
  if (process.env.NODE_ENV === 'development') {
    const normalizedRole = role?.toUpperCase();
    
    // Validate Super Admin trying to access Org Admin dashboard explicitly
    if (normalizedRole === UserRole.SUPER_ADMIN && pathname === ROUTES.ORG_ADMIN.DASHBOARD) {
      console.error(`[Navigation Error] Super Admin should not access the Organization Admin dashboard (${pathname}).`);
    }
    
    // Validate Org Admin trying to access Super Admin dashboard
    if ((normalizedRole === UserRole.ADMIN || normalizedRole === UserRole.ORG_ADMIN) && pathname === ROUTES.SUPER_ADMIN.DASHBOARD) {
      console.error(`[Navigation Error] Organization Admin should not access the Super Admin dashboard (${pathname}).`);
    }
  }
}

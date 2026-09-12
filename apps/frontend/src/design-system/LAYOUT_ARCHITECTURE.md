# Layout Architecture

## Two-Layer Routing
```
/ (non-admin routes)
  └── AppShell (contains role-based sidebar + Topbar)
       ├── SuperAdminSidebar / OrgAdminSidebar / FacultySidebar / StudentSidebar
       ├── Topbar
       └── <main className="page-container">

/admin, /super-admin (admin routes — chrome excluded from AppShell)
  └── admin/layout.tsx or super-admin/layout.tsx
       ├── AdminSidebar / SuperAdminSidebar
       ├── AdminTopbar / SuperAdminTopbar
       └── {children}
```

## Chrome Exclusion
AppShell excludes routes: `/`, `/login`, `/register`, `/onboarding`, `/admin/*`, `/super-admin/*`

## Responsive Behavior
- Desktop (>1024px): sidebar visible, `.app-main` has `margin-left: var(--sidebar-w)`
- Tablet/Mobile (<1024px): sidebar hidden off-screen, toggleable via hamburger + overlay
- Mobile (<640px): bottom nav bar, `.page-container` reduced padding

## Content Container
```css
.page-container {
  flex: 1;
  padding: 24px;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
  overflow-x: hidden;
  width: 100%;
}
```

## Dashboard Grid
Refactored dashboards use inline CSS grid with:
```css
display: grid;
grid-template-columns: repeat(4, minmax(0, 1fr));
gap: 12px;
```

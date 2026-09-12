# Design System — Component Inventory

## Tokens
| Token | File | Status |
|-------|------|--------|
| colors | `colors.ts` | ✅ |
| typography | `typography.ts` | ✅ |
| spacing | `spacing.ts` | ✅ |
| layout | `layout.ts` | ✅ Created |
| radius | `radius.ts` | ✅ Created |
| elevation | `elevation.ts` | ✅ Created |

## Components
| Component | File | Status |
|-----------|------|--------|
| Card | `Card.tsx` | ✅ |
| Button | `Button.tsx` | ✅ (primary, secondary, outline, ghost, danger) |
| Input | `Input.tsx` | ✅ (label, error, icon) |
| Select | `Select.tsx` | ✅ (label, error, custom arrow) |
| Badge | `Badge.tsx` | ✅ (pending, success, warning, error, info, draft) |
| Table | `Table.tsx` | ✅ (basic, loading skeleton, empty state) |
| DataTable | `DataTable.tsx` | ✅ Created (loading, empty, custom renders) |
| Dialog | `Dialog.tsx` | ✅ (sm/md/lg, backdrop, footer, close btn) |
| EmptyState | `EmptyState.tsx` | ✅ (icon, title, description, action) |
| LoadingState | `LoadingState.tsx` | ✅ (skeleton shimmer) |
| ErrorState | `ErrorState.tsx` | ✅ (message, retry button) |
| PageHeader | `PageHeader.tsx` | ✅ (title, subtitle, actions) |
| StatsCard | `StatsCard.tsx` | ✅ (label, value, icon, trend) |
| MetricCard | `MetricCard.tsx` | ✅ Created (label, value, icon, trend, description) |
| ActionCard | `ActionCard.tsx` | ✅ Created (icon, label, description, href/onClick, variant) |
| ActivityCard | `ActivityCard.tsx` | ✅ Created (title, items, empty, viewAll) |
| Avatar | `Avatar.tsx` | ✅ (sm/md/lg, initials, image) |
| Tabs | `Tabs.tsx` | ✅ (basic tab bar) |

## Usage Status
- ✅ **Fully migrated**: dashboard, super-admin dashboard, student dashboard, admin analytics, super-admin organizations, admin users, super-admin audit
- ⏳ **Partial / mixed**: admin approvals, admin classes, admin students, super-admin subscriptions, admin settings, admin departments
- ❌ **Not migrated**: 15+ pages still use `bg-white rounded-2xl border border-gray-100` pattern

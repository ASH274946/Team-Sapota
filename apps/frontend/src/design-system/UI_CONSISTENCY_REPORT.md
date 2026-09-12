# UI Consistency Report

## Design Tokens Used
- CSS variables via `globals.css`: `--brand`, `--bg-*`, `--border-*`, `--text-*`, `--shadow-*`, `--radius-*`, `--sidebar-w`, `--topbar-h`, `--page-pad`, `--page-max-w`
- TypeScript tokens via `src/design-system/`: `colors.ts`, `typography.ts`, `spacing.ts`, `layout.ts`, `radius.ts`, `elevation.ts`

## Spacing Compliance
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96 ✓
- Refactored pages use only spacing scale values
- ~20 pages still use arbitrary Tailwind values (`space-y-6`, `gap-4`, `p-5`, etc.)

## Typography Compliance
- Page Title: 36px (clamp, font-weight 800) ✓ Used in PageHeader
- Section Title: 24px (font-weight 700)
- Card Title: 16px (font-weight 700)
- Body: 14px (font-weight 400)
- Caption: 12px (font-weight 400)
- All refactored pages use CSS variables or design system tokens
- Unrefactored pages use raw Tailwind classes

## Layout Compliance
- AppShell sidebar: 260px fixed ✓
- Topbar: 72px sticky ✓
- Content container: 100%, max-width 1600px, margin auto, padding 32px ✓
- Refactored dashboards use `display: grid; grid-template-columns: repeat(4, minmax(0, 1fr))` ✓
- Unrefactored pages use `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` (Tailwind)

## Cards & Surfaces
- Refactored: `<Card>` component with consistent border, radius, padding, shadow
- Unrefactored: `bg-white rounded-2xl border border-gray-100 shadow-sm` (hardcoded)

## States Coverage
- Loading: `<LoadingState>` used in all refactored pages
- Error: `<ErrorState>` used in all refactored pages
- Empty: `<EmptyState>` used in all refactored pages
- Unrefactored pages use inline `flex items-center justify-center min-h-[400px]` + spinner div

## Tables
- DataTable component available and used in organizations and users pages
- Most remaining pages still use raw `<table>` markup with `border-gray-100`, `text-gray-400`, etc.

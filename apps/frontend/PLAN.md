# Landing page + auth branding fixes — implementation plan

## Goal
1. Replace all remaining "shiksha ai" / "Shiksha Admin" branding with "Vidya AI" in auth pages and the admin sidebar fallback.
2. Fix the most visible landing-page layout / consistency issues reported by the user without over-engineering.

## Chunks

### Chunk 1 — Auth re-branding (straightforward find/replace)
Files:
- `apps/frontend/src/app/login/page.tsx`
- `apps/frontend/src/app/register/page.tsx`
- `apps/frontend/src/app/forgot-password/page.tsx`
- `apps/frontend/src/components/layout/AdminSidebar.tsx`

Changes:
- Replace `shiksha ai` → `Vidya AI` (keep the same casing context: logo text, body copy, copyright, etc.).
- Replace `support@shiksha.ai` → `support@vidyaai.com`.
- Replace sidebar fallback `'Shiksha Admin'` → `'Vidya AI Admin'`.
- Preserve exact JSX/string formatting (single quotes in JS strings, double quotes in JSX attributes).

Verify: search the repo for any remaining "shiksha" or "Shiksha" references in these files.

### Chunk 2 — Landing page layout & consistency fixes
Files in `apps/frontend/src/components/landing/` and `apps/frontend/src/app/page.tsx`.

Priority fixes (visible layout issues):
1. **Navigation anchors** — Header and Footer link to `#blogs` but no `#blogs` section exists. Replace with `#faqs` or remove the link; ensure all other hash links map to real section IDs.
2. **z-index stacking** — `page.tsx` scroll-progress bar uses `z-[9999]`, which covers the open ContactModal (`z-50`). Drop scroll bar to `z-40` so it stays below Header/Modal/Back-to-top.
3. **TrustBadges marquee overflow** — The marquee track causes horizontal scrollbar flash on load. Wrap in `overflow-hidden` and add `min-w-0` to the flex track; make sure the animation keyframes exist and are scanned.
4. **Mobile overflow / fixed-height clipping** — `PhoneMockupSection` and `AssessmentGrader` use large fixed/min heights; reduce or replace with responsive values (`min-h-[auto] lg:min-h-[460px]` style) so content isn't clipped on small screens.
5. **Button consistency** — Standardize primary CTAs to the brand orange (`bg-[#e05934]` / `text-white` / `rounded-full`) in Hero, Footer, and ContactModal submit.
6. **Decorative accessibility noise** — Add `aria-hidden="true"` to Hero inline SVG and Footer letter-spanned "VidyaAI" text so screen readers don't read them as separate characters.
7. **Section IDs** — Ensure every section referenced by Header/Footer has a matching `id`:
   - Hero: `#home`
   - WhatVidyaEnables: `#features`
   - AssessmentGrader: `#teachers`
   - StandsOut: `#solutions`
   - SecurityPrivacy: `#security`
   - LeadersGain: `#about`
   - FAQ: `#faqs`
   - Footer: `#careers`
   - (remove `#blogs` from nav or point it at FAQ)
8. **Back-to-top threshold** — Raise trigger from 500 px to 1200 px so it doesn't appear while still in Hero.
9. **Footer dead links** — Keep social/partner links as `#` but add `aria-label` and `rel` attributes so they don't look broken in code audit; replace `#` with plausible placeholders or keep as-is (out of scope for real URLs).
10. **ContactModal focus UX** — On open, move focus to the first input; close modal when "Submit Another Inquiry" is clicked so users aren't trapped.

Verify:
- `pnpm lint` passes (or at least no new errors).
- `pnpm build` compiles the frontend.
- Search the repo for `#blogs` and `z-[9999]` to confirm cleanup.

## Out of scope (to avoid scope creep)
- Replacing all 200+ hardcoded color literals with CSS variables.
- Adding real backend contact-form submission.
- Swapping Unsplash images for local assets.
- Full WCAG audit beyond the listed items.

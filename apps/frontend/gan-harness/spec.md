# VidyaAI UI Redesign Spec

## Reference Design Analysis (from screenshots)

### Brand & Color System
- **Brand color**: Warm orange `#E8531D` / `#F97316` (VidyaAI logo orange)
- **Background**: Light/warm white `#F8F7F4` — NOT dark mode
- **Sidebar bg**: Pure white `#FFFFFF` with subtle shadow
- **Card bg**: White `#FFFFFF` with `1px solid #E5E7EB` borders
- **Text primary**: `#111827` (near-black)
- **Text secondary**: `#6B7280` (gray-500)
- **Active nav**: Orange pill `#FFF0E8` background with orange text
- **Accent**: Orange `#E8531D` for CTAs, badges, active states

### Layout: Sidebar + Main Content (NOT top navbar)
```
[Sidebar 220px fixed] | [Top bar 64px] | [Main content area]
```

**Sidebar structure:**
- VidyaAI logo (orange flame/book icon + "VidyaAI" text) at top
- "+ Create Assignment" orange pill button
- Nav items: Home, My Groups, Assignments (active), AI Teacher's Toolkit, My Library
- Settings at bottom
- School avatar + name + city at very bottom

**Top bar:**
- Breadcrumb: "Assignment" 
- Right: Bell icon + Avatar + "John Doe" dropdown

### Screen 1: Empty State (Assignments page, no data)
- Large centered illustration of search/magnifying glass with red X
- "No assignments yet" heading
- Subtext: "Create your first assignment to start collecting and grading student submissions..."
- "+ Create Your First Assignment" black rounded button

### Screen 2: Filled Assignments List
- "Assignments" heading + "Manage and create assignments for your classes." subtext
- Filter By dropdown + Search Assignment input (side by side)
- Assignment cards in 2-column grid:
  - White card with border
  - Bold title "Quiz on Electricity"
  - "Assigned on: 20-08-2025" and "Due: 21-06-2025" meta
  - 3-dot menu (⋮) with "View Assignment" / "Delete" dropdown
- "+ Create Assignment" floating button at bottom center

### Screen 3: Create Assignment (Multi-step form)
**Step progress bar** at top (thin line, orange filled)

**Page structure:**
- "Create Assignment" heading + "Set up a new assignment for your students."
- Two main sections:
  1. File upload zone (dashed border box): "Choose a file or drag & drop it here (PDF, PNG, upto 10mb)" + "Browse Files" button
  2. "Upload images of your preferred document/image" note

**Form fields:**
- Due Date: Date picker input (DD-MM-YYYY format with calendar icon)
- Question Type: 
  - Dropdown selector (e.g., "Multiple Choice Questions")
  - "No. of Questions" counter (- 4 +)
  - Marks counter (- 1 +)
  - X to remove row
  - Repeat rows for: Short Questions, Diagram/Graph-Based Questions, Numerical Problems
  - "+ Add Question Type" button
  - Total Questions: 25 / Total Marks: 60 summary
- Additional Information textarea: placeholder "e.g. Generate a question paper for 3 hour exam duration..."
- Navigation: "← Previous" | "Next →" buttons

### Screen 4: Assignment Output (Paper View)
- Top bar has "AI Teacher's Toolkit" active in sidebar
- Blue info banner: "Certainly, Lakshya! Here are customized Question Paper..."
- "Download as PDF" button (white, border)
- Paper content: 
  - School name header: "Delhi Public School, Sector-4, Bokaro"
  - Subject + Class
  - Time/Marks bar
  - Instructions
  - Sections with numbered questions
  - Answer key at bottom

## Design Tokens to Implement

```css
--brand-orange: #E8531D;
--brand-orange-light: #FFF0E8;
--brand-orange-hover: #D44816;
--bg-page: #F8F7F4;
--bg-sidebar: #FFFFFF;
--bg-card: #FFFFFF;
--border: #E5E7EB;
--text-primary: #111827;
--text-secondary: #6B7280;
--text-muted: #9CA3AF;
```

## Components to Build/Replace

1. **Sidebar** — Replace top Navbar with fixed left sidebar (220px)
2. **AppShell** — Sidebar + TopBar + Main layout wrapper  
3. **AssignmentCard** — White card, border, 2-col grid, 3-dot menu
4. **EmptyState** — Illustration + CTA button
5. **CreateAssignmentForm** — Redesigned with file upload, question type rows
6. **PaperViewer** — Clean white paper with download banner

## Critical Design Principles
- Light theme throughout (NOT dark)
- Orange brand color (#E8531D) for all interactive elements
- Clean, professional educator tool aesthetic
- Responsive: sidebar collapses to bottom tab bar on mobile
- Smooth transitions between states

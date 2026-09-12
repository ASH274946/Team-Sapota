/**
 * Unit tests for buildLessonPlanHtml() and generateLessonPlanPdf() contract.
 *
 * Coverage targets:
 *   - HTML structure (DOCTYPE, <html>, <head>, <body>)
 *   - A4 @page declaration
 *   - All required metadata fields (school, title, subject, grade, duration)
 *   - Optional fields (section, teacher, date, generatedAt) — present vs absent
 *   - Learning objectives — multi-line, single-line, empty
 *   - Activities — string[], ILessonPlanActivity[], empty
 *   - Assessments — populated, empty
 *   - Reference materials — present vs absent
 *   - HTML escaping for XSS-relevant characters (<, >, &, ", ')
 *   - Undefined/null tolerance on all optional fields
 */

import { describe, it, expect } from 'vitest';
import { buildLessonPlanHtml } from '../services/pdf.service';
import type { ILessonPlanData } from '../types/lesson-plan.types';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeBase(): ILessonPlanData {
  return {
    id: 'test-123',
    title: 'Introduction to Photosynthesis',
    subject: 'Biology',
    grade: 'Class IX',
    duration: '45 min',
    objectives: 'Understand chlorophyll\nDescribe the light reaction',
    activities: ['Warm-up discussion', 'Lab experiment'],
    assessments: ['Exit quiz', 'Observation worksheet'],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('buildLessonPlanHtml', () => {
  // 1. Basic HTML structure
  it('produces a valid HTML5 document', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</html>');
  });

  // 2. A4 @page rule
  it('includes A4 @page size declaration', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toMatch(/size:\s*A4/);
  });

  // 3. Required metadata rendered in the header
  it('renders title in the document title and header', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('<title>Introduction to Photosynthesis</title>');
    expect(html).toContain('Introduction to Photosynthesis');
  });

  it('renders subject in the header', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('Biology');
  });

  it('renders grade in the header', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('Class IX');
  });

  it('renders duration in the header', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('45 min');
  });

  // 4. Default school name when not provided
  it('uses "VidyaAI" as default school name when schoolName is absent', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('VidyaAI');
  });

  it('uses provided schoolName when given', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), schoolName: 'Sunrise Academy' });
    expect(html).toContain('Sunrise Academy');
  });

  // 5. Optional: section + teacher
  it('renders section when provided', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), section: 'Section B' });
    expect(html).toContain('Section B');
  });

  it('does not include teacher row when teacherName is absent', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).not.toContain('lp-meta-label">Teacher');
  });

  it('renders teacher when teacherName is provided', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), teacherName: 'Dr. Patel' });
    expect(html).toContain('Dr. Patel');
  });

  // 6. Learning objectives — multi-line
  it('renders each objective as a list item', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('Understand chlorophyll');
    expect(html).toContain('Describe the light reaction');
  });

  it('renders empty objectives fallback text', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), objectives: '' });
    expect(html).toContain('No objectives specified.');
  });

  it('renders single-line objectives without splitting spuriously', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), objectives: 'Learn osmosis' });
    expect(html).toContain('Learn osmosis');
  });

  // 7. Activities — string array
  it('renders string activities as a table', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('lp-timeline');
    expect(html).toContain('Warm-up discussion');
    expect(html).toContain('Lab experiment');
  });

  it('renders empty activities fallback text', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), activities: [] });
    expect(html).toContain('No activities specified.');
  });

  // 8. Activities — ILessonPlanActivity objects
  it('renders structured ILessonPlanActivity objects with duration chip', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      activities: [
        { title: 'Introduction', durationMinutes: 10, description: 'Overview of topic' },
        { title: 'Lab Session', durationMinutes: 25 },
      ],
    });
    expect(html).toContain('Introduction');
    expect(html).toContain('10 min');
    expect(html).toContain('Overview of topic');
    expect(html).toContain('Lab Session');
    expect(html).toContain('25 min');
  });

  it('renders activities without durationMinutes as em-dash', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      activities: [{ title: 'Open discussion' }],
    });
    expect(html).toContain('Open discussion');
    expect(html).toContain('&mdash;');
  });

  // 9. Assessments
  it('renders assessment items as list items', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('Exit quiz');
    expect(html).toContain('Observation worksheet');
  });

  it('renders empty assessments fallback text', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), assessments: [] });
    expect(html).toContain('No assessments specified.');
  });

  // 10. Reference materials
  it('renders reference materials section when provided', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      referenceMaterials: ['NCERT Biology Ch. 13', 'Khan Academy video'],
    });
    expect(html).toContain('Reference Materials');
    expect(html).toContain('NCERT Biology Ch. 13');
    expect(html).toContain('Khan Academy video');
  });

  it('omits reference materials section when array is empty', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), referenceMaterials: [] });
    expect(html).not.toContain('Reference Materials');
  });

  it('omits reference materials section when field is undefined', () => {
    const html = buildLessonPlanHtml(makeBase()); // no referenceMaterials set
    expect(html).not.toContain('Reference Materials');
  });

  // 11. HTML escaping — XSS prevention
  it('escapes < and > in title', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), title: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes & in subject', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), subject: 'Math & Science' });
    expect(html).toContain('Math &amp; Science');
    expect(html).not.toContain('Math & Science');
  });

  it('escapes double-quotes in schoolName', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), schoolName: 'My "Academy"' });
    expect(html).toContain('My &quot;Academy&quot;');
  });

  it('escapes single-quotes in objectives', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), objectives: "Student's learning" });
    expect(html).toContain('&#39;');
  });

  it('escapes HTML in activity titles', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      activities: ['<b>Group</b> discussion'],
    });
    expect(html).not.toContain('<b>Group</b>');
    expect(html).toContain('&lt;b&gt;Group&lt;/b&gt;');
  });

  it('escapes HTML in assessment strings', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      assessments: ['<img src=x onerror=alert(1)>'],
    });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  // 12. Null/undefined tolerance
  it('does not crash when optional fields are undefined', () => {
    const minimal: ILessonPlanData = {
      id: 'x',
      title: 'Test',
      subject: 'Math',
      grade: '10',
      duration: '30',
      objectives: '',
      activities: [],
      assessments: [],
    };
    expect(() => buildLessonPlanHtml(minimal)).not.toThrow();
  });

  it('handles undefined schoolName gracefully', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), schoolName: undefined });
    expect(html).toContain('VidyaAI');
  });

  it('handles undefined teacherName gracefully', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), teacherName: undefined });
    // teacher block must not appear
    expect(html).not.toMatch(/lp-meta-label">Teacher/);
  });

  it('handles undefined referenceMaterials gracefully', () => {
    const html = buildLessonPlanHtml({ ...makeBase(), referenceMaterials: undefined });
    expect(html).not.toContain('Reference Materials');
  });

  // 13. Sections appear in the correct order
  it('renders sections in the correct order: objectives → activities → assessments', () => {
    const html = buildLessonPlanHtml(makeBase());
    const objIdx = html.indexOf('Learning Objectives');
    const actIdx = html.indexOf('Lesson Timeline');
    const assIdx = html.indexOf('Assessment');
    expect(objIdx).toBeLessThan(actIdx);
    expect(actIdx).toBeLessThan(assIdx);
  });

  // 14. Custom branding, prerequisites, materials, notes
  it('renders school logo image tag safely when schoolLogoUrl is provided', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      schoolLogoUrl: 'https://example.com/logo.png',
    });
    expect(html).toContain('<img src="https://example.com/logo.png" alt="School Logo" class="lp-logo"');
    expect(html).toContain('onerror="this.style.display=\'none\'"');
  });

  it('renders prerequisites section when provided', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      prerequisites: ['Basic cell structure knowledge', 'Understanding of light spectrum'],
    });
    expect(html).toContain('Prerequisites &amp; Prior Knowledge');
    expect(html).toContain('Basic cell structure knowledge');
  });

  it('renders teaching materials section when provided', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      materials: ['Microscope', 'Beaker and water', 'Elodea leaf sample'],
    });
    expect(html).toContain('Teaching Materials &amp; Resources');
    expect(html).toContain('Microscope');
  });

  it('renders teacher notes section when provided', () => {
    const html = buildLessonPlanHtml({
      ...makeBase(),
      notes: 'Ensure safety goggles are worn during the lab session.',
    });
    expect(html).toContain('Teacher Notes');
    expect(html).toContain('Ensure safety goggles are worn during the lab session.');
  });

  // 15. Footer
  it('renders the VidyaAI footer', () => {
    const html = buildLessonPlanHtml(makeBase());
    expect(html).toContain('Generated by VidyaAI Faculty Copilot');
  });
});

import fs from 'fs';
import type { IGeneratedPaper } from '../types/models.types';
import type { ILessonPlanData, ILessonPlanActivity } from '../types/lesson-plan.types';
import { logger } from '../utils/logger';
import { validatePaperOrThrow } from '../validators/paper.validator';
import { getPdfStorage } from './storage';

// ─────────────────────────────────────────────────────────────────────────────
// Question Paper PDF (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePdf(
  paper: IGeneratedPaper,
  type: 'paper' | 'key' | 'both' = 'both'
): Promise<{ pdfPath: string; pdfUrl: string; pdfBuffer?: Buffer }> {
  validatePaperOrThrow(paper);

  // Dynamic import to avoid loading Puppeteer at startup
  const puppeteer = await import('puppeteer-core');

  const html = buildPaperHtml(paper, type);

  const storage = getPdfStorage();
  const suffix = type === 'both' ? '' : `-${type}`;
  const fileName = `paper-${paper.assignmentId.toString()}-${Date.now()}${suffix}.pdf`;
  const storageKey = `question-papers/${fileName}`;

  let browser;
  try {
    browser = await launchBrowser(puppeteer);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const meta = paper.canonicalMetadata;
    const headerSchool = escapeHtml(meta?.schoolName?.trim() || 'School Examination');
    const headerSubject = escapeHtml(meta?.subject?.trim() || paper.title);
    const headerClass = meta?.className?.trim()
      ? `<span style="margin-left:8px;">| Class ${escapeHtml(meta.className)}</span>`
      : '';

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      timeout: 60_000,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:9px;font-family:'Times New Roman',serif;color:#444;padding:0 15mm;display:flex;justify-content:space-between;">
          <span>${headerSchool}</span>
          <span>${headerSubject}${headerClass}</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:9px;font-family:Arial,sans-serif;color:#666;padding:0 15mm;text-align:center;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    });

    const pdfUrl = await storage.save(storageKey, pdfBuffer, 'application/pdf');
    const pdfPath = storageKey;
    logger.info(`Question paper PDF generated and saved to R2: ${storageKey}`);
    return { pdfPath, pdfUrl, pdfBuffer };
  } finally {
    if (browser) await browser.close();
  }
}

function buildPaperHtml(paper: IGeneratedPaper, type: 'paper' | 'key' | 'both'): string {
  const meta = paper.canonicalMetadata;
  const schoolName = meta?.schoolName?.trim() || 'School Examination';
  const examTitle = paper.title?.trim() || 'Question Paper';
  const subject = meta?.subject?.trim() || examTitle;
  const className = meta?.className?.trim() || '';
  const duration = meta?.durationMinutes || paper.duration || 45;
  const maxMarks = meta?.generatedMarks || paper.totalMarks;
  
  let sectionsHtml = '';
  if (type === 'paper' || type === 'both') {
    sectionsHtml = paper.sections
      .map(
        (section: any, sIdx: number) => `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          ${section.instruction ? `<p class="instruction">${escapeHtml(section.instruction)}</p>` : ''}
          <ol class="questions" start="${getStartNumber(paper, sIdx)}">
            ${section.questions
              .map(
                (q: any) => `
              <li class="question">
                <div class="q-header">
                  <span class="q-text"><span class="difficulty">[${formatDifficulty(q.difficulty)}]</span> ${escapeHtml(q.question)}</span>
                  <span class="q-marks">[${formatMarks(q.marks)}]</span>
                </div>
                ${q.type === 'mcq' && q.options
                  ? `<ul class="options">${q.options.map((o: any) => `<li><strong>${escapeHtml(o.key)}.</strong> ${escapeHtml(o.text)}</li>`).join('')}</ul>`
                  : ''}`
              )
              .join('')}
          </ol>
        </section>`
      )
      .join('');
  }

  let answerHtml = '';
  if (type === 'key' || type === 'both') {
    answerHtml = buildAnswerKeyHtml(paper, type);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.4; }
  .paper { width: 100%; padding: 0; }
  .header { text-align: center; margin-bottom: 4mm; }
  .school { font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; }
  .exam-title { font-size: 13pt; font-weight: 700; margin-top: 1mm; }
  .class-line { font-size: 11pt; font-weight: 700; margin-top: 1mm; }
  .meta-row { display: flex; justify-content: space-between; font-size: 11pt; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 2mm; margin: 3mm 0; }
  .instruction-top { font-size: 11pt; font-weight: 700; margin-bottom: 3mm; }
  .student-info { display: grid; grid-template-columns: 1.7fr 1fr 1.1fr; gap: 4mm; margin-bottom: 4mm; font-weight: 700; }
  .line { display: inline-block; min-width: 30mm; border-bottom: 1px solid #000; height: 12px; vertical-align: baseline; }
  .section { margin-top: 5mm; }
  .section h2 { text-align: center; font-size: 13pt; margin-bottom: 3mm; font-weight: 800; }
  .instruction { font-size: 11pt; font-style: italic; margin-bottom: 2mm; }
  .questions { padding-left: 6mm; margin: 0; }
  .question { margin-bottom: 3mm; padding-left: 1mm; page-break-inside: avoid; break-inside: avoid; }
  .q-header { display: flex; align-items: flex-start; gap: 3mm; }
  .q-text { flex: 1; }
  .difficulty { font-weight: 400; color: #555; font-size: 9.5pt; }
  .q-marks { font-weight: 400; white-space: nowrap; font-size: 10.5pt; }
  .options { list-style: none; padding-left: 5mm; margin: 1mm 0 0; }
  .options li { margin-bottom: 0.5mm; }
  .end-note { font-weight: 800; text-align: center; border-top: 2px solid #000; padding-top: 2mm; margin-top: 5mm; }
  .answer-key { margin-top: 5mm; padding-top: 3mm; border-top: 2px solid #000; }
  .answer-key h2 { font-size: 14pt; margin-bottom: 3mm; text-align: center; font-weight: 800; }
  .answer-key ol { margin: 0; padding-left: 6mm; }
  .answer-key li { margin-bottom: 2.5mm; page-break-inside: avoid; break-inside: avoid; }
  .answer-key-standalone { margin-top: 0; padding-top: 0; border-top: none; }
  ${type === 'both' ? '.answer-key { page-break-before: always; break-before: page; }' : ''}
</style>
</head>
<body>
  <main class="paper">
    <div class="header">
      <div class="school">${escapeHtml(schoolName)}</div>
      <div class="exam-title">${escapeHtml(examTitle)}${type === 'key' ? ' - Answer Key' : ''}</div>
      <div class="class-line">Subject: ${escapeHtml(subject)}${className ? ` &nbsp;|&nbsp; Class: ${escapeHtml(className)}` : ''}</div>
    </div>
    ${type === 'paper' || type === 'both' ? `
    <div class="meta-row">
      <span>Time Allowed: ${duration} minutes</span>
      <span>Maximum Marks: ${maxMarks}</span>
    </div>
    <p class="instruction-top">All questions are compulsory unless stated otherwise.</p>
    <div class="student-info">
      <div>Name: <span class="line"></span></div>
      <div>Roll Number: <span class="line"></span></div>
      <div>Section: <span class="line"></span></div>
    </div>
    ` : ''}
    ${sectionsHtml}
    ${type === 'paper' || type === 'both' ? '<p class="end-note">End of Question Paper</p>' : ''}
    ${answerHtml}
  </main>
</body>
</html>`;
}

function getStartNumber(paper: IGeneratedPaper, sectionIndex: number): number {
  let total = 1;
  for (let i = 0; i < sectionIndex; i++) {
    total += paper.sections[i]?.questions.length ?? 0;
  }
  return total;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMarks(marks: number): string {
  return `${marks} ${marks === 1 ? 'Mark' : 'Marks'}`;
}

function formatDifficulty(value: string): string {
  if (value === 'hard') return 'Challenging';
  if (value === 'medium') return 'Moderate';
  return 'Easy';
}

function buildAnswerKeyHtml(paper: IGeneratedPaper, type: 'paper' | 'key' | 'both'): string {
  const answers = paper.sections
    .flatMap((section: any) => section.questions)
    .map((question: any, index: number) => ({ number: index + 1, question: question.question, answer: question.answer }))
    .filter((item: any) => item.answer?.text);

  if (answers.length === 0) return '';

  const classList = type === 'key' ? 'answer-key answer-key-standalone' : 'answer-key';

  return `
    <section class="${classList}">
      <h2>Answer Key</h2>
      <ol>
        ${answers
          .map(({ question, answer }: any) => `
            <li>
              <strong>Q: ${escapeHtml(question)}</strong><br>
              <strong>A:</strong> ${escapeHtml(answer?.text)}
              ${answer?.explanation ? `<br><span style="font-style: italic; color: #555;">Explanation: ${escapeHtml(answer.explanation)}</span>` : ''}
            </li>
          `)
          .join('')}
      </ol>
    </section>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson Plan PDF — completely isolated from Question Paper templates above
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a Puppeteer A4 PDF for the given lesson plan data.
 * Reuses the existing browser launch infrastructure.
 * Does NOT touch or modify any Question Paper template.
 */
export async function generateLessonPlanPdf(
  data: ILessonPlanData,
): Promise<{ pdfPath: string; pdfUrl: string }> {
  // Dynamic import — avoids loading Puppeteer at startup
  const puppeteer = await import('puppeteer-core');

  const html = buildLessonPlanHtml(data);
  const storage = getPdfStorage();
  const safeName = (data.title || 'lesson-plan')
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .slice(0, 60);
  const fileName = `lesson-plan-${safeName}-${Date.now()}.pdf`;
  const storageKey = `lesson-plans/${fileName}`;

  let browser;
  try {
    browser = await launchBrowser(puppeteer);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const headerSchool = escapeHtml(data.schoolName?.trim() || 'VidyaAI');
    const headerSubject = escapeHtml(data.subject?.trim() || '');
    const headerGrade = data.grade ? ` | ${escapeHtml(data.grade)}` : '';

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '22mm', right: '15mm', bottom: '18mm', left: '15mm' },
      printBackground: true,
      timeout: 60_000,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:9px;font-family:'Segoe UI',Arial,sans-serif;color:#555;padding:0 15mm;display:flex;justify-content:space-between;">
          <span>${headerSchool}</span>
          <span>${headerSubject}${headerGrade}</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:9px;font-family:Arial,sans-serif;color:#888;padding:0 15mm;text-align:center;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    });

    const pdfUrl = await storage.save(storageKey, pdfBuffer, 'application/pdf');
    const pdfPath = storageKey;

    logger.info(`[PDF:LESSON_PLAN] Generated and saved to R2: ${storageKey}`);
    return { pdfPath, pdfUrl };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Builds an A4-ready HTML string for a lesson plan PDF.
 * This function is completely independent from buildPaperHtml().
 * It must produce deterministic, escape-safe, HTML-injection-free output.
 */
export function buildLessonPlanHtml(data: ILessonPlanData): string {
  const schoolName = escapeHtml(data.schoolName?.trim() || 'VidyaAI');
  const schoolLogoUrl = data.schoolLogoUrl ? escapeHtml(data.schoolLogoUrl.trim()) : '';
  const title = escapeHtml(data.title?.trim() || 'Lesson Plan');
  const subject = escapeHtml(data.subject?.trim() || '');
  const grade = escapeHtml(data.grade?.trim() || '');
  const section = data.section ? escapeHtml(data.section.trim()) : '';
  const teacher = data.teacherName ? escapeHtml(data.teacherName.trim()) : '';
  const date = data.date
    ? escapeHtml(data.date)
    : new Date().toLocaleDateString('en-IN');
  const duration = escapeHtml(data.duration?.trim() || '');
  const generatedAt = data.generatedAt
    ? escapeHtml(data.generatedAt)
    : new Date().toLocaleDateString('en-IN');

  // Objectives — support multi-line string
  const objectiveLines = (data.objectives || '')
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean);

  const objectivesHtml =
    objectiveLines.length > 0
      ? `<ul class="lp-list">${objectiveLines.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>`
      : `<p class="lp-empty">No objectives specified.</p>`;

  // Prerequisites
  const prereqLines = (data.prerequisites || [])
    .map((p) => String(p).trim())
    .filter(Boolean);
  const prereqHtml =
    prereqLines.length > 0
      ? `<section class="lp-section">
          <h2 class="lp-section-title">&#128268; Prerequisites &amp; Prior Knowledge</h2>
          <ul class="lp-list">${prereqLines.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        </section>`
      : '';

  // Materials
  const materialLines = (data.materials || [])
    .map((m) => String(m).trim())
    .filter(Boolean);
  const materialsHtml =
    materialLines.length > 0
      ? `<section class="lp-section">
          <h2 class="lp-section-title">&#128214; Teaching Materials &amp; Resources</h2>
          <ul class="lp-list">${materialLines.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>
        </section>`
      : '';

  // Activities — support array of ILessonPlanActivity or string[]
  const activitiesHtml = buildActivitiesHtml(data.activities);

  // Assessments
  const assessmentLines = (data.assessments || [])
    .map((a) => (typeof a === 'string' ? a.trim() : String(a)).trim())
    .filter(Boolean);

  const assessmentsHtml =
    assessmentLines.length > 0
      ? `<ul class="lp-list">${assessmentLines.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
      : `<p class="lp-empty">No assessments specified.</p>`;

  // Notes
  const notesHtml =
    data.notes && data.notes.trim()
      ? `<section class="lp-section">
          <h2 class="lp-section-title">&#128221; Teacher Notes</h2>
          <p style="white-space: pre-wrap; color: #333;">${escapeHtml(data.notes.trim())}</p>
        </section>`
      : '';

  // Reference materials
  const refHtml =
    data.referenceMaterials && data.referenceMaterials.length > 0
      ? `<section class="lp-section">
          <h2 class="lp-section-title">&#128218; Reference Materials</h2>
          <ul class="lp-list">${data.referenceMaterials.map((r) => `<li>${escapeHtml(String(r))}</li>`).join('')}</ul>
        </section>`
      : '';

  const logoImgHtml = schoolLogoUrl
    ? `<img src="${schoolLogoUrl}" alt="School Logo" class="lp-logo" onerror="this.style.display='none'" />`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page {
    size: A4;
    margin: 20mm 16mm 22mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a2e;
    line-height: 1.6;
    background: #fff;
  }
  .lp-wrapper { width: 100%; max-width: 100%; }

  /* Header */
  .lp-header {
    background: #1a237e;
    color: #fff;
    padding: 10mm 8mm 8mm;
    border-radius: 4px 4px 0 0;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
    gap: 2mm;
  }
  .lp-header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .lp-logo { max-height: 48px; max-width: 120px; object-fit: contain; background: #fff; border-radius: 4px; padding: 2px; }
  .lp-school { font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 2mm; }
  .lp-title  { font-size: 13pt; font-weight: 700; margin-bottom: 3mm; }
  .lp-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3mm;
    margin-top: 4mm;
    font-size: 9pt;
  }
  .lp-meta-item {
    background: rgba(255,255,255,0.12);
    border-radius: 3px;
    padding: 2mm 3mm;
  }
  .lp-meta-label {
    font-weight: 600;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    opacity: 0.8;
  }
  .lp-meta-value { font-size: 10pt; font-weight: 700; margin-top: 1mm; }

  /* Sections */
  .lp-section {
    margin-top: 5mm;
    padding: 5mm 6mm;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    page-break-inside: avoid;
  }
  .lp-section-title {
    font-size: 12pt;
    font-weight: 800;
    color: #1a237e;
    margin-bottom: 3mm;
    padding-bottom: 2mm;
    border-bottom: 2px solid #e8eaf6;
  }
  .lp-list { list-style: disc; padding-left: 7mm; color: #333; }
  .lp-list li { margin-bottom: 1.5mm; }
  .lp-empty { color: #999; font-style: italic; font-size: 10pt; }

  /* Activity Timeline */
  .lp-timeline { width: 100%; border-collapse: collapse; margin-top: 2mm; }
  .lp-timeline th {
    background: #e8eaf6;
    color: #1a237e;
    font-size: 9pt;
    font-weight: 700;
    text-align: left;
    padding: 2mm 3mm;
    border: 1px solid #c5cae9;
  }
  .lp-timeline td {
    font-size: 10pt;
    padding: 2mm 3mm;
    border: 1px solid #e0e0e0;
    vertical-align: top;
  }
  .lp-timeline tr:nth-child(even) td { background: #f5f5f5; }
  .lp-activity-title { font-weight: 600; color: #1a237e; }
  .lp-activity-desc  { color: #555; font-size: 9.5pt; margin-top: 1mm; }
  .lp-duration-chip  {
    background: #e8eaf6;
    color: #1a237e;
    border-radius: 10px;
    padding: 0.5mm 2mm;
    font-size: 8.5pt;
    font-weight: 700;
    white-space: nowrap;
  }

  /* Footer */
  .lp-footer {
    margin-top: 6mm;
    padding-top: 3mm;
    border-top: 1px solid #e0e0e0;
    font-size: 8pt;
    color: #999;
    display: flex;
    justify-content: space-between;
    page-break-inside: avoid;
  }
</style>
</head>
<body>
<div class="lp-wrapper">
  <div class="lp-header">
    <div class="lp-header-top">
      <div>
        <div class="lp-school">${schoolName}</div>
        <div class="lp-title">${title}</div>
      </div>
      ${logoImgHtml}
    </div>
    <div class="lp-meta-grid">
      <div class="lp-meta-item">
        <div class="lp-meta-label">Subject</div>
        <div class="lp-meta-value">${subject}</div>
      </div>
      <div class="lp-meta-item">
        <div class="lp-meta-label">Grade / Class</div>
        <div class="lp-meta-value">${grade}${section ? ` &mdash; ${section}` : ''}</div>
      </div>
      <div class="lp-meta-item">
        <div class="lp-meta-label">Duration</div>
        <div class="lp-meta-value">${duration}</div>
      </div>
      ${teacher ? `
      <div class="lp-meta-item">
        <div class="lp-meta-label">Teacher</div>
        <div class="lp-meta-value">${teacher}</div>
      </div>` : ''}
      <div class="lp-meta-item">
        <div class="lp-meta-label">Date</div>
        <div class="lp-meta-value">${date}</div>
      </div>
      <div class="lp-meta-item">
        <div class="lp-meta-label">Generated</div>
        <div class="lp-meta-value">${generatedAt}</div>
      </div>
    </div>
  </div>

  <section class="lp-section">
    <h2 class="lp-section-title">Learning Objectives</h2>
    ${objectivesHtml}
  </section>

  ${prereqHtml}
  ${materialsHtml}

  <section class="lp-section">
    <h2 class="lp-section-title">Lesson Timeline &amp; Activities</h2>
    ${activitiesHtml}
  </section>

  <section class="lp-section">
    <h2 class="lp-section-title">Assessment &amp; Evaluation</h2>
    ${assessmentsHtml}
  </section>

  ${notesHtml}
  ${refHtml}

  <div class="lp-footer">
    <span>Generated by VidyaAI Faculty Copilot</span>
    <span>${schoolName} &mdash; ${title}</span>
  </div>
</div>
</body>
</html>`;
}

/** Renders the activities array as a structured HTML timeline table. */
function buildActivitiesHtml(
  activities: ILessonPlanActivity[] | string[] | undefined,
): string {
  if (!activities || activities.length === 0) {
    return '<p class="lp-empty">No activities specified.</p>';
  }

  const rows = activities
    .map((activity, idx) => {
      if (typeof activity === 'string') {
        return `<tr>
          <td style="text-align:center;color:#888;font-size:9pt;">${idx + 1}</td>
          <td><span class="lp-activity-title">${escapeHtml(activity.trim())}</span></td>
          <td>&mdash;</td>
        </tr>`;
      }
      const a = activity as ILessonPlanActivity;
      const actTitle = escapeHtml(a.title?.trim() || `Activity ${idx + 1}`);
      const desc = a.description
        ? `<div class="lp-activity-desc">${escapeHtml(a.description.trim())}</div>`
        : '';
      const dur = a.durationMinutes
        ? `<span class="lp-duration-chip">${a.durationMinutes} min</span>`
        : '&mdash;';

      return `<tr>
        <td style="text-align:center;color:#888;font-size:9pt;">${idx + 1}</td>
        <td><span class="lp-activity-title">${actTitle}</span>${desc}</td>
        <td>${dur}</td>
      </tr>`;
    })
    .join('');

  return `<table class="lp-timeline">
    <thead>
      <tr>
        <th style="width:8%">#</th>
        <th style="width:75%">Activity</th>
        <th style="width:17%">Duration</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

/**
 * Helper launcher for puppeteer-core across environments (Production, Docker, Windows/Linux/Mac local dev).
 */
async function launchBrowser(puppeteer: any): Promise<any> {
  let executablePath = process.env.CHROMIUM_PATH;

  if (!executablePath && process.env.NODE_ENV === 'production') {
    try {
      const sparticuz = await import('@sparticuz/chromium');
      executablePath = await sparticuz.default.executablePath();
    } catch {
      // ignore
    }
  }

  // Local fallback: search standard OS paths for Chrome/Edge if executablePath is undefined
  if (!executablePath) {
    if (process.platform === 'win32') {
      const winPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      ];
      for (const p of winPaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    } else if (process.platform === 'darwin') {
      const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (fs.existsSync(macPath)) executablePath = macPath;
    } else if (process.platform === 'linux') {
      const linuxPaths = ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome'];
      for (const p of linuxPaths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    }
  }

  const launchOptions: any = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
    ],
    headless: true,
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  } else {
    launchOptions.channel = 'chrome';
  }

  return puppeteer.default.launch(launchOptions);
}

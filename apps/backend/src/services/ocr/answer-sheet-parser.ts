export interface ParsedAnswerItem {
  questionNumber: string;
  part?: string;
  questionText?: string;
  studentAnswer: string;
  workingSteps: string[];
  finalAnswer?: string;
  hasDiagram: boolean;
  unreadableSegmentsCount: number;
  confidence: number; // 0 - 100
}

export interface StructuredAnswerSheetResult {
  rawText: string;
  cleanedText: string;
  overallConfidence: number; // 0 - 100
  needsHumanReview: boolean;
  unreadableRegionsTotal: number;
  parsedQuestions: ParsedAnswerItem[];
  detectedSections: Array<{ name: string; questionNumbers: string[] }>;
}

/**
 * Regular expressions to detect varied handwritten answer sheet question numbers and delimiters.
 */
const QUESTION_HEADER_PATTERNS = [
  /^(?:[*_#\s-]*)(?:Question|Q\.?|Que\.?|Prob\.?|Problem)\s*([0-9]+|[a-zA-Z]+)(?:\s*[([]?([a-zA-Z0-9ivx]+)[)\]]?)?\s*[:.—)\s-]*(.*)$/i,
  /^(?:[*_#\s-]*)(?:Ans\.?|Answer|Sol\.?|Solution)\s*(?:to\s*)?(?:Question|Q\.?|Que\.?)?\s*([0-9]+|[a-zA-Z]+)(?:\s*[([]?([a-zA-Z0-9ivx]+)[)\]]?)?\s*[:.—)\s-]*(.*)$/i,
  /^(?:[*_#\s-]*)([0-9]{1,3})\s*[.)|]\s*[([]?([a-zA-Z0-9ivx]+)?[)\]]?\s*[:.—\s-]+(.*)$/i,
  /^(?:[*_#\s-]*)\(([a-zA-Z0-9ivx]+)\)\s*[:.—\s-]*(.*)$/i,
];

const SECTION_HEADER_PATTERNS = [
  /^(?:[*_#\s-]*)(?:Section|Part|Group)\s*([A-Z0-9]+|[IVXLCDM]+)\s*[:.—)\s-]*(.*)$/i,
];

/**
 * Parses raw handwritten OCR output into clean, structured question-answer pairs.
 */
export function parseAnswerSheetText(rawText: string): StructuredAnswerSheetResult {
  if (!rawText || !rawText.trim()) {
    return {
      rawText: '',
      cleanedText: '',
      overallConfidence: 0,
      needsHumanReview: true,
      unreadableRegionsTotal: 0,
      parsedQuestions: [],
      detectedSections: [],
    };
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const questions: ParsedAnswerItem[] = [];
  const sections: Array<{ name: string; questionNumbers: string[] }> = [];

  let currentSection = 'General';
  let currentQ: ParsedAnswerItem | null = null;
  let unreadableTotal = 0;

  for (const line of lines) {
    // 1. Count unreadable tags
    const unreadableMatches = line.match(/\[unreadable(?:\s+handwriting)?\]/gi) || [];
    unreadableTotal += unreadableMatches.length;

    // 2. Check for Section headers
    let isSection = false;
    for (const secPattern of SECTION_HEADER_PATTERNS) {
      const match = line.match(secPattern);
      if (match) {
        currentSection = `Section ${match[1]}`.trim();
        if (!sections.some((s) => s.name === currentSection)) {
          sections.push({ name: currentSection, questionNumbers: [] });
        }
        isSection = true;
        break;
      }
    }
    if (isSection) continue;

    // 3. Check for Question headers
    let matchedQNumber: string | null = null;
    let matchedPart: string | undefined;
    let remainingLineText = '';

    for (let pIdx = 0; pIdx < QUESTION_HEADER_PATTERNS.length; pIdx++) {
      const qPattern = QUESTION_HEADER_PATTERNS[pIdx];
      const match = line.match(qPattern);
      if (match) {
        if (pIdx === 3 || (line.startsWith('(') && match[1])) {
          // Sub-part e.g. "(b): ..." inherits current question base number
          const baseQMatch: RegExpMatchArray | null = currentQ ? currentQ.questionNumber.match(/^(Q[0-9]+)/i) : null;
          matchedQNumber = baseQMatch ? baseQMatch[1] : (currentQ ? currentQ.questionNumber : 'Q1');
          matchedPart = match[1];
          remainingLineText = match[2] || '';
        } else if (match[1]) {
          matchedQNumber = `Q${match[1]}`;
          matchedPart = match[2];
          remainingLineText = match[3] || '';
        }
        break;
      }
    }

    if (matchedQNumber) {
      // Finalize previous question
      if (currentQ) {
        finalizeQuestionItem(currentQ);
        questions.push(currentQ);
      }

      // Initialize new question block
      const fullQKey: string = matchedPart ? `${matchedQNumber}(${matchedPart})` : matchedQNumber;
      const unreadableInLine = (line.match(/\[unreadable(?:\s+handwriting)?\]/gi) || []).length;

      currentQ = {
        questionNumber: fullQKey,
        part: matchedPart,
        questionText: remainingLineText ? remainingLineText.trim() : undefined,
        studentAnswer: '',
        workingSteps: remainingLineText ? [remainingLineText.trim()] : [],
        hasDiagram: /\[Diagram:.*?\]/i.test(line),
        unreadableSegmentsCount: unreadableInLine,
        confidence: 90,
      };

      // Track under active section
      const activeSec = sections.find((s) => s.name === currentSection);
      if (activeSec && !activeSec.questionNumbers.includes(fullQKey)) {
        activeSec.questionNumbers.push(fullQKey);
      }
      continue;
    }

    // 4. Accumulate content into current question or general introduction
    if (currentQ) {
      if (/\[Diagram:.*?\]/i.test(line)) {
        currentQ.hasDiagram = true;
      }
      const unreadableInLine = (line.match(/\[unreadable(?:\s+handwriting)?\]/gi) || []).length;
      currentQ.unreadableSegmentsCount += unreadableInLine;
      currentQ.workingSteps.push(line);
    } else {
      // First lines before any explicit question header (e.g. general working or unlabelled Q1)
      currentQ = {
        questionNumber: 'Q1',
        studentAnswer: '',
        workingSteps: [line],
        hasDiagram: /\[Diagram:.*?\]/i.test(line),
        unreadableSegmentsCount: unreadableMatches.length,
        confidence: 85,
      };
    }
  }

  // Finalize last question
  if (currentQ) {
    finalizeQuestionItem(currentQ);
    questions.push(currentQ);
  }

  // Calculate overall confidence (0 - 100)
  const totalSteps = questions.reduce((acc, q) => acc + q.workingSteps.length, 0);
  const unreadableRatio = totalSteps > 0 ? unreadableTotal / totalSteps : 0;
  let overallConfidence = Math.max(20, Math.min(98, Math.round(95 - unreadableRatio * 80)));

  if (rawText.length < 30) {
    overallConfidence = Math.min(overallConfidence, 40);
  }

  const needsHumanReview = overallConfidence < 70 || unreadableTotal >= 3;

  // Build clean unified representation
  const cleanedText = formatParsedAnswersForGrading(questions);

  return {
    rawText,
    cleanedText,
    overallConfidence,
    needsHumanReview,
    unreadableRegionsTotal: unreadableTotal,
    parsedQuestions: questions,
    detectedSections: sections,
  };
}

/**
 * Helper to compute answers and final lines from collected working steps.
 */
function finalizeQuestionItem(q: ParsedAnswerItem): void {
  const answerLines = q.workingSteps.filter(Boolean);
  q.studentAnswer = answerLines.join('\n');

  // Check if last line looks like a final answer statement (e.g., "Ans: 42 m/s" or "Therefore x = 5")
  if (answerLines.length > 0) {
    const lastLine = answerLines[answerLines.length - 1];
    if (/^(?:Therefore|Hence|Ans(?:wer)?|Total|Result|Final\s+Answer|x\s*=|y\s*=)\b/i.test(lastLine)) {
      q.finalAnswer = lastLine;
    }
  }

  // Calculate per-question confidence
  const stepCount = q.workingSteps.length;
  const unreadableInQ = q.unreadableSegmentsCount;
  if (stepCount > 0 && unreadableInQ > 0) {
    const penalty = Math.min(50, Math.round((unreadableInQ / stepCount) * 50));
    q.confidence = Math.max(30, 95 - penalty);
  }
}

/**
 * Formats parsed question-answer blocks into clean, structured Markdown for grading and display.
 */
export function formatParsedAnswersForGrading(questions: ParsedAnswerItem[]): string {
  if (!questions || questions.length === 0) return '';

  return questions
    .map((q) => {
      let block = `### ${q.questionNumber}`;
      if (q.questionText) {
        block += `: ${q.questionText}`;
      }
      block += `\n${q.studentAnswer}`;
      if (q.finalAnswer && q.studentAnswer !== q.finalAnswer) {
        block += `\n**Final Result:** ${q.finalAnswer}`;
      }
      if (q.unreadableSegmentsCount > 0) {
        block += `\n*[Note: ${q.unreadableSegmentsCount} unreadable segment(s) flagged for review]*`;
      }
      return block;
    })
    .join('\n\n---\n\n');
}

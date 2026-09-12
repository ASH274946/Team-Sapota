import { randomUUID } from 'crypto';

export interface IsolatedQuestion {
  question: Record<string, unknown>;
  diagnostics: string[];
  recoveryMethod: 'direct' | 'repaired' | 'partial';
}

export interface IsolationResult {
  questions: IsolatedQuestion[];
  totalDetected: number;
  recoveredCount: number;
  discardedCount: number;
  discardedIndices: number[];
  malformedNodeCount: number;
  repairTypes: string[];
}

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function splitJsonArrayElements(arrayContent: string): string[] {
  const trimmed = arrayContent.trim();
  if (!trimmed) return [];
  const elements: string[] = [];
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let currentStart = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"') { inString = true; stringChar = ch; continue; }
    if (ch === '{' || ch === '[') { depth++; continue; }
    if (ch === '}' || ch === ']') { depth--; continue; }
    if (ch === ',' && depth === 0) {
      elements.push(trimmed.slice(currentStart, i));
      currentStart = i + 1;
    }
  }
  const last = trimmed.slice(currentStart).trim();
  if (last) elements.push(last);

  return elements.map((e) => e.trim()).filter(Boolean);
}

function scanObjectFragments(text: string, startIndex = 0): string[] {
  const fragments: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let strChar = '';

  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
      continue;
    }
    if (ch === '}') {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) {
        fragments.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  if (depth > 0 && start !== -1) {
    fragments.push(text.slice(start));
  }

  return fragments;
}

function scanQuestionLikeObjects(text: string): string[] {
  const fragments: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;

    let depth = 0;
    let inStr = false;
    let strChar = '';
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (inStr) {
        if (ch === '\\') { j++; continue; }
        if (ch === strChar) inStr = false;
        continue;
      }
      if (ch === '"' || ch === "'") { inStr = true; strChar = ch; continue; }
      if (ch === '{') { depth++; continue; }
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          const fragment = text.slice(i, j + 1);
          try {
            const parsed = JSON.parse(fragment) as Record<string, unknown>;
            if (
              parsed &&
              typeof parsed === 'object' &&
              !Array.isArray(parsed) &&
              Object.prototype.hasOwnProperty.call(parsed, 'question') &&
              !seen.has(fragment)
            ) {
              fragments.push(fragment);
              seen.add(fragment);
            }
          } catch {
            if (
              /^{\s*["']?(?:id|question|type|difficulty|marks)["']?\s*:/i.test(fragment) &&
              /["']question["']\s*:/i.test(fragment) &&
              !seen.has(fragment)
            ) {
              fragments.push(fragment);
              seen.add(fragment);
            }
          }
          break;
        }
      }
    }
  }

  return fragments;
}

function extractQuestionsArray(rawJson: string): string[] {
  const questionsMatch = rawJson.match(/["']?questions["']?\s*:\s*(\[)/i);
  if (!questionsMatch) return [];

  const arrStart = questionsMatch.index! + questionsMatch[0].length - 1;
  let depth = 0;
  let arrEnd = -1;
  let inStr = false;
  let strChar = '';

  for (let i = arrStart; i < rawJson.length; i++) {
    const ch = rawJson[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; strChar = ch; continue; }
    if (ch === '[') { depth++; continue; }
    if (ch === ']') { depth--; if (depth === 0) { arrEnd = i + 1; break; } }
  }

  if (arrEnd === -1) {
    return scanObjectFragments(rawJson, arrStart + 1);
  }
  const arrayContent = rawJson.slice(arrStart + 1, arrEnd - 1);
  const split = splitJsonArrayElements(arrayContent);
  return split.length > 0 ? split : scanObjectFragments(arrayContent);
}

function stripControlChars(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    const isControl = code < 32 && !isAllowedWhitespace;
    if (!isControl) out += input[i];
  }
  return out;
}

function sanitizeRawProviderOutput(raw: string): string {
  let cleaned = raw
    .replace(/```(?:json)?/gi, '')
    .trim();

  cleaned = stripControlChars(cleaned)
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const starts = [firstBrace, firstBracket].filter((idx) => idx >= 0);
  if (starts.length > 0) {
    cleaned = cleaned.slice(Math.min(...starts));
  }

  return cleaned;
}

function tryRepairFragment(fragment: string): string | null {
  const candidates: string[] = [];
  let repaired = fragment.trim();
  candidates.push(repaired);

  repaired = repaired
    .replace(/```(?:json)?/gi, '')
    .trim();

  repaired = stripControlChars(repaired)
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ':"$1"')
    .replace(/\bundefined\b/g, 'null')
    .replace(/\bNaN\b/g, 'null')
    .replace(/\\([^"\\/bfnrtu])/g, '$1')
    .replace(/,\s*([}\]])/g, '$1');
  candidates.push(repaired);

  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  const openCurlies = (repaired.match(/{/g) || []).length;
  const closeCurlies = (repaired.match(/}/g) || []).length;
  let balanced = repaired;
  if (openBrackets > closeBrackets) balanced += ']'.repeat(openBrackets - closeBrackets);
  if (openCurlies > closeCurlies) balanced += '}'.repeat(openCurlies - closeCurlies);
  if (closeCurlies > openCurlies) {
    let extra = closeCurlies - openCurlies;
    for (let i = balanced.length - 1; i >= 0 && extra > 0; i--) {
      if (balanced[i] === '}') {
        balanced = balanced.slice(0, i) + balanced.slice(i + 1);
        extra--;
      }
    }
  }
  candidates.push(balanced);

  for (const candidate of candidates) {
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // try the next cumulative repair candidate
    }
  }
  return null;
}

function tryPartialRecovery(fragment: string): Record<string, unknown> | null {
  const innerObj = extractInnerCompleteObject(fragment);
  if (innerObj) {
    try {
      const obj = JSON.parse(innerObj) as Record<string, unknown>;
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj;
    } catch {
      // fall through
    }
  }
  return null;
}

function extractInnerCompleteObject(text: string): string | null {
  let depth = 0;
  let start = -1;
  let inStr = false;
  let strChar = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; strChar = ch; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
      continue;
    }
    if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function extractPropertiesFromBrokenObject(text: string): Record<string, unknown> | null {
  const obj: Record<string, unknown> = {};
  const keyValueRegex = /"([^"]+)"\s*:\s*("[^"]*"|true|false|null|\d+(?:\.\d+)?)/g;
  let match;
  while ((match = keyValueRegex.exec(text)) !== null) {
    const key = match[1];
    let val: unknown = match[2];
    try { val = JSON.parse(val as string); } catch { /* keep string */ }
    obj[key] = val;
  }
  return Object.keys(obj).length > 0 ? obj : null;
}

function safeUUID(value: unknown): string {
  if (typeof value === 'string' && isValidUUID(value)) return value;
  return randomUUID();
}

function safeString(value: unknown, maxLen = 1000): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function safeNumber(value: unknown, fallback = 1): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

function normalizeQuestionType(value: unknown): string {
  const input = String(value ?? '').trim().toLowerCase();
  const map: Record<string, string> = {
    mcq: 'mcq', 'multiple choice': 'mcq', multiple_choice: 'mcq', 'multiple-choice': 'mcq',
    'true false': 'true-false', truefalse: 'true-false', 'true-false': 'true-false',
    'fill blank': 'fill-blank', fillblank: 'fill-blank', 'fill-in-the-blank': 'fill-blank', 'fill-blank': 'fill-blank',
    short: 'short-answer', shortanswer: 'short-answer', 'short-answer': 'short-answer',
    long: 'long-answer', longanswer: 'long-answer', 'long-answer': 'long-answer',
  };
  return map[input] ?? 'short-answer';
}

function normalizeDifficulty(value: unknown): string {
  const input = String(value ?? '').trim().toLowerCase();
  const map: Record<string, string> = {
    easy: 'easy', beginner: 'easy', basic: 'easy',
    medium: 'medium', moderate: 'medium', normal: 'medium',
    hard: 'hard', advanced: 'hard', difficult: 'hard',
  };
  return map[input] ?? 'medium';
}

function collectOptionCandidates(value: unknown, acc: unknown[] = []): unknown[] {
  if (Array.isArray(value)) {
    for (const item of value) collectOptionCandidates(item, acc);
    return acc;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if ('text' in obj || 'key' in obj || 'label' in obj || 'value' in obj) {
      acc.push(obj);
    }
    if (Array.isArray(obj.options)) collectOptionCandidates(obj.options, acc);
    return acc;
  }
  if (typeof value === 'string') acc.push(value);
  return acc;
}

function repairOptions(value: unknown): Array<{ key: string; text: string }> | undefined {
  const keys = ['A', 'B', 'C', 'D'];
  const cleaned: Array<{ key: string; text: string }> = [];
  const seenText = new Set<string>();
  const candidates = collectOptionCandidates(value);

  for (const opt of candidates) {
    if (typeof opt === 'string') {
      const text = opt.trim();
      if (text && !seenText.has(text.toLowerCase())) {
        cleaned.push({ key: keys[cleaned.length] ?? 'A', text });
        seenText.add(text.toLowerCase());
      }
    } else if (typeof opt === 'object' && opt !== null) {
      const obj = opt as Record<string, unknown>;
      const rawKey = obj.key ?? obj.label ?? keys[cleaned.length];
      const key = typeof rawKey === 'string' ? rawKey.trim().toUpperCase() : (keys[cleaned.length] ?? 'A');
      const rawText = obj.text ?? obj.value ?? obj.option ?? obj.answer;
      const text = typeof rawText === 'string' ? rawText.trim() : '';
      if (text && !seenText.has(text.toLowerCase())) {
        cleaned.push({ key: keys[cleaned.length] ?? (key.length === 1 && key >= 'A' && key <= 'D' ? key : 'A'), text });
        seenText.add(text.toLowerCase());
      }
    }
  }

  if (cleaned.length === 0) return undefined;
  return cleaned;
}

function fullyRepairQuestion(raw: Record<string, unknown>, index: number, recoveryMethod: 'direct' | 'repaired' | 'partial'): IsolatedQuestion {
  const diagnostics: string[] = [];
  const qPath = `questions[${index}]`;

  const id = safeUUID(raw.id);
  if (raw.id !== id) diagnostics.push(`${qPath}.id: invalid UUID replaced`);

  let questionText = safeString(raw.question);
  if (!questionText || questionText.length < 5) {
    questionText = `Generated question ${index + 1}`;
    if (!raw.question) {
      diagnostics.push(`${qPath}.question: missing, set to fallback`);
    } else {
      diagnostics.push(`${qPath}.question: too short (${String(raw.question).trim().length} chars), set to fallback`);
    }
  }

  const type = normalizeQuestionType(raw.type);

  const difficulty = normalizeDifficulty(raw.difficulty);

  const marks = safeNumber(raw.marks);
  if (!Number.isFinite(Number(raw.marks)) || Number(raw.marks) <= 0) {
    diagnostics.push(`${qPath}.marks: invalid value ${raw.marks}, defaulted to ${marks}`);
  }

  const repaired: Record<string, unknown> = {
    id,
    question: questionText,
    type,
    difficulty,
    marks,
  };

  if (type === 'mcq') {
    const options = repairOptions(raw.options);
    if (options) {
      repaired.options = options;
    } else {
      diagnostics.push(`${qPath}.options: missing or malformed for MCQ type`);
    }
  }

  if (raw.options && type !== 'mcq') {
    diagnostics.push(`${qPath}.options: present but type is ${type}, removed`);
  }

  if (type === 'fill-blank') {
    const blanks = Number(raw.blanks);
    repaired.blanks = Number.isFinite(blanks) && blanks > 0 ? Math.round(blanks) : 1;
  }

  if (raw.answer && typeof raw.answer === 'object') {
    const ansObj = raw.answer as Record<string, unknown>;
    const answerText = safeString(ansObj.text);
    if (answerText) {
      repaired.answer = {
        text: answerText,
        explanation: safeString(ansObj.explanation) || undefined,
      };
    }
  }

  if (raw.blanks === 0) delete raw.blanks;

  return { question: repaired, diagnostics, recoveryMethod };
}

export function isolateAndRepair(rawOutput: string): IsolationResult {
  const sanitized = sanitizeRawProviderOutput(rawOutput);
  let fragments = extractQuestionsArray(sanitized);
  const completeQuestionObjects = scanQuestionLikeObjects(sanitized);
  for (const fragment of completeQuestionObjects) {
    if (!fragments.includes(fragment)) fragments.push(fragment);
  }
  if (fragments.length === 0) {
    fragments = scanObjectFragments(sanitized).filter((fragment) =>
      /["']question["']\s*:|["']type["']\s*:|["']marks["']\s*:/i.test(fragment)
    );
  }

  if (fragments.length === 0) {
    return { questions: [], totalDetected: 0, recoveredCount: 0, discardedCount: 0, discardedIndices: [], malformedNodeCount: 0, repairTypes: [] };
  }

  const isolated: IsolatedQuestion[] = [];
  const discardedIndices: number[] = [];
  const seenIds = new Set<string>();
  const repairTypes = new Set<string>();
  let malformedNodeCount = 0;

  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i];
    let parsed: Record<string, unknown> | null = null;
    let method: 'direct' | 'repaired' | 'partial' = 'direct';

    try {
      parsed = JSON.parse(fragment) as Record<string, unknown>;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) parsed = null;
    } catch {
      method = 'repaired';
      malformedNodeCount++;
      const repaired = tryRepairFragment(fragment);
      if (repaired) {
        try {
          parsed = JSON.parse(repaired) as Record<string, unknown>;
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) parsed = null;
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed) {
      method = 'partial';
      parsed = tryPartialRecovery(fragment);
    }

    if (!parsed) {
      parsed = extractPropertiesFromBrokenObject(fragment);
      if (parsed) method = 'partial';
    }

    if (parsed) {
      const result = fullyRepairQuestion(parsed, i, method);
      const id = String(result.question.id);
      if (seenIds.has(id)) {
        result.question.id = randomUUID();
        result.diagnostics.push(`questions[${i}].id: duplicate UUID replaced`);
        repairTypes.add('uuid_duplicate');
      }
      seenIds.add(String(result.question.id));
      if (method !== 'direct') repairTypes.add(method);
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.includes('id:')) repairTypes.add('uuid');
        if (diagnostic.includes('options:')) repairTypes.add('options');
        if (diagnostic.includes('type:')) repairTypes.add('type');
        if (diagnostic.includes('difficulty:')) repairTypes.add('difficulty');
        if (diagnostic.includes('marks:')) repairTypes.add('marks');
        if (diagnostic.includes('question:')) repairTypes.add('question');
      }
      isolated.push(result);
    } else {
      discardedIndices.push(i);
      malformedNodeCount++;
    }
  }

  return {
    questions: isolated,
    totalDetected: fragments.length,
    recoveredCount: isolated.length,
    discardedCount: discardedIndices.length,
    discardedIndices,
    malformedNodeCount,
    repairTypes: Array.from(repairTypes),
  };
}

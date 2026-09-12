export interface PerQuestionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSingleQuestion(question: Record<string, unknown>, index: number): PerQuestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const qPath = `questions[${index}]`;

  if (!question.id || typeof question.id !== 'string') {
    errors.push(`${qPath}.id: missing or not a string`);
  } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(question.id)) {
    errors.push(`${qPath}.id: invalid UUID format`);
  }

  if (!question.question || typeof question.question !== 'string') {
    errors.push(`${qPath}.question: missing or not a string`);
  } else if (question.question.trim().length < 3) {
    errors.push(`${qPath}.question: too short (${question.question.trim().length} chars)`);
  } else if (question.question.trim().length < 5) {
    warnings.push(`${qPath}.question: short text (${question.question.trim().length} chars)`);
  }

  const validTypes = ['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank'];
  if (!question.type || typeof question.type !== 'string') {
    errors.push(`${qPath}.type: missing or not a string`);
  } else if (!validTypes.includes(question.type)) {
    errors.push(`${qPath}.type: "${question.type}" is not a valid type`);
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!question.difficulty || typeof question.difficulty !== 'string') {
    errors.push(`${qPath}.difficulty: missing or not a string`);
  } else if (!validDifficulties.includes(question.difficulty)) {
    warnings.push(`${qPath}.difficulty: "${question.difficulty}" normalized`);
  }

  if (question.marks === undefined || question.marks === null) {
    errors.push(`${qPath}.marks: missing`);
  } else if (typeof question.marks !== 'number' || !Number.isFinite(question.marks)) {
    errors.push(`${qPath}.marks: not a finite number`);
  } else if (question.marks < 1) {
    errors.push(`${qPath}.marks: less than 1`);
  } else if (!Number.isInteger(question.marks)) {
    warnings.push(`${qPath}.marks: non-integer value ${question.marks}, will be rounded`);
  }

  if (question.type === 'mcq') {
    const options = question.options;
    if (!Array.isArray(options)) {
      errors.push(`${qPath}.options: missing or not an array for MCQ type`);
    } else {
      if (options.length !== 4) {
        errors.push(`${qPath}.options: expected exactly 4 options, got ${options.length}`);
      }
      const seenKeys = new Set<string>();
      const seenTexts = new Set<string>();
      for (let oi = 0; oi < options.length; oi++) {
        const opt = options[oi];
        if (typeof opt !== 'object' || opt === null) {
          errors.push(`${qPath}.options[${oi}]: not an object`);
          continue;
        }
        const optObj = opt as Record<string, unknown>;
        const optionKey = optObj.key;
        if (!optionKey || typeof optionKey !== 'string') {
      errors.push(`${qPath}.options[${oi}].key: missing or invalid`);
        } else if (!['A', 'B', 'C', 'D'].includes(optionKey.toUpperCase())) {
          errors.push(`${qPath}.options[${oi}].key: "${optionKey}" is not a valid option key`);
        } else if (seenKeys.has(optionKey.toUpperCase())) {
          warnings.push(`${qPath}.options[${oi}].key: duplicate key "${optionKey}"`);
        }
        if (typeof optionKey === 'string') seenKeys.add(optionKey.toUpperCase());
        if (!optObj.text || typeof optObj.text !== 'string' || !optObj.text.toString().trim()) {
          errors.push(`${qPath}.options[${oi}].text: missing or empty`);
        } else {
          seenTexts.add(optObj.text.toString().toLowerCase());
        }
      }
    }
  } else if (Array.isArray(question.options)) {
    errors.push(`${qPath}.options: not allowed for ${question.type} questions`);
  }

  if (question.type === 'fill-blank') {
    if (question.blanks !== undefined && (typeof question.blanks !== 'number' || !Number.isInteger(question.blanks) || question.blanks < 1)) {
      warnings.push(`${qPath}.blanks: invalid value ${question.blanks}, will be defaulted`);
    }
  } else if (question.blanks !== undefined) {
    errors.push(`${qPath}.blanks: not allowed for ${question.type} questions`);
  }

  if (question.answer && typeof question.answer === 'object') {
    const ans = question.answer as Record<string, unknown>;
    if (ans.text && typeof ans.text === 'string' && ans.text.toString().trim().length < 2) {
      warnings.push(`${qPath}.answer.text: very short`);
    }
  }

  if (question.type === 'mcq' && question.answer !== undefined) {
    warnings.push(`${qPath}.answer: MCQ answers should be generated later, not embedded in the question payload`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function isQuestionValid(question: Record<string, unknown>, index: number): boolean {
  return validateSingleQuestion(question, index).valid;
}

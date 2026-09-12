const MAX_CONTEXT_CHARS = 1800;

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

function stripImageRefs(text: string): string {
  return text
    .replace(/\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, '')
    .replace(/data:image\/[^;]+;base64[^"'\s)]+/gi, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\(?\s*(?:see|refer|check|view|look at|fig|figure|image|picture)\s*:?\s*[^)\n]*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\)?/gi, '')
    .replace(/['"`]\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\S*['"`]/gi, '')
    .replace(/\[?\s*\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\s*\]?/gi, '');
}

export function buildCompactSyllabusContext(uploadedContent?: string): string {
  if (!uploadedContent) return 'No uploaded syllabus provided.';

  const sanitized = stripImageRefs(uploadedContent);
  const lines = sanitized
    .split(/\r?\n+/)
    .map(normalizeLine)
    .filter((line) => line.length >= 4);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(line);
    if (unique.length >= 18) break;
  }

  const objectives = unique.slice(0, 10).map((line) => `- ${line}`);
  const keywords = unique
    .flatMap((line) => line.split(/[,;:]/g))
    .map(normalizeLine)
    .filter((line) => line.length >= 4)
    .slice(0, 12);

  const compact = [
    'Syllabus Summary:',
    ...objectives,
    '',
    'Key Topics:',
    ...keywords.map((keyword) => `- ${keyword}`),
  ]
    .join('\n')
    .trim();

  if (compact.length <= MAX_CONTEXT_CHARS) return compact;
  return compact.slice(0, MAX_CONTEXT_CHARS).trimEnd();
}

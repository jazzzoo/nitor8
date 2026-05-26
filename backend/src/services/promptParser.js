// backend/src/services/promptParser.js

const ALLOWED_TAGS = new Set([
  'all',
  'session_1',
  'session_2',
  'session_3',
  'session_4',
]);

/**
 * Parse master.txt into a structured rules array.
 * Line-based: every non-blank, non-comment line must have [tag] content.
 * @param {string} text - full contents of master.txt
 * @returns {{ line: number, tags: string[], content: string }[]}
 */
function parseMasterPrompt(text) {
  const lines = text.split('\n');
  const rules = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '') continue;
    if (trimmed.startsWith('#')) continue;

    if (!trimmed.startsWith('[')) {
      throw new Error(
        `[promptParser] Line ${lineNum}: 태그 없는 라인 — "${trimmed.slice(0, 60)}"`
      );
    }

    const closingBracket = trimmed.indexOf(']');
    if (closingBracket === -1) {
      throw new Error(
        `[promptParser] Line ${lineNum}: 태그 닫기 ']' 없음 — "${trimmed.slice(0, 60)}"`
      );
    }

    const tagString = trimmed.slice(1, closingBracket).trim();
    const tags = tagString.split(',').map(t => t.trim()).filter(Boolean);

    if (tags.length === 0) {
      throw new Error(`[promptParser] Line ${lineNum}: 빈 태그 문자열`);
    }

    for (const tag of tags) {
      if (!ALLOWED_TAGS.has(tag)) {
        throw new Error(
          `[promptParser] Line ${lineNum}: 알 수 없는 태그 "${tag}" ` +
          `(허용: ${[...ALLOWED_TAGS].join(', ')})`
        );
      }
    }

    const content = trimmed.slice(closingBracket + 1).trim();
    if (!content) {
      throw new Error(
        `[promptParser] Line ${lineNum}: 빈 content (태그 "${tagString}" 뒤에 내용 없음)`
      );
    }

    rules.push({ line: lineNum, tags, content });
  }

  return rules;
}

/**
 * Build a clean prompt string for a specific session from parsed rules.
 * Includes [all] rules and [session_N] rules matching sessionType.
 * @param {{ line: number, tags: string[], content: string }[]} rules
 * @param {string} sessionType - "1" | "2" | "3" | "4"
 * @returns {string} tag-free assembled prompt
 */
function buildPromptForSession(rules, sessionType) {
  if (!sessionType) {
    throw new Error('[promptParser] buildPromptForSession: sessionType 누락');
  }

  const sessionTag = `session_${sessionType}`;
  if (!ALLOWED_TAGS.has(sessionTag)) {
    throw new Error(
      `[promptParser] buildPromptForSession: 허용되지 않은 sessionType "${sessionType}" ` +
      `(허용: 1, 2, 3, 4)`
    );
  }

  const filtered = rules.filter(r =>
    r.tags.includes('all') || r.tags.includes(sessionTag)
  );

  return filtered.map(r => r.content).join('\n');
}

/**
 * Final guard: ensure no tag syntax leaked into the assembled prompt.
 * @param {string} prompt
 * @returns {true}
 */
function validateFinalPrompt(prompt) {
  if (prompt.includes('[session_')) {
    throw new Error('[promptParser] validateFinalPrompt: 최종 프롬프트에 session 태그 노출');
  }
  if (prompt.includes('[all]')) {
    throw new Error('[promptParser] validateFinalPrompt: 최종 프롬프트에 [all] 태그 노출');
  }
  return true;
}

export { parseMasterPrompt, buildPromptForSession, validateFinalPrompt, ALLOWED_TAGS };

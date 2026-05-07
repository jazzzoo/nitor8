#!/bin/bash
# PreToolUse: Bash — dangerous command blocker

INPUT=$(cat)
COMMAND=$(node -e "
let d = '';
process.stdin.resume();
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  try { process.stdout.write(JSON.parse(d)?.tool_input?.command || ''); }
  catch(e) { process.stdout.write(''); }
});
" <<< "$INPUT" 2>/dev/null || echo "")

DANGER_PATTERN='(rm -rf /|git push --force origin main|DROP TABLE|TRUNCATE TABLE|git reset --hard origin)'

if echo "$COMMAND" | grep -qiE "$DANGER_PATTERN"; then
  echo "⛔ safety-guard: blocked — $COMMAND" >&2
  exit 2
fi

exit 0

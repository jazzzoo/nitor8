#!/bin/bash
# PostToolUse: Edit|Write|MultiEdit — JS syntax check

INPUT=$(cat)
FILE=$(node -e "
let d = '';
process.stdin.resume();
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(d);
    process.stdout.write(parsed?.tool_input?.file_path || parsed?.tool_input?.path || '');
  } catch(e) { process.stdout.write(''); }
});
" <<< "$INPUT" 2>/dev/null || echo "")

if [ -z "$FILE" ] || [[ "$FILE" != *.js ]]; then
  exit 0
fi

if node --check "$FILE" 2>&1; then
  echo "✅ auto-test: $FILE 문법 OK"
else
  echo "⚠️  auto-test: $FILE 문법 오류 있음"
fi

exit 0

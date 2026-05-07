#!/bin/bash
# SessionStart: dependency check

MISSING=0

if [ ! -d "backend/node_modules" ]; then
  echo "⚠️  dep-check: backend/node_modules 없음 → cd backend && npm install 필요"
  MISSING=1
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "⚠️  dep-check: frontend/node_modules 없음 → cd frontend && npm install 필요"
  MISSING=1
fi

if [ $MISSING -eq 0 ]; then
  echo "✅ dep-check: 의존성 확인 완료"
fi

exit 0

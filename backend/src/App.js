// ================================
// Sally.ai 백엔드 서버
// PRD Part 10 기반
// ================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- 미들웨어 ----
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:19006'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-guest-id', 'x-access-token', 'Authorization'],
}));

// ---- 헬스체크 (PRD 11.6) ----
app.get('/api/health', async (req, res) => {
  try {
    // Day 2에서 DB 연결 추가 예정
    res.json({
      success: true,
      data: {
        status: 'ok',
        server: 'running',
        db: 'not connected yet (Day 2)',
        claude: 'not connected yet (Day 3)',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// ---- 서버 시작 ----
app.listen(PORT, () => {
  console.log(`✅ Sally.ai 서버 실행 중: http://localhost:${PORT}`);
  console.log(`✅ 헬스체크: http://localhost:${PORT}/api/health`);
});

module.exports = app;

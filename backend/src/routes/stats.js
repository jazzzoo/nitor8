// backend/src/routes/stats.js
// 공개 통계 엔드포인트 — 인증 불필요
//
// GET /api/stats/question-lists-count
// GET /api/stats/interviews-count
// GET /api/stats/reports-count
// GET /api/stats/beta-users-count

import { Router } from 'express';
import { query, FEEDBACK_QLIST_ID, FEEDBACK_GUEST_ID } from '../models/db.js';

const router = Router();

router.get('/question-lists-count', async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM question_lists
       WHERE id != $1`,
      [FEEDBACK_QLIST_ID]
    );
    return res.json({ success: true, count: result.rows[0].count });
  } catch (_) {
    return res.json({ success: true, count: 0 });
  }
});

router.get('/interviews-count', async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM interview_sessions
       WHERE guest_id != $1
         AND (respondent_name IS NULL
              OR respondent_name NOT IN ('Test User A', 'Test User B', '(beta tester)'))`,
      [FEEDBACK_GUEST_ID]
    );
    return res.json({ success: true, count: result.rows[0].count });
  } catch (_) {
    return res.json({ success: true, count: 0 });
  }
});

router.get('/reports-count', async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM reports
       WHERE status = 'completed'
         AND guest_id != $1`,
      [FEEDBACK_GUEST_ID]
    );
    return res.json({ success: true, count: result.rows[0].count });
  } catch (_) {
    return res.json({ success: true, count: 0 });
  }
});

router.get('/beta-users-count', async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(DISTINCT guest_id)::int AS count FROM sessions
       WHERE guest_id != $1`,
      [FEEDBACK_GUEST_ID]
    );
    return res.json({ success: true, count: result.rows[0].count });
  } catch (_) {
    return res.json({ success: true, count: 0 });
  }
});

export default router;

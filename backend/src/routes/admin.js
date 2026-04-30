// backend/src/routes/admin.js
// 어드민 전용 API — express-basic-auth로 보호
//
// GET /api/admin/feedback-interviews         — 피드백 인터뷰 목록
// GET /api/admin/feedback-interviews/:id/turns — 채팅 로그 전체
// GET /api/admin/feedback-report             — aggregate report 조회

import { Router } from 'express';
import basicAuth from 'express-basic-auth';
import { query } from '../models/db.js';
import { generateAggregateReport } from './reports.js';

const router = Router();

const FEEDBACK_QLIST_ID  = '00000000-0000-0000-0000-000000000003';
const FEEDBACK_GUEST_ID  = '00000000-0000-4000-8000-000000000000';

// ── Basic Auth 미들웨어 ───────────────────────────────────────────
router.use(basicAuth({
  users: {
    [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'nitor8admin',
  },
  challenge: true,
  realm: 'Nitor8 Admin',
}));

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/feedback-interviews
// session_type = 2인 피드백 인터뷰 목록
// ─────────────────────────────────────────────────────────────────
router.get('/feedback-interviews', async (req, res) => {
  try {
    const result = await query(
      `SELECT
         is2.id,
         is2.link_token,
         is2.respondent_name,
         is2.status,
         is2.created_at,
         is2.completed_at,
         ist.current_section,
         ist.completed_sections,
         (SELECT COUNT(*) FROM interview_turns it
          WHERE it.interview_session_id = is2.id AND it.role = 'user') AS response_count
       FROM interview_sessions is2
       JOIN question_lists ql ON is2.question_list_id = ql.id
       JOIN sessions s ON ql.session_id = s.id
       LEFT JOIN interview_state ist ON ist.interview_session_id = is2.id
       WHERE s.session_type = 2
       ORDER BY is2.created_at DESC`
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Admin] GET /feedback-interviews error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '목록 조회 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/feedback-interviews/:id/turns
// 특정 피드백 인터뷰의 채팅 로그 전체
// ─────────────────────────────────────────────────────────────────
router.get('/feedback-interviews/:id/turns', async (req, res) => {
  const { id } = req.params;

  try {
    const sessionCheck = await query(
      `SELECT is2.id
       FROM interview_sessions is2
       JOIN question_lists ql ON is2.question_list_id = ql.id
       JOIN sessions s ON ql.session_id = s.id
       WHERE is2.id = $1 AND s.session_type = 2`,
      [id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '피드백 인터뷰를 찾을 수 없습니다.' },
      });
    }

    const result = await query(
      `SELECT role, content, section, question_index, turn_index, created_at
       FROM interview_turns
       WHERE interview_session_id = $1
       ORDER BY turn_index ASC`,
      [id]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Admin] GET /feedback-interviews/:id/turns error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '채팅 로그 조회 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/feedback-report
// 피드백 인터뷰들의 aggregate report
// ─────────────────────────────────────────────────────────────────
router.get('/feedback-report', async (req, res) => {
  try {
    const result = await query(
      `SELECT *
       FROM reports
       WHERE question_list_id = $1
         AND type = 'aggregate'
         AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 1`,
      [FEEDBACK_QLIST_ID]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Admin] GET /feedback-report error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '리포트 조회 중 오류가 발생했습니다.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/feedback-regenerate
// 피드백 aggregate 리포트 재생성
// ─────────────────────────────────────────────────────────────────
router.post('/feedback-regenerate', async (req, res) => {
  try {
    const { rows: individualReports } = await query(
      `SELECT r.id, r.result, is2.respondent_name
       FROM reports r
       JOIN interview_sessions is2 ON r.interview_session_id = is2.id
       WHERE is2.question_list_id = $1
         AND (r.type = 'individual' OR r.type IS NULL)
         AND r.status = 'completed'`,
      [FEEDBACK_QLIST_ID]
    );

    if (individualReports.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_DATA', message: '완료된 인터뷰가 2개 이상 필요합니다.' },
      });
    }

    const existing = await query(
      `SELECT id FROM reports WHERE question_list_id = $1 AND type = 'aggregate'`,
      [FEEDBACK_QLIST_ID]
    );

    let aggregateReportId;
    if (existing.rows[0]) {
      aggregateReportId = existing.rows[0].id;
      await query(
        `UPDATE reports SET status = 'generating', result = NULL, completed_at = NULL WHERE id = $1`,
        [aggregateReportId]
      );
    } else {
      const newRow = await query(
        `INSERT INTO reports (guest_id, question_list_id, type, status)
         VALUES ($1, $2, 'aggregate', 'generating')
         RETURNING id`,
        [FEEDBACK_GUEST_ID, FEEDBACK_QLIST_ID]
      );
      aggregateReportId = newRow.rows[0].id;
    }

    res.json({ success: true, data: { id: aggregateReportId, status: 'generating' } });

    generateAggregateReport(aggregateReportId, individualReports, '').catch(console.error);
  } catch (err) {
    console.error('[Admin] POST /feedback-regenerate error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '재생성 중 오류가 발생했습니다.' },
    });
  }
});

export default router;

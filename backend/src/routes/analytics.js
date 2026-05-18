// backend/src/routes/analytics.js
// 애널리틱스 이벤트 기록 (공개 — 인증 불필요)
//
// POST /api/analytics/events  — 이벤트 저장

import { Router } from 'express';
import { query } from '../models/db.js';

const router = Router();

// POST /api/analytics/events
router.post('/events', async (req, res) => {
  const { event_type, event_data = {}, project_id = null, session_id = null } = req.body;
  const guest_id = req.headers['x-guest-id'] || req.body.guest_id || null;

  if (!event_type) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELD', message: 'event_type is required' },
    });
  }

  try {
    await query(
      `INSERT INTO analytics_events (guest_id, project_id, session_id, event_type, event_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [guest_id, project_id, session_id, event_type, JSON.stringify(event_data)]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[Analytics] POST /events error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record event' },
    });
  }
});

export default router;

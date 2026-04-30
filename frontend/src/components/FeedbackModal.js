// frontend/src/components/FeedbackModal.js
// 베타 유저 피드백 인터뷰 초대 모달 (웹 전용)

import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { feedbackApi } from '../api/client';
import { colors, spacing, radius } from '../theme';

export default function FeedbackModal({ visible, onClose, navigation }) {
  const [loading, setLoading] = useState(false);

  if (!visible || typeof document === 'undefined') return null;

  async function handleStart() {
    setLoading(true);
    try {
      const res = await feedbackApi.createFeedbackSession();
      const { link_token } = res.data;
      if (typeof localStorage !== 'undefined') localStorage.setItem('nitor8-feedback-done', 'true');
      onClose();
      navigation.navigate('Interview', { token: link_token });
    } catch (err) {
      console.error('[FeedbackModal] error:', err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: colors.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: spacing.lg,
    }}>
      <div style={{
        background: colors.surface,
        borderRadius: radius.lg,
        maxWidth: 460,
        width: '100%',
        padding: 40,
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md, padding: `${spacing.lg}px 0` }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <p style={{ fontSize: 16, color: colors.textSecondary, margin: 0 }}>
              Setting up your interview...
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 22, fontWeight: 700, color: colors.textSecondary, margin: `0 0 ${spacing.sm}px 0` }}>
              How was your experience?
            </p>
            <p style={{ fontSize: 15, color: colors.textSecondary, lineHeight: '24px', margin: `0 0 ${spacing.lg * 2}px 0` }}>
              Help us improve Nitor8.<br />
              Share your honest feedback in a short AI interview. (5 min)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
              <button
                onClick={handleStart}
                style={{
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryMid}, ${colors.primaryEnd})`,
                  color: colors.white,
                  border: 'none',
                  borderRadius: radius.md,
                  padding: '12px 24px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Start Feedback Interview
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 14,
                  color: colors.textDisabled,
                  cursor: 'pointer',
                  padding: '8px 0',
                }}
              >
                Maybe later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

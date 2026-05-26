import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Platform, Clipboard, Alert, useWindowDimensions,
} from 'react-native';
import GradientButton from './GradientButton';
import { colors, spacing, radius } from '../theme';
import { analyticsApi } from '../api/client';

const TABS = ['Warm DM', 'LinkedIn', 'Community'];

const MESSAGES = [
  `Hey [Name]! I'm building a product around [problem you mentioned]. Would you do a 10-min AI-guided interview? No selling, just listening.\n\n{link}`,
  `Hi [Name], I noticed you're a [job title] dealing with [problem]. I'm doing customer research — a quick 10-min AI interview, no calls needed. Worth it?\n\n{link}`,
  `Hey everyone — doing research on [problem]. If this affects you, I'd love 10 minutes of your story. AI-guided, async, no selling.\n\n{link}`,
];

const CHECKLIST_ITEMS = [
  'Identified 3+ people with the problem',
  'Personalized the message for each person',
  'Added your interview link to the message',
  'Set a follow-up reminder (24–48 h)',
];

const WHO_ITEMS = [
  { type: 'check', text: '최근 이 문제를 겪었을 가능성이 있는 사람' },
  { type: 'check', text: '타겟 고객군에 가까운 사람' },
  { type: 'cross', text: '칭찬만 해줄 친구는 피하기' },
];

const CHANNEL_ITEMS = [
  { num: '1', name: 'Warm DM',         desc: '지인이나 아는 사람부터 시작하세요.' },
  { num: '2', name: 'LinkedIn / X DM', desc: '타겟 페르소나와 맞는 사람에게.' },
  { num: '3', name: '커뮤니티 댓글',    desc: '최근 이 문제를 올린 사람에게 답글로.' },
  { num: '4', name: '이메일',           desc: 'B2B나 공식적인 경우.' },
];

export default function ShareGuideModal({ visible, onClose, shareLink }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 700;
  const sc = isDesktop ? 1.1 : 1;

  const [activeTab, setActiveTab] = useState(0);
  const [checked, setChecked] = useState([false, false, false, false]);
  const [sent, setSent] = useState(false);

  function toggleCheck(i) {
    setChecked((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });
    analyticsApi.track('share_guide_checklist_toggle', { index: i });
  }

  function handleCopyLink() {
    Clipboard.setString(shareLink);
    Alert.alert('Copied!', 'Interview link copied to clipboard.');
    analyticsApi.track('share_guide_copy_link');
  }

  function handleCopyMessage() {
    const msg = MESSAGES[activeTab].replace('{link}', shareLink);
    Clipboard.setString(msg);
    Alert.alert('Copied!', 'Message template copied.');
    analyticsApi.track('share_guide_copy_message', { tab: TABS[activeTab] });
  }

  function handleSent() {
    setSent(true);
    analyticsApi.track('share_guide_marked_sent');
    setTimeout(() => { setSent(false); onClose(); }, 1200);
  }

  function handleShow() {
    analyticsApi.track('share_guide_opened');
  }

  const sectionLabel = {
    fontSize: 11 * sc,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm * sc,
  };

  const pad = spacing.lg * sc;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
        <View style={[styles.sheet, isDesktop && styles.sheetDesktop]}>

          {/* Header */}
          <View style={[styles.sheetHeader, { paddingHorizontal: pad, paddingTop: pad }]}>
            <View style={{ flex: 1, paddingRight: spacing.lg }}>
              <Text style={{ fontSize: 22 * sc, fontWeight: '700', color: colors.textPrimary, lineHeight: 28 * sc }}>
                Share your interview
              </Text>
              <Text style={{ fontSize: 14 * sc, color: colors.textSecondary, marginTop: 4 * sc, lineHeight: 20 * sc }}>
                Send to the right person, not everyone.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 18 * sc, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingHorizontal: pad, paddingBottom: spacing.xxl }}
            showsVerticalScrollIndicator={false}
          >

            {/* Section 1: Who to send */}
            <View style={{ marginTop: spacing.xl * sc }}>
              {WHO_ITEMS.map(({ type, text }, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm * sc, paddingVertical: 6 * sc }}>
                  <Text style={{
                    fontSize: 15 * sc,
                    fontWeight: '700',
                    color: type === 'check' ? colors.success : colors.error,
                    lineHeight: 22 * sc,
                    width: 18 * sc,
                  }}>
                    {type === 'check' ? '✓' : '✗'}
                  </Text>
                  <Text style={{
                    flex: 1,
                    fontSize: 14 * sc,
                    color: colors.textSecondary,
                    lineHeight: 22 * sc,
                  }}>
                    {text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Section 2: Best channels */}
            <View style={{ marginTop: spacing.xl * sc }}>
              <Text style={sectionLabel}>채널 선택</Text>
              {CHANNEL_ITEMS.map(({ num, name, desc }, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md * sc, paddingVertical: 8 * sc }}>
                  <Text style={{
                    fontSize: 14 * sc,
                    fontWeight: '700',
                    color: colors.primary,
                    lineHeight: 20 * sc,
                    width: 18 * sc,
                  }}>
                    {num}.
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14 * sc, fontWeight: '600', color: colors.textPrimary, lineHeight: 20 * sc }}>
                      {name}
                    </Text>
                    <Text style={{ fontSize: 13 * sc, color: colors.textSecondary, lineHeight: 18 * sc, marginTop: 2 * sc }}>
                      {desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Section 3: Message examples */}
            <View style={{ marginTop: spacing.xl * sc }}>
              <Text style={sectionLabel}>메시지 예시</Text>

              {/* Tabs — underline only */}
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md * sc }}>
                {TABS.map((tab, i) => (
                  <TouchableOpacity
                    key={i}
                    style={{
                      paddingVertical: 8 * sc,
                      paddingHorizontal: spacing.md * sc,
                      marginBottom: -1,
                      borderBottomWidth: 2,
                      borderBottomColor: activeTab === i ? colors.primary : 'transparent',
                    }}
                    onPress={() => setActiveTab(i)}
                  >
                    <Text style={{
                      fontSize: 13 * sc,
                      fontWeight: activeTab === i ? '600' : '400',
                      color: activeTab === i ? colors.textPrimary : colors.textSecondary,
                    }}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message box */}
              <View style={{
                backgroundColor: colors.background,
                borderRadius: radius.md,
                padding: spacing.md * sc,
              }}>
                <Text style={{
                  fontSize: 13 * sc,
                  color: colors.textSecondary,
                  lineHeight: 20 * sc,
                  fontStyle: 'italic',
                }}>
                  {MESSAGES[activeTab].replace('{link}', shareLink)}
                </Text>
                <TouchableOpacity
                  style={{
                    alignSelf: 'flex-end',
                    marginTop: spacing.sm * sc,
                    backgroundColor: colors.primary + '33',
                    borderRadius: radius.sm,
                    paddingVertical: spacing.xs * sc,
                    paddingHorizontal: spacing.sm * sc,
                  }}
                  onPress={handleCopyMessage}
                >
                  <Text style={{ fontSize: 12 * sc, fontWeight: '600', color: colors.primary }}>Copy</Text>
                </TouchableOpacity>
              </View>

              <Text style={{
                fontSize: 12 * sc,
                color: colors.textDisabled,
                fontStyle: 'italic',
                marginTop: spacing.sm * sc,
              }}>
                Personalize before sending
              </Text>
            </View>

            {/* Section 4: Checklist */}
            <View style={{ marginTop: spacing.xl * sc }}>
              <Text style={sectionLabel}>Before you send</Text>
              {CHECKLIST_ITEMS.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm * sc, paddingVertical: 8 * sc }}
                  onPress={() => toggleCheck(i)}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 22 * sc,
                    height: 22 * sc,
                    borderRadius: 6 * sc,
                    borderWidth: 2,
                    borderColor: checked[i] ? colors.primary : colors.border,
                    backgroundColor: checked[i] ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {checked[i] && (
                      <Text style={{ fontSize: 12 * sc, color: colors.white, fontWeight: '700' }}>✓</Text>
                    )}
                  </View>
                  <Text style={{
                    flex: 1,
                    fontSize: 14 * sc,
                    color: checked[i] ? colors.textDisabled : colors.textSecondary,
                    lineHeight: 20 * sc,
                    textDecorationLine: checked[i] ? 'line-through' : 'none',
                  }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingHorizontal: pad, paddingTop: spacing.md * sc, paddingBottom: spacing.lg * sc }]}>
            <GradientButton label="Copy Interview Link" onPress={handleCopyLink} style={{ flex: 1 }} />
            <TouchableOpacity
              style={{
                flex: 1,
                marginLeft: spacing.sm,
                backgroundColor: colors.success + '26',
                borderRadius: radius.sm,
                paddingVertical: 12 * sc,
                paddingHorizontal: spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleSent}
            >
              <Text style={{ fontSize: 14 * sc, fontWeight: '600', color: colors.success }}>
                {sent ? 'Sent! ✓' : 'I sent it ✓'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlayDesktop: {
    justifyContent: 'center',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 -8px 32px rgba(0,0,0,0.15)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20 }),
  },
  sheetDesktop: {
    maxWidth: 560,
    borderRadius: radius.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: { padding: 8 },
  scroll: { flex: 1 },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

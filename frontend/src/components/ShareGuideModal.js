import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Platform, Clipboard, Alert,
} from 'react-native';
import { UserCheck, Target, UserX, MessageCircle, Briefcase, Users, Mail } from 'lucide-react-native';
import GradientButton from './GradientButton';
import { colors, spacing, radius, textStyles } from '../theme';
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

export default function ShareGuideModal({ visible, onClose, shareLink }) {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>How to Share</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Section 1: Who to send */}
            <Text style={styles.sectionLabel}>WHO TO SEND IT TO</Text>
            {[
              { Icon: UserCheck, color: colors.success, text: 'Early adopters who already told you they have this problem' },
              { Icon: Target,    color: colors.primary, text: 'People matching your Ideal Customer Profile (ICP)' },
              { Icon: UserX,     color: colors.error,   text: 'Friends & family who haven\'t experienced the problem', strike: true },
            ].map(({ Icon, color, text, strike }, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
                  <Icon size={18} color={color} />
                </View>
                <Text style={[styles.bulletText, strike && styles.bulletStrike]}>{text}</Text>
              </View>
            ))}

            {/* Section 2: Best channels */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>BEST CHANNELS</Text>
            <View style={styles.channelGrid}>
              {[
                { Icon: MessageCircle, label: 'Warm DM',   desc: 'Prior conversations' },
                { Icon: Briefcase,     label: 'LinkedIn',  desc: 'ICP job titles' },
                { Icon: Users,         label: 'Community', desc: 'Slack / Discord' },
                { Icon: Mail,          label: 'Email',     desc: 'Cold + personal' },
              ].map(({ Icon, label, desc }, i) => (
                <View key={i} style={styles.channelCard}>
                  <Icon size={20} color={colors.primary} />
                  <Text style={styles.channelLabel}>{label}</Text>
                  <Text style={styles.channelDesc}>{desc}</Text>
                </View>
              ))}
            </View>

            {/* Section 3: Message examples */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>MESSAGE EXAMPLES</Text>
            <View style={styles.tabRow}>
              {TABS.map((tab, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.tab, activeTab === i && styles.tabActive]}
                  onPress={() => setActiveTab(i)}
                >
                  <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                {MESSAGES[activeTab].replace('{link}', shareLink)}
              </Text>
              <TouchableOpacity style={styles.copyMsgBtn} onPress={handleCopyMessage}>
                <Text style={styles.copyMsgBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>

            {/* Section 4: Checklist */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>BEFORE YOU SEND</Text>
            {CHECKLIST_ITEMS.map((item, i) => (
              <TouchableOpacity key={i} style={styles.checkRow} onPress={() => toggleCheck(i)} activeOpacity={0.7}>
                <View style={[styles.checkbox, checked[i] && styles.checkboxChecked]}>
                  {checked[i] && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkText, checked[i] && styles.checkTextDone]}>{item}</Text>
              </TouchableOpacity>
            ))}

          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <GradientButton label="Copy Interview Link" onPress={handleCopyLink} style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.sentBtn, sent && { backgroundColor: colors.success }]}
              onPress={handleSent}
            >
              <Text style={styles.sentBtnText}>{sent ? 'Sent! ✓' : 'I sent it ✓'}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 -8px 32px rgba(0,0,0,0.15)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20 }),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 16, color: colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDisabled,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  iconBox: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  bulletStrike: { textDecorationLine: 'line-through', color: colors.textDisabled },

  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  channelCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  channelLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
  channelDesc: { fontSize: 11, color: colors.textDisabled },

  tabRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.white, fontWeight: '600' },

  messageBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  copyMsgBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  copyMsgBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  checkmark: { fontSize: 13, color: colors.white, fontWeight: '700' },
  checkText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  checkTextDone: { textDecorationLine: 'line-through', color: colors.textDisabled },

  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sentBtn: {
    backgroundColor: colors.textSecondary,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
});

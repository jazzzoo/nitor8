import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Platform, Clipboard, Alert, useWindowDimensions,
} from 'react-native';
import { UserCheck, Target, UserX, MessageCircle, Briefcase, Users, Mail } from 'lucide-react-native';
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

function Divider() {
  return (
    <View style={{
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.lg,
    }} />
  );
}

export default function ShareGuideModal({ visible, onClose, shareLink }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 700;
  const sc = isDesktop ? 1.25 : 1;

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

  const sectionStyle = {
    paddingVertical: spacing.xl * sc,
    paddingHorizontal: spacing.lg,
    gap: spacing.md * sc,
  };

  const labelStyle = {
    fontSize: 11 * sc,
    fontWeight: '700',
    color: colors.textDisabled,
    letterSpacing: 1,
  };

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

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={{ fontSize: 20 * sc, fontWeight: '700', color: colors.textPrimary }}>
              How to Share
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 16 * sc, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            showsVerticalScrollIndicator={false}
          >

            {/* Section 1: Who to send */}
            <View style={sectionStyle}>
              <Text style={labelStyle}>WHO TO SEND IT TO</Text>
              {[
                { Icon: UserCheck, color: colors.success, text: 'Early adopters who already told you they have this problem' },
                { Icon: Target,    color: colors.primary, text: 'People matching your Ideal Customer Profile (ICP)' },
                { Icon: UserX,     color: colors.error,   text: "Friends & family who haven't experienced the problem", strike: true },
              ].map(({ Icon, color, text, strike }, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm * sc }}>
                  <View style={{
                    width: 32 * sc,
                    height: 32 * sc,
                    borderRadius: radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: color + '22',
                    flexShrink: 0,
                  }}>
                    <Icon size={18 * sc} color={color} />
                  </View>
                  <Text style={{
                    flex: 1,
                    fontSize: 14 * sc,
                    color: strike ? colors.textDisabled : colors.textSecondary,
                    lineHeight: 20 * sc,
                    textDecorationLine: strike ? 'line-through' : 'none',
                  }}>
                    {text}
                  </Text>
                </View>
              ))}
            </View>

            <Divider />

            {/* Section 2: Best channels */}
            <View style={sectionStyle}>
              <Text style={labelStyle}>BEST CHANNELS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm * sc }}>
                {[
                  { Icon: MessageCircle, label: 'Warm DM',   desc: 'Prior conversations' },
                  { Icon: Briefcase,     label: 'LinkedIn',  desc: 'ICP job titles' },
                  { Icon: Users,         label: 'Community', desc: 'Slack / Discord' },
                  { Icon: Mail,          label: 'Email',     desc: 'Cold + personal' },
                ].map(({ Icon, label, desc }, i) => (
                  <View key={i} style={{
                    flex: 1,
                    minWidth: '44%',
                    backgroundColor: colors.background,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md * sc,
                    gap: 4 * sc,
                  }}>
                    <Icon size={20 * sc} color={colors.primary} />
                    <Text style={{ fontSize: 13 * sc, fontWeight: '600', color: colors.textPrimary, marginTop: 4 * sc }}>
                      {label}
                    </Text>
                    <Text style={{ fontSize: 11 * sc, color: colors.textDisabled }}>{desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Divider />

            {/* Section 3: Message examples */}
            <View style={sectionStyle}>
              <Text style={labelStyle}>MESSAGE EXAMPLES</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs * sc }}>
                {TABS.map((tab, i) => (
                  <TouchableOpacity
                    key={i}
                    style={{
                      paddingVertical: 6 * sc,
                      paddingHorizontal: spacing.md * sc,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: activeTab === i ? colors.primary : colors.border,
                      backgroundColor: activeTab === i ? colors.primary : colors.background,
                    }}
                    onPress={() => setActiveTab(i)}
                  >
                    <Text style={{
                      fontSize: 13 * sc,
                      color: activeTab === i ? colors.white : colors.textSecondary,
                      fontWeight: activeTab === i ? '600' : '500',
                    }}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{
                backgroundColor: colors.background,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md * sc,
                gap: spacing.sm * sc,
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
                    backgroundColor: colors.surface,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 6 * sc,
                    paddingHorizontal: spacing.md * sc,
                  }}
                  onPress={handleCopyMessage}
                >
                  <Text style={{ fontSize: 13 * sc, fontWeight: '600', color: colors.textSecondary }}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Divider />

            {/* Section 4: Checklist */}
            <View style={sectionStyle}>
              <Text style={labelStyle}>BEFORE YOU SEND</Text>
              {CHECKLIST_ITEMS.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm * sc, paddingVertical: 6 * sc }}
                  onPress={() => toggleCheck(i)}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 22 * sc,
                    height: 22 * sc,
                    borderRadius: 6 * sc,
                    borderWidth: 2,
                    borderColor: checked[i] ? colors.success : colors.border,
                    backgroundColor: checked[i] ? colors.success : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {checked[i] && (
                      <Text style={{ fontSize: 13 * sc, color: colors.white, fontWeight: '700' }}>✓</Text>
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
          <View style={{
            flexDirection: 'row',
            gap: spacing.sm,
            padding: spacing.lg * sc,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}>
            <GradientButton label="Copy Interview Link" onPress={handleCopyLink} style={{ flex: 1 }} />
            <TouchableOpacity
              style={{
                backgroundColor: sent ? colors.success : colors.textSecondary,
                borderRadius: radius.sm,
                paddingVertical: 12 * sc,
                paddingHorizontal: spacing.lg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleSent}
            >
              <Text style={{ fontSize: 15 * sc, fontWeight: '600', color: colors.white }}>
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
  closeBtn: { padding: 8 },
  scroll: { flex: 1 },
});

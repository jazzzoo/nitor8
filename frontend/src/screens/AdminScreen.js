// frontend/src/screens/AdminScreen.js
// 어드민 전용 페이지 — /admin 경로, Basic Auth
//
// 탭 1: Interviews — 피드백 인터뷰 목록
// 탭 2: Chat Logs  — 선택한 인터뷰 채팅 로그
// 탭 3: Report     — 피드백 종합 리포트

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius, textStyles } from '../theme';
import { CompletedAggregateReport } from './AggregateReportScreen';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function adminGet(path, credentials) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);
  return json;
}

const TABS = ['Interviews', 'Chat Logs', 'Report'];

const STATUS_COLOR = {
  active:    colors.primary,
  completed: colors.primaryEnd,
  abandoned: colors.textDisabled,
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} `
    + `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminScreen({ navigation }) {
  const [authed, setAuthed]           = useState(false);
  const [credentials, setCredentials] = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [authError, setAuthError]     = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('Interviews');
  const [selectedId, setSelectedId] = useState(null);

  const [interviews, setInterviews]               = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewsError, setInterviewsError]     = useState(null);

  const [turns, setTurns]               = useState([]);
  const [turnsLoading, setTurnsLoading] = useState(false);
  const [turnsError, setTurnsError]     = useState(null);

  const [report, setReport]               = useState(undefined); // undefined = 아직 미로드
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError]     = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (typeof document !== 'undefined') document.title = 'Nitor8 Admin';
    }, [])
  );

  useEffect(() => {
    if (authed) loadInterviews();
  }, [authed]);

  useEffect(() => {
    if (authed && activeTab === 'Report' && report === undefined) loadReport();
  }, [activeTab, authed]);

  useEffect(() => {
    if (authed && selectedId) loadTurns(selectedId);
  }, [selectedId]);

  async function handleLogin() {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const creds = btoa(`${username}:${password}`);
      const res = await fetch(`${BASE_URL}/api/admin/feedback-interviews`, {
        headers: { Authorization: `Basic ${creds}` },
      });
      if (res.status === 401) {
        setAuthError('Invalid credentials');
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);
      setCredentials(creds);
      setAuthed(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadInterviews() {
    setInterviewsLoading(true);
    setInterviewsError(null);
    try {
      const res = await adminGet('/api/admin/feedback-interviews', credentials);
      setInterviews(res.data || []);
    } catch (err) {
      setInterviewsError(err.message);
    } finally {
      setInterviewsLoading(false);
    }
  }

  async function loadTurns(id) {
    setTurnsLoading(true);
    setTurnsError(null);
    try {
      const res = await adminGet(`/api/admin/feedback-interviews/${id}/turns`, credentials);
      setTurns(res.data || []);
    } catch (err) {
      setTurnsError(err.message);
    } finally {
      setTurnsLoading(false);
    }
  }

  async function loadReport() {
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await adminGet('/api/admin/feedback-report', credentials);
      setReport(res.data); // null = 리포트 없음
    } catch (err) {
      setReportError(err.message);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }

  function selectInterview(id) {
    setSelectedId(id);
    setActiveTab('Chat Logs');
  }

  if (!authed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Admin Login</Text>
          <TextInput
            style={styles.loginInput}
            placeholder="Username"
            placeholderTextColor={colors.placeholder}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.loginInput}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}
          <TouchableOpacity
            onPress={handleLogin}
            style={styles.loginBtn}
            disabled={authLoading}
          >
            {authLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.loginBtnText}>Enter</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Intro')} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── 탭 1: Interviews ── */}
        {activeTab === 'Interviews' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.tabHeadline}>Feedback Interviews</Text>
              <TouchableOpacity onPress={loadInterviews} style={styles.refreshBtn}>
                <Text style={styles.refreshText}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>

            {interviewsLoading && (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
            {interviewsError && (
              <Text style={styles.errorText}>{interviewsError}</Text>
            )}
            {!interviewsLoading && !interviewsError && interviews.length === 0 && (
              <Text style={styles.emptyText}>No feedback interviews yet.</Text>
            )}
            {interviews.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.listCard, selectedId === item.id && styles.listCardSelected]}
                onPress={() => selectInterview(item.id)}
              >
                <View style={styles.listCardRow}>
                  <Text style={styles.respondentName}>
                    {item.respondent_name || '(anonymous)'}
                  </Text>
                  <Text style={[styles.statusChip, { color: STATUS_COLOR[item.status] || colors.textDisabled }]}>
                    {item.status}
                  </Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                {item.response_count != null && (
                  <Text style={styles.metaText}>{item.response_count} responses</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── 탭 2: Chat Logs ── */}
        {activeTab === 'Chat Logs' && (
          <View>
            {!selectedId && (
              <Text style={styles.emptyText}>Select an interview from the Interviews tab.</Text>
            )}
            {selectedId && turnsLoading && (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
            {selectedId && turnsError && (
              <Text style={styles.errorText}>{turnsError}</Text>
            )}
            {selectedId && !turnsLoading && !turnsError && (
              <View>
                {turns.length === 0 && (
                  <Text style={styles.emptyText}>No messages yet.</Text>
                )}
                {turns.map((turn, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bubble,
                      turn.role === 'assistant' ? styles.bubbleAssistant : styles.bubbleUser,
                    ]}
                  >
                    <Text style={styles.bubbleRole}>
                      {turn.role === 'assistant' ? 'Nitor' : 'User'}
                    </Text>
                    <Text style={styles.bubbleContent}>{turn.content}</Text>
                    {turn.section && (
                      <Text style={styles.bubbleMeta}>[{turn.section}]</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── 탭 3: Report ── */}
        {activeTab === 'Report' && (
          <View>
            {reportLoading && (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
            {reportError && (
              <Text style={styles.errorText}>{reportError}</Text>
            )}
            {!reportLoading && !reportError && report === null && (
              <Text style={styles.emptyText}>No report yet.</Text>
            )}
            {!reportLoading && !reportError && report && (
              <CompletedAggregateReport report={report} />
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loginTitle: { ...textStyles.h3, color: colors.textSecondary, marginBottom: spacing.sm },
  loginInput: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
  },
  authErrorText: { fontSize: 13, color: colors.primaryEnd, textAlign: 'center' },
  loginBtn: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn:     { width: 60 },
  backText:    { fontSize: 14, color: colors.primary, fontWeight: '500' },
  headerTitle: { ...textStyles.h3, color: colors.textSecondary },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryMid,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDisabled,
  },
  tabTextActive: {
    color: colors.textSecondary,
    fontWeight: '700',
  },

  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tabHeadline: { ...textStyles.h3, color: colors.textSecondary },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshText: { fontSize: 12, color: colors.textSecondary },

  centered: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...textStyles.caption, color: colors.textDisabled, textAlign: 'center', paddingVertical: spacing.xl },
  errorText: { fontSize: 14, color: colors.primaryEnd, textAlign: 'center', paddingVertical: spacing.md },

  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  listCardSelected: {
    borderColor: colors.primaryMid,
  },
  listCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  respondentName: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  statusChip:     { fontSize: 12, fontWeight: '700' },
  dateText:       { fontSize: 12, color: colors.textDisabled },
  metaText:       { fontSize: 12, color: colors.placeholder },

  bubble: {
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: '80%',
    gap: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleRole: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubbleContent: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  bubbleMeta:    { fontSize: 11, color: colors.placeholder, fontStyle: 'italic' },
});

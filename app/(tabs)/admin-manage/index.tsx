// app/(tabs)/admin-manage/index.tsx
// 관리자 전용: 목사 가입 승인 + 전체 가입자 관리

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  AppButton,
  Avatar,
  Chip,
  FilterTabs,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
  useTabBarOverlap,
} from '../../../components/ui/primitives';
import { Palette, Radius, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { PastorRequest, UserSummary } from '../../../types/user';
import { api } from '../../../utils/api';
import { formatDate } from '../../../utils/date';

type Section = 'REQUESTS' | 'USERS';

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'REQUESTS', label: '승인 요청' },
  { value: 'USERS', label: '가입자' },
];

const STATUS_TONE: Record<string, { label: string; fg: string; bg: string }> = {
  ACTIVE: { label: '사용 중', fg: Palette.onSuccessContainer, bg: Palette.successContainer },
  PENDING_PASTOR_APPROVAL: {
    label: '승인 대기',
    fg: Palette.onWarningContainer,
    bg: Palette.warningContainer,
  },
  REJECTED: { label: '거절됨', fg: Palette.onSurfaceVariant, bg: Palette.surfaceVariant },
  SUSPENDED: { label: '정지됨', fg: Palette.onDangerContainer, bg: Palette.dangerContainer },
  WITHDRAWN: { label: '탈퇴함', fg: Palette.onSurfaceVariant, bg: Palette.surfaceVariant },
};

export default function AdminManageScreen() {
  const insets = useSafeAreaInsets();
  const tabBarOverlap = useTabBarOverlap();
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();

  const [section, setSection] = useState<Section>('REQUESTS');
  const [requests, setRequests] = useState<PastorRequest[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingID, setProcessingID] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsRes, usersRes] = await Promise.all([
        api.get<PastorRequest[]>('/admin/pastor-requests'),
        api.get<UserSummary[]>('/admin/users'),
      ]);
      setRequests(requestsRes.data);
      setUsers(usersRes.data);
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const visibleUsers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.loginID.toLowerCase().includes(q)
    );
  }, [users, keyword]);

  // ── 목사 승인 ─────────────────────────────────────────
  const handleRespond = async (item: PastorRequest, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const ok = await confirm({
        title: `${item.name}님의 목사 신청을 거절할까요?`,
        message: '거절하면 해당 계정은 목사 권한을 받지 못합니다.',
        confirmLabel: '거절',
        destructive: true,
      });
      if (!ok) return;
    }

    setProcessingID(item.userId);
    try {
      await api.post(`/admin/pastor-requests/${item.userId}/${action}`);
      await fetchData();
      toast(
        action === 'approve' ? `${item.name}님을 목사님으로 승인했어요.` : '신청을 거절했어요.',
        action === 'approve' ? 'success' : 'info'
      );
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setProcessingID(null);
    }
  };

  // ── 비밀번호 초기화 ───────────────────────────────────
  const handleResetPassword = async (target: UserSummary) => {
    const ok = await confirm({
      title: `${target.name}님의 비밀번호를 초기화할까요?`,
      message: '임시 비밀번호를 새로 만들어 알려드립니다. 기존 비밀번호는 쓸 수 없게 됩니다.',
      confirmLabel: '초기화',
    });
    if (!ok) return;

    setProcessingID(target.userId);
    try {
      const res = await api.post<{ temporaryPassword: string }>(
        `/admin/users/${target.userId}/reset-password`
      );
      await confirm({
        title: '임시 비밀번호',
        message:
          `${target.name}(@${target.loginID})님의 임시 비밀번호입니다.\n\n` +
          `${res.data.temporaryPassword}\n\n` +
          '이 창을 닫으면 다시 볼 수 없어요. 본인에게 전달하고 로그인 후 바꾸도록 안내해주세요.',
        confirmLabel: '확인했어요',
        hideCancel: true,
      });
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setProcessingID(null);
    }
  };

  // ── 탈퇴 처리 ─────────────────────────────────────────
  const handleWithdraw = async (target: UserSummary) => {
    const ok = await confirm({
      title: `${target.name}님을 탈퇴 처리할까요?`,
      message:
        `아이디 "${target.loginID}"가 풀려서 같은 아이디로 다시 가입할 수 있게 됩니다.

` +
        '작성한 기도와 댓글은 "탈퇴한 사용자" 이름으로 남습니다. 되돌릴 수 없어요.',
      confirmLabel: '탈퇴 처리',
      destructive: true,
    });
    if (!ok) return;

    setProcessingID(target.userId);
    try {
      await api.delete(`/admin/users/${target.userId}`);
      await fetchData();
      toast(`탈퇴 처리했어요. 아이디 "${target.loginID}"를 다시 쓸 수 있습니다.`, 'success');
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setProcessingID(null);
    }
  };

  // ── 계정 정지 / 해제 ──────────────────────────────────
  const handleToggleSuspend = async (target: UserSummary) => {
    const suspended = target.accountStatus === 'SUSPENDED';

    if (!suspended) {
      const ok = await confirm({
        title: `${target.name}님의 계정을 정지할까요?`,
        message: '로그인만 막힙니다. 작성한 기도와 댓글은 그대로 남고, 나중에 되돌릴 수 있어요.',
        confirmLabel: '정지',
        destructive: true,
      });
      if (!ok) return;
    }

    setProcessingID(target.userId);
    try {
      await api.patch(`/admin/users/${target.userId}/${suspended ? 'activate' : 'suspend'}`);
      await fetchData();
      toast(suspended ? '정지를 해제했어요.' : '계정을 정지했어요.', 'success');
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setProcessingID(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="승인 관리"
        subtitle={
          requests.length > 0
            ? `승인을 기다리는 신청 ${requests.length}건`
            : `전체 가입자 ${users.length}명`
        }
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      <FilterTabs options={SECTIONS} value={section} onChange={setSection} />

      {section === 'USERS' && (
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={Palette.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="이름 또는 아이디로 검색"
            placeholderTextColor={Palette.disabled}
          />
        </View>
      )}

      {isLoading ? (
        <SkeletonList count={3} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarOverlap + Spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {section === 'REQUESTS' ? (
            requests.length === 0 ? (
              <Text style={styles.emptyText}>처리할 목사 신청이 없어요.</Text>
            ) : (
              <View style={styles.cards}>
                {requests.map((item) => (
                  <SurfaceCard key={item.userId} style={styles.card}>
                    <View style={styles.personRow}>
                      <Avatar name={item.name} size={44} />
                      <View style={styles.personText}>
                        <Text style={styles.personName}>{item.name}</Text>
                        <Text style={styles.personMeta}>
                          @{item.loginID} · {formatDate(item.requestedAt)} 신청
                        </Text>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <AppButton
                        label="거절"
                        variant="outlined"
                        onPress={() => handleRespond(item, 'reject')}
                        disabled={processingID === item.userId}
                        style={styles.actionButton}
                      />
                      <AppButton
                        label="승인"
                        onPress={() => handleRespond(item, 'approve')}
                        loading={processingID === item.userId}
                        style={styles.actionButton}
                      />
                    </View>
                  </SurfaceCard>
                ))}
              </View>
            )
          ) : visibleUsers.length === 0 ? (
            <Text style={styles.emptyText}>
              {keyword.trim() ? '검색 결과가 없어요.' : '가입자가 없어요.'}
            </Text>
          ) : (
            <View style={styles.cards}>
              {visibleUsers.map((item) => {
                const suspended = item.accountStatus === 'SUSPENDED';
                const withdrawn = item.accountStatus === 'WITHDRAWN';
                const isSelf = item.loginID === user?.loginID;

                return (
                  <SurfaceCard key={item.userId} style={styles.card}>
                    <View style={styles.personRow}>
                      <Avatar name={item.name} size={44} />
                      <View style={styles.personText}>
                        <Text style={styles.personName}>{item.name}</Text>
                        <Text style={styles.personMeta}>@{item.loginID}</Text>
                      </View>
                    </View>

                    <View style={styles.chipRow}>
                      <Chip
                        tone={{
                          label: item.role,
                          fg: Palette.onPrimaryContainer,
                          bg: Palette.primaryContainer,
                        }}
                      />
                      <Chip tone={STATUS_TONE[item.accountStatus] ?? STATUS_TONE.ACTIVE} />
                      {item.createdAt && (
                        <Text style={styles.joined}>{formatDate(item.createdAt)} 가입</Text>
                      )}
                    </View>

                    {!isSelf && !withdrawn && (
                      <>
                        <View style={styles.actions}>
                          <AppButton
                            label="비번 초기화"
                            variant="outlined"
                            onPress={() => handleResetPassword(item)}
                            disabled={processingID === item.userId}
                            style={styles.actionButton}
                          />
                          <AppButton
                            label={suspended ? '정지 해제' : '계정 정지'}
                            variant={suspended ? 'tonal' : 'danger'}
                            onPress={() => handleToggleSuspend(item)}
                            loading={processingID === item.userId}
                            style={styles.actionButton}
                          />
                        </View>
                        <AppButton
                          label="탈퇴 처리 (아이디 비우기)"
                          icon="account-off-outline"
                          variant="text"
                          fullWidth
                          onPress={() => handleWithdraw(item)}
                          disabled={processingID === item.userId}
                        />
                      </>
                    )}
                  </SurfaceCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
  },
  searchInput: {
    flex: 1,
    fontSize: Type.bodyMedium.fontSize,
    color: Palette.onSurface,
    paddingVertical: 0,
  },

  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs },
  cards: { gap: Spacing.md },
  card: { gap: Spacing.md },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  personText: { flexShrink: 1 },
  personName: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onSurface,
  },
  personMeta: {
    fontSize: Type.labelSmall.fontSize,
    fontWeight: '400',
    color: Palette.onSurfaceVariant,
    marginTop: 1,
  },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  joined: { fontSize: Type.labelSmall.fontSize, fontWeight: '400', color: Palette.onSurfaceVariant },

  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1, minHeight: 44 },

  emptyText: {
    fontSize: Type.bodyMedium.fontSize,
    color: Palette.onSurfaceVariant,
    paddingVertical: Spacing.xxl,
    textAlign: 'center',
  },
});

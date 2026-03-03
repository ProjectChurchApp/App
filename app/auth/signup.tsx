import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { width, height } = useWindowDimensions();

  const [loginID, setLoginID] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'목사' | '신도'>('신도');
  const [isLoading, setIsLoading] = useState(false);

  // 반응형: 최대 너비 제한
  const formWidth = Math.min(width * 0.9, 440);

  const handleSignup = async () => {
    const showAlert = (message: string) => {
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('알림', message); // 플랫폼 대응 UI
    }
  };

  if (!loginID.trim()) {
    showAlert('아이디를 입력해주세요.');
    return;
  }
  if (!name.trim()) {
    showAlert('이름을 입력해주세요.');
    return;
  }
    if (!loginID.trim()) { alert('아이디를 입력해주세요.'); return; }
    if (!name.trim()) { alert('이름을 입력해주세요.'); return; }
    if (password !== confirmPassword) { alert('비밀번호가 일치하지 않습니다.'); return; }
    if (password.length < 6) { alert('비밀번호는 6자 이상이어야 합니다.'); return; }

    try {
      setIsLoading(true);
      await signup(loginID, password, name, role);
    } catch (error: any) {
      alert(error.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* 화면 중앙 정렬 래퍼 */}
        <View style={styles.centerWrapper}>
          <View style={[styles.card, { width: formWidth }]}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>새로운 계정을 만드세요</Text>

            <View style={styles.form}>
              {/* 아이디 */}
              <TextInput
                style={styles.input}
                placeholder="아이디"
                placeholderTextColor="#999"
                value={loginID}
                onChangeText={setLoginID}
                autoCapitalize="none"
              />

              {/* 이름 */}
              <TextInput
                style={styles.input}
                placeholder="이름"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />

              {/* 역할 선택 */}
              <View>
                <Text style={styles.roleLabel}>역할 선택</Text>
                <View style={styles.roleContainer}>
                  {(['신도', '목사'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleButton, role === r && styles.roleButtonActive]}
                      onPress={() => setRole(r)}>
                      <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 비밀번호 */}
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* 비밀번호 확인 */}
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}>
                <Text style={styles.signupButtonText}>
                  {isLoading ? '처리 중...' : '회원가입'}
                </Text>
              </TouchableOpacity>

              <View style={styles.linkRow}>
                <Text style={styles.linkText}>이미 계정이 있으신가요? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.linkBold}>로그인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center', 
    alignItems: 'center',     
  },
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  card: {},
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  roleLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  roleButtonActive: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#999999',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#666666',
  },
  linkBold: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
});
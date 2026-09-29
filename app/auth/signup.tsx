import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { Role } from '../../types/user';
import { useFeedback } from '../../components/ui/Feedback';
import { Palette } from '../../constants/design';

// 백엔드 PasswordValidator와 동일한 규칙: 8자 이상, 영문/숫자/특수문자(@$!%*#?&) 각 1개 이상
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { width, height } = useWindowDimensions();

  const [loginID, setLoginID] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Extract<Role, '목사' | '성도'>>('성도');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useFeedback();

  // 반응형: 최대 너비 제한
  const formWidth = Math.min(width * 0.9, 440);

  const showAlert = (message: string) => toast(message, 'error');

  const handleSignup = async () => {
    if (!loginID.trim()) {
      showAlert('아이디를 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      showAlert('이름을 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      showAlert('비밀번호는 8자 이상이며 영문, 숫자, 특수문자(@$!%*#?&)를 포함해야 합니다.');
      return;
    }

    try {
      setIsLoading(true);
      await signup(loginID, password, name, role);
    } catch (error: any) {
      showAlert(error.message || '회원가입에 실패했습니다.');
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
                  {(['성도', '목사'] as const).map((r) => (
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
                {role === '목사' && (
                  <Text style={styles.roleHint}>
                    목사님 가입은 관리자 승인 후 활성화됩니다.
                  </Text>
                )}
              </View>

              {/* 비밀번호 */}
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Text style={styles.passwordHint}>
                  8자 이상, 영문·숫자·특수문자(@$!%*#?&) 포함
                </Text>
              </View>

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
    color: Palette.onSurface,
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
  roleHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
    marginLeft: 2,
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
    borderColor: Palette.primary,
    backgroundColor: Palette.primary,
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
    backgroundColor: Palette.primary,
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
    color: Palette.onSurface,
    fontWeight: '600',
  },
});
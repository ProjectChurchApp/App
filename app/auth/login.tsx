import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../../contexts/AuthContext';
import { clearRememberedLoginID, getRememberedLoginID, saveRememberedLoginID } from '../../utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { width, height } = useWindowDimensions();

  const [loginID, setLoginID] = useState('');
  const [password, setPassword] = useState('');
  const [rememberID, setRememberID] = useState(false);

  // 반응형: 최대 너비 제한 (태블릿 대응)
  const formWidth = Math.min(width * 0.9, 440);

  useEffect(() => {
    (async () => {
      const remembered = await getRememberedLoginID();
      if (remembered) {
        setLoginID(remembered);
        setRememberID(true);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!loginID.trim()) {
      Alert.alert('오류', '아이디를 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }
    try {
      await login(loginID, password);
      if (rememberID) {
        await saveRememberedLoginID(loginID.trim());
      } else {
        await clearRememberedLoginID();
      }
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const goToSignup = () => {
    router.push('/auth/signup');
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
            <Text style={styles.title}>로그인</Text>
            <Text style={styles.subtitle}>계정에 로그인하세요</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="아이디"
                placeholderTextColor="#999"
                value={loginID}
                onChangeText={setLoginID}
                autoCapitalize="none"
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />

              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberID((prev) => !prev)}
                disabled={isLoading}
                activeOpacity={0.7}>
                <View style={[styles.checkbox, rememberID && styles.checkboxChecked]}>
                  {rememberID && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>아이디 저장</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>로그인</Text>
                )}
              </TouchableOpacity>

              <View style={styles.linkRow}>
                <Text style={styles.linkText}>계정이 없으신가요? </Text>
                <TouchableOpacity onPress={goToSignup} disabled={isLoading}>
                  <Text style={styles.linkBold}>회원가입</Text>
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
  card: {
  },
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#BBBBBB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rememberText: {
    fontSize: 14,
    color: '#666666',
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  loginButtonText: {
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

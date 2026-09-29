import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { errorMessage, useFeedback } from '../../components/ui/Feedback';
import { AppButton } from '../../components/ui/primitives';
import { Palette, Radius, Spacing, Type } from '../../constants/design';
import { useAuth } from '../../contexts/AuthContext';
import {
  clearRememberedLoginID,
  getRememberedLoginID,
  saveRememberedLoginID,
} from '../../utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const { toast } = useFeedback();

  const [loginID, setLoginID] = useState('');
  const [password, setPassword] = useState('');
  const [rememberID, setRememberID] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formWidth = Math.min(width * 0.9, 420);

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
      toast('아이디를 입력해주세요.', 'error');
      return;
    }
    if (!password.trim()) {
      toast('비밀번호를 입력해주세요.', 'error');
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
      toast(errorMessage(error, '아이디 또는 비밀번호가 올바르지 않습니다.'), 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { width: formWidth }]}>
          <Image
            source={require('../../assets/images/logo_fix.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="하트기도365"
          />

          <Text style={styles.title}>로그인</Text>
          <Text style={styles.subtitle}>계정에 로그인하세요</Text>

          <View style={styles.form}>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={Palette.onSurfaceVariant}
              />
              <TextInput
                style={styles.input}
                placeholder="아이디"
                placeholderTextColor={Palette.disabled}
                value={loginID}
                onChangeText={setLoginID}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={Palette.onSurfaceVariant}
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor={Palette.disabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                style={styles.eyeButton}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Palette.onSurfaceVariant}
                />
              </Pressable>
            </View>

            <Pressable
              style={styles.rememberRow}
              onPress={() => setRememberID((prev) => !prev)}
              disabled={isLoading}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberID }}
              hitSlop={6}
            >
              <View style={[styles.checkbox, rememberID && styles.checkboxChecked]}>
                {rememberID && (
                  <MaterialCommunityIcons name="check" size={14} color={Palette.onPrimary} />
                )}
              </View>
              <Text style={styles.rememberText}>아이디 저장</Text>
            </Pressable>

            <AppButton
              label="로그인"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>계정이 없으신가요? </Text>
              <Pressable
                onPress={() => router.push('/auth/signup')}
                disabled={isLoading}
                hitSlop={8}
                accessibilityRole="link"
              >
                <Text style={styles.linkBold}>회원가입</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  card: { alignItems: 'stretch' },

  logo: {
    width: 150,
    height: 165,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },

  title: {
    fontSize: Type.headlineSmall.fontSize,
    fontWeight: Type.headlineSmall.fontWeight,
    color: Palette.onSurface,
  },
  subtitle: {
    fontSize: Type.bodyMedium.fontSize,
    color: Palette.onSurfaceVariant,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },

  form: { gap: Spacing.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 54,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.outline,
    backgroundColor: Palette.surfaceVariant,
  },
  input: {
    flex: 1,
    fontSize: Type.bodyLarge.fontSize,
    color: Palette.onSurface,
    paddingVertical: 0,
  },
  eyeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  rememberText: { fontSize: Type.bodyMedium.fontSize, color: Palette.onSurfaceVariant },

  loginButton: { marginTop: Spacing.xs },

  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  linkText: { fontSize: Type.bodyMedium.fontSize, color: Palette.onSurfaceVariant },
  linkBold: {
    fontSize: Type.bodyMedium.fontSize,
    color: Palette.primary,
    fontWeight: '700',
  },
});

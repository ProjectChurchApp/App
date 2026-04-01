// contexts/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../utils/api';
import { registerPushToken } from '../utils/api';

interface User {
  loginID: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (loginID: string, password: string) => Promise<void>;
  signup: (loginID: string, password: string, name: string, role: '목사' | '신도') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading || hasLoggedInBefore === null) return;

    const seg = segments as string[];
    const inAuthGroup = seg[0] === 'auth';
    const isAtRoot = seg.length === 0 || seg[0] === 'index';

    if (!user) {
      if (hasLoggedInBefore) {
        if (!inAuthGroup) {
          router.replace('/auth/login');
        }
      } else {
        if (!isAtRoot && !inAuthGroup) {
          router.replace('/');
        }
      }
    } else {
      if (inAuthGroup || isAtRoot) {
        router.replace('/(tabs)');
      }
    }
  }, [user, segments, isLoading, hasLoggedInBefore]);

  const checkAuth = async () => {
    try {
      const [accessToken, wasLoggedOut] = await Promise.all([
        api.getAccessToken(),
        AsyncStorage.getItem('wasLoggedOut'),
      ]);

      setHasLoggedInBefore(wasLoggedOut === 'true');

      if (!accessToken) return;

      const userInfo = await api.getUserInfo();
      setUser(userInfo);
      console.log('registerPushToken 호출 전');
      await registerPushToken(); // ← 추가
      console.log('registerPushToken 호출 후');
    } catch (error) {
      await api.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginID: string, password: string) => {
  try {
    setIsLoading(true);
    const response = await api.login(loginID, password);
    
    // 1. API 응답 성공 여부 확인
    if (!response.success) throw new Error(response.message || '로그인 실패');

    // 2. 저장소 및 상태 업데이트
    await AsyncStorage.removeItem('wasLoggedOut');
    
    // 3. 사용자 정보 가져오기 (이 과정에서 에러가 나면 setUser가 안 됨)
    const userInfo = await api.getUserInfo();
    
    // 4. 상태 업데이트 (이 순서가 중요합니다)
    setHasLoggedInBefore(false); 
    setUser(userInfo); // user가 null이 아니게 되면서 useEffect가 실행됨
    console.log('registerPushToken 호출 전');
    await registerPushToken(); // ← 추가
    console.log('registerPushToken 호출 후');
  } catch (error: any) {
    console.error("Login process error:", error); // 에러 로그 확인 필수
    throw new Error(error.response?.data?.message || error.message || '로그인에 실패했습니다.');
  } finally {
    setIsLoading(false); // 마지막에 반드시 false로 바꿔줘야 useEffect의 return문을 통과함
  }
};

  // signup은 isLoading 직접 관리 안 함 → login에 위임
  const signup = async (loginID: string, password: string, name: string, role:'목사' | '신도') => {
    try {
      const response = await api.signup({ loginID, password, name, role });
      if (!response.success) {
        throw new Error(response.message || '회원가입 실패');
      }
      await login(loginID, password);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || '회원가입에 실패했습니다.');
    }
  };

 // contexts/AuthContext.tsx

const logout = async () => {
  setIsLoading(true);
  try {
    await api.logout(); 
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    await AsyncStorage.setItem('wasLoggedOut', 'true').catch(() => {});
    
    // 상태만 변경하면 상단의 useEffect가 세그먼트를 감시하여 리다이렉트합니다.
    setUser(null);
    setHasLoggedInBefore(true);
    setIsLoading(false);
  }
};

  const refreshUser = async () => {
    try {
      const userInfo = await api.getUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('사용자 정보 갱신 실패:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
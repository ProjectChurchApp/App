import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const ACCESS_TOKEN_KEY  = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== Token 관리 ====================

const isWeb = Platform.OS === 'web';

export const saveAccessToken = async (token: string) => {
  if (isWeb) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  }
};

export const saveRefreshToken = async (token: string) => {
  if (isWeb) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  }
};

export const getAccessToken = async () => {
  return isWeb
    ? AsyncStorage.getItem(ACCESS_TOKEN_KEY)
    : SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return isWeb
    ? AsyncStorage.getItem(REFRESH_TOKEN_KEY)
    : SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const clearTokens = async () => {
  if (isWeb) {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  } else {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  }
};

// ==================== 요청 인터셉터 ====================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const publicEndpoints = ['/auth/login', '/auth/signup', '/auth/refresh'];
    const isPublic = publicEndpoints.some(e => config.url?.includes(e));

    if (!isPublic) {
      const token = await getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== 응답 인터셉터 ====================

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (r?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;

        await saveAccessToken(accessToken);
        if (newRefresh) await saveRefreshToken(newRefresh);

        processQueue(null, accessToken);
        isRefreshing = false;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);

      } catch (e) {
        processQueue(e, null);
        isRefreshing = false;
        await clearTokens();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== API 함수 ====================

export interface LoginResponse {
  success: boolean;
  message: string;
  username: string;
  role: string;
  token: string;
  refreshToken?: string;
}

export const login = async (loginID: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { loginID, password });
  const data = response.data;
  console.log('로그인 성공:', data.username);

  if (data.token)        await saveAccessToken(data.token);
  if (data.refreshToken) await saveRefreshToken(data.refreshToken);

  return data;
};

export interface SignupRequest {
  loginID: string;
  password: string;
  name: string;
  role?: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  loginID: string;
  role: string;
}

export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await api.post<SignupResponse>('/auth/signup', data);
  console.log('회원가입 응답:', JSON.stringify(response.data));
  return response.data;
};

export const logout = async (): Promise<void> => {
  // 토큰 삭제 전에 서버 요청 먼저 완료 (403 방지)
  try {
    await Promise.race([
      api.post('/auth/logout'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('logout timeout')), 3000)
      ),
    ]);
  } catch (e) {
    console.log('서버 logout 무시:', (e as any)?.response?.status);
  }

  await clearTokens();
};

export interface UserInfo {
  loginID: string;
  name: string;
  role: string;
}

export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await api.get<Partial<UserInfo>>('/auth/me');
  const data = response.data;

  console.log('getUserInfo 응답:', JSON.stringify(data));

  if (!data.loginID || !data.name || !data.role) {
    throw new Error('서버로부터 사용자 정보가 완전하지 않습니다.');
  }

  return {
    loginID: data.loginID,
    name: data.name,
    role: data.role,
  };
};

export const testAuth = async (): Promise<any> => {
  const response = await api.get('/auth/test');
  return response.data;
};

// ==================== 푸시 알림 ====================

export async function registerPushToken() {
  console.log('registerPushToken 호출됨');
  console.log('isDevice:', Device.isDevice);
  console.log('isWeb:', isWeb);
  // 웹 또는 실기기가 아니면 무시
  if (isWeb || !Device.isDevice) {
    console.log('푸시 알림: 실기기에서만 사용 가능');
    return;
  }

  // 알림 권한 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('푸시 알림 권한 거부됨');
    return;
  }

  // Android 알림 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  // Expo 푸시 토큰 발급
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  // 백엔드에 토큰 저장
  try {
    await api.post('/notification/token', { token: tokenData.data });
    console.log('푸시 토큰 저장 완료:', tokenData.data);
  } catch (e) {
    console.error('푸시 토큰 저장 실패:', e);
  }
}
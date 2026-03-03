import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const ACCESS_TOKEN_KEY  = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ROLE_KEY     = 'user_role'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== Token / Role 관리 ====================

// 토큰 저장 (AsyncStorage 대신 SecureStore 사용)
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
  return isWeb ? AsyncStorage.getItem(ACCESS_TOKEN_KEY) : SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return isWeb ? AsyncStorage.getItem(REFRESH_TOKEN_KEY) : SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const clearTokens = async () => {
  const promises = [
    AsyncStorage.removeItem(USER_ROLE_KEY)
  ];

  if (isWeb) {
    promises.push(AsyncStorage.removeItem(ACCESS_TOKEN_KEY));
    promises.push(AsyncStorage.removeItem(REFRESH_TOKEN_KEY));
  } else {
    promises.push(SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY));
    promises.push(SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY));
  }

  await Promise.all(promises);
};
export const saveUserRole = async (role: string) => {
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
};

export const getSavedUserRole = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_ROLE_KEY);
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

  // accessToken, refreshToken, role 모두 저장
  if (data.token)        await saveAccessToken(data.token);
  if (data.refreshToken) await saveRefreshToken(data.refreshToken);
  if (data.role)         await saveUserRole(data.role);

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
  api.post('/auth/logout').catch((e) => {
    console.log('서버 logout 무시:', e?.response?.status);
  });
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

  if (!data.loginID || !data.name) {
    throw new Error('서버로부터 사용자 정보가 완전하지 않습니다.');
  }

  const role = data.role || (await getSavedUserRole()) || '신도';

  return {
    loginID: data.loginID, 
    name: data.name,
    role: role,
  };
};

export const testAuth = async (): Promise<any> => {
  const response = await api.get('/auth/test');
  return response.data;
};
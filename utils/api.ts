import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://168.107.57.64/api';

const ACCESS_TOKEN_KEY  = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ROLE_KEY     = 'user_role'; // ✅ role 별도 저장

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== Token / Role 관리 ====================

export const saveAccessToken = async (token: string) => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const saveRefreshToken = async (token: string) => {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getAccessToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

// ✅ role 저장/조회
export const saveUserRole = async (role: string) => {
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
};

export const getSavedUserRole = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_ROLE_KEY);
};

export const clearTokens = async () => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_ROLE_KEY]);
  console.log('모든 토큰/role 삭제 완료');
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
  console.log('로그인 응답:', JSON.stringify(data));

  // ✅ accessToken, refreshToken, role 모두 저장
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

  const role = data.role || (await getSavedUserRole()) || '신도';

  return {
    loginID: data.loginID!,
    name: data.name!,
    role,
  };
};

export const testAuth = async (): Promise<any> => {
  const response = await api.get('/auth/test');
  return response.data;
};
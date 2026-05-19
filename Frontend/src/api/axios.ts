import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/** Dev: `/api` + Vite proxy keeps cookies on the SPA origin. Prod: explicit URL or `:5000` fallback */
function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim?.();
  if (fromEnv) return fromEnv;
  if (typeof window === 'undefined') return '/api';
  if (import.meta.env.DEV) return '/api';
  return `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000/api`;
}

const DEFAULT_API_URL = resolveApiBaseUrl();

function requestUrlPath(cfg: InternalAxiosRequestConfig | undefined): string {
  const u = String(cfg?.url ?? '');
  const base = String(cfg?.baseURL ?? '').replace(/\/$/, '');
  if (!u) return '';
  if (u.startsWith('http')) {
    try {
      return new URL(u).pathname + new URL(u).search;
    } catch {
      return u;
    }
  }
  const rel = u.startsWith('/') ? u : `/${u}`;
  if (!base) return rel;
  return `${base}${rel}`;
}

function isRefreshEndpoint(path: string): boolean {
  return /(^|\/)auth\/refresh-token(\?|$|\/?)/i.test(path) || /auth[\/.]refresh-token/i.test(path);
}

function skipAuthRefresh(path: string): boolean {
  return (
    /(^|\/)auth\/login(\?|$)/i.test(path) ||
    /(^|\/)auth\/register(\?|$)/i.test(path) ||
    /(^|\/)auth\/logout(\?|$)/i.test(path) ||
    /(^|\/)auth\/forgot-password(\?|$)/i.test(path) ||
    /(^|\/)auth\/google/i.test(path)
  );
}

const stripAuthHeaders = (c: InternalAxiosRequestConfig) => {
  if (c.headers) {
    delete c.headers.Authorization;
    delete (c.headers as Record<string, unknown>).authorization;
  }
};

/** No response interceptor → refresh never recurses through 401 logic */
const refreshClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 30000,
  withCredentials: true,
});

refreshClient.interceptors.request.use((config) => {
  stripAuthHeaders(config);
  return config;
});

const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  stripAuthHeaders(config);
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

const refreshSession = async (): Promise<boolean> => {
  const response = await refreshClient.post('/auth/refresh-token');
  if (!response.data?.success) throw new Error('Refresh failed');

  const userData = response.data.user as Record<string, unknown> | undefined;
  if (userData) {
    const user = {
      id: userData.userId || userData.id || userData._id,
      email: userData.email,
      name: userData.username || userData.name,
      role: userData.role,
      avatar: userData.profilePicture,
    };
    localStorage.setItem('safedonate_user', JSON.stringify(user));
  }
  return true;
};

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

const subscribeTokenRefresh = (cb: (success: boolean) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (success: boolean) => {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
};

const logoutAndExpireSession = () => {
  localStorage.removeItem('safedonate_token');
  localStorage.removeItem('safedonate_user');
  window.dispatchEvent(new Event('session-expired'));
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
};

api.interceptors.response.use(
  (res) => {
    const p = requestUrlPath(res.config);
    if (p.includes('login')) {
      console.log('[API] Login response received:', res.status);
    }
    return res;
  },
  async (err: AxiosError) => {
    const originalRequest = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!originalRequest) return Promise.reject(err);

    const path = requestUrlPath(originalRequest);

    if (err.response?.status !== 401) return Promise.reject(err);

    console.error('[API] 401', { path, method: originalRequest.method });

    if (originalRequest._retry) {
      logoutAndExpireSession();
      return Promise.reject(err);
    }

    if (skipAuthRefresh(path)) return Promise.reject(err);

    /** Refresh endpoint failed — do not queue behind isRefreshing */
    if (isRefreshEndpoint(path)) {
      logoutAndExpireSession();
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((success) => {
          if (!success) return reject(err);
          api(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshSession();
      onRefreshed(true);
      return await api(originalRequest);
    } catch {
      onRefreshed(false);
      logoutAndExpireSession();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

import axios from 'axios';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname || 'localhost'}:5000/api`
  : '/api');

const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 30000,  // ✅ Increased from 10s to 30s for large uploads/responses
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Remove Authorization header since we use HttpOnly cookies
  // The backend will automatically read accessToken from cookies

  // If sending FormData, let the browser set the proper multipart boundary.
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  return config;
});

const refreshSession = async () => {
  try {
    // Since tokens are in HttpOnly cookies, we just call refresh-token
    // The backend will set new cookies automatically
    const response = await api.post('/auth/refresh-token');

    // Check if refresh was successful (no need to extract token from response)
    if (response.data?.success) {
      // Get the user data from the response
      const userData = response.data.user;
      if (userData) {
        // Update user data in localStorage
        const user = {
          id: userData.userId || userData.id || userData._id,
          email: userData.email,
          name: userData.username || userData.name || '',
          role: userData.role,
          avatar: userData.profilePicture || undefined,
        };
        localStorage.setItem('safedonate_user', JSON.stringify(user));
      }
      return true; // Success indicator
    }
    throw new Error('Refresh failed');
  } catch (refreshError) {
    throw refreshError;
  }
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
    if (res.config.url?.includes('/login')) {
      console.log('[API] Login response received:', {
        status: res.status,
        size: JSON.stringify(res.data).length,
        time: res.headers['x-response-time'] || 'N/A',
      });
    }
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    console.error('[API] Request failed:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: err.response?.status,
      statusText: err.response?.statusText,
      code: err.code,
      message: err.message,
      timeout: originalRequest?.timeout,
      isTimeout: err.code === 'ECONNABORTED',
      size: err.response ? JSON.stringify(err.response.data).length : 'unknown',
    });

    if (err.response?.status === 401 && !originalRequest?._retry) {
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        logoutAndExpireSession();
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((success) => {
            if (!success) return reject(err);
            // Since tokens are in cookies, retry the original request
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshSuccess = await refreshSession();
        onRefreshed(refreshSuccess);
        if (refreshSuccess) {
          // Since tokens are in cookies, retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        onRefreshed(false);
        logoutAndExpireSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (err.response?.status === 401 && originalRequest?._retry) {
      logoutAndExpireSession();
    }

    return Promise.reject(err);
  }
);

export default api;

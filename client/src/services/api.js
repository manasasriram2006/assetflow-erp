import axios from "axios";

const ACCESS_TOKEN_KEY = "assetflow_token";
const REFRESH_TOKEN_KEY = "assetflow_refresh_token";
const USER_KEY = "assetflow_user";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 15000
});

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: ({ token, refreshToken, user }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = authStorage.getRefreshToken();

    if (error.response?.status === 401 && refreshToken && original && !original._retry && original.url !== "/auth/refresh") {
      original._retry = true;
      try {
        const { data } = await api.post("/auth/refresh", { refreshToken });
        authStorage.setSession(data);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        authStorage.clearSession();
      }
    }

    const message = error.response?.data?.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

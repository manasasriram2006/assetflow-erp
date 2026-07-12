import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authStorage } from "../services/api";
import { authApi } from "../services/resources";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => authStorage.getAccessToken());
  const [refreshToken, setRefreshToken] = useState(() => authStorage.getRefreshToken());
  const [user, setUser] = useState(() => authStorage.getUser());
  const [loading, setLoading] = useState(Boolean(authStorage.getAccessToken()));

  const setSession = useCallback(({ token: nextToken, refreshToken: nextRefreshToken, user: nextUser }) => {
    authStorage.setSession({ token: nextToken, refreshToken: nextRefreshToken, user: nextUser });
    setToken(nextToken);
    setRefreshToken(nextRefreshToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (payload) => setSession(await authApi.login(payload)), [setSession]);
  const signup = useCallback(async (payload) => setSession(await authApi.signup(payload)), [setSession]);

  const refreshSession = useCallback(async () => {
    const storedRefreshToken = authStorage.getRefreshToken();
    if (!storedRefreshToken) return null;
    const session = await authApi.refresh(storedRefreshToken);
    setSession(session);
    return session;
  }, [setSession]);

  const updateProfile = useCallback(
    async (payload) => {
      const result = await authApi.updateProfile(payload);
      const nextUser = result.user;
      const nextSession = { token, refreshToken, user: nextUser };
      authStorage.setSession(nextSession);
      setUser(nextUser);
      return nextUser;
    },
    [token, refreshToken]
  );

  const logout = useCallback(async () => {
    try {
      if (authStorage.getAccessToken()) await authApi.logout();
    } catch {
      // Local session cleanup still happens when the server token has already expired.
    }
    authStorage.clearSession();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      if (!authStorage.getAccessToken()) {
        if (active) setLoading(false);
        return;
      }

      try {
        const result = await authApi.me();
        if (active) setUser(result.user);
      } catch {
        try {
          await refreshSession();
        } catch {
          authStorage.clearSession();
          if (active) {
            setToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      user,
      loading,
      login,
      signup,
      logout,
      refreshSession,
      updateProfile,
      isAuthenticated: Boolean(token && user)
    }),
    [token, refreshToken, user, loading, login, signup, logout, refreshSession, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

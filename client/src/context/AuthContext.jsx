import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { authApi } from "../services/resources";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("assetflow_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("assetflow_user");
    return raw ? JSON.parse(raw) : null;
  });

  const setSession = useCallback(({ token: nextToken, user: nextUser }) => {
    localStorage.setItem("assetflow_token", nextToken);
    localStorage.setItem("assetflow_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (payload) => setSession(await authApi.login(payload)), [setSession]);
  const signup = useCallback(async (payload) => setSession(await authApi.signup(payload)), [setSession]);
  const logout = useCallback(() => {
    localStorage.removeItem("assetflow_token");
    localStorage.removeItem("assetflow_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, login, signup, logout, isAuthenticated: Boolean(token) }),
    [token, user, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";
import { authStorage } from "../utils/authStorage";

const AuthContext = createContext(null);

function loadStoredProfile() {
  try {
    return JSON.parse(authStorage.getProfile() || "null");
  } catch {
    authStorage.clear();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(loadStoredProfile);
  const [loading, setLoading] = useState(false);
  const token = authStorage.getToken();

  useEffect(() => {
    if (!token) return;
    refreshProfile().catch(() => logout());
  }, []);

  const refreshProfile = async () => {
    const res = await authApi.profile();
    setProfile(res.data);
    authStorage.setProfile(res.data);
    return res.data;
  };

  const loginPassword = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otp });
      authStorage.setToken(res.data.token);
      authStorage.setProfile(res.data.profile);
      setProfile(res.data.profile);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => authApi.register(data);

  const logout = () => {
    authStorage.clear();
    setProfile(null);
  };

  const value = useMemo(() => ({
    profile,
    loading,
    isAdmin: profile?.roles?.includes("ROLE_ADMIN"),
    isAuthenticated: Boolean(authStorage.getToken()),
    loginPassword,
    verifyOtp,
    register,
    refreshProfile,
    logout
  }), [profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);

      const session = await api.getSession();

      if (!session.authenticated) {
        setUser(null);
        return;
      }

      const profile = await api.getProfile();

      setUser(profile);
    } catch (err) {
      console.error("Authentication check failed:", err);
      setUser(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(() => {
    api.login();
  }, []);

  const logout = useCallback(() => {
    api.logout();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refresh: loadProfile
  };
}

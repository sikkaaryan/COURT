import {
  useCallback,
  useEffect,
  useState
} from "react";
import api from "../lib/api";
import {
  clearAuthError,
  getAuthError,
  redirectToLogin,
  logout as logoutUser
} from "../lib/auth";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(
    () => getAuthError()
  );

  useEffect(() => {
    const authError = getAuthError();

    if (authError) {
      clearAuthError();
    }
  }, []);

  const loadProfile = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const session =
          await api.getSession();

        if (!session.authenticated) {
          setUser(null);
          return;
        }

        const profile =
          await api.getProfile();

        setUser(profile);
      } catch (err) {
        console.error(
          "Authentication check failed:",
          err
        );

        setUser(null);
        setError(
          err.message ||
            "Unable to verify your account."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(() => {
    redirectToLogin();
  }, []);

  const logout = useCallback(() => {
    logoutUser();
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refresh: loadProfile,
    dismissError
  };
}

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginAccount, logoutAccount, registerAccount } from '../services/authApi';
import { setCsrfToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then(data => { if (!controller.signal.aborted) setUser(data); })
      .catch(error => {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setCsrfToken(null);
          setUser(null);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function login(email, password) { setUser(await loginAccount({ email, password })); }
  async function register(name, email, password) { setUser(await registerAccount({ name, email, password })); }
  async function logout() { await logoutAccount(); setUser(null); }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be inside AuthProvider');
  return value;
}

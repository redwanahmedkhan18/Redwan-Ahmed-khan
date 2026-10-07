"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminLogin, adminLogout, adminRequest, getToken, refreshSession, setToken } from "./admin-client";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AdminAuthValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveUser = useCallback(async () => {
    try {
      // Try current token first; fall back to cookie refresh.
      if (!getToken()) {
        const fresh = await refreshSession();
        if (!fresh) return null;
      }
      const me = await adminRequest<AdminUser>("/admin/auth/me");
      return me;
    } catch {
      setToken(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await resolveUser();
      if (!cancelled) {
        setUser(me);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resolveUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await adminLogin(email, password);
    setUser({ id: "", email: data.user.email, full_name: data.user.full_name, role: data.user.role });
  }, []);

  const logout = useCallback(async () => {
    await adminLogout();
    setUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);

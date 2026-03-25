import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { setBaseUrl } from "@workspace/api-client-react";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarUrl?: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    displayName: string,
    password: string,
    avatarColor: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fields: {
    displayName?: string;
    avatarColor?: string;
    avatarUrl?: string | null;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setBaseUrl(API_BASE.replace("/api", ""));
    AsyncStorage.getItem("nudo_auth").then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setUser(parsed.user);
          setToken(parsed.token);
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
    await AsyncStorage.setItem("nudo_auth", JSON.stringify(data));
    setUser(data.user);
    setToken(data.token);
  };

  const register = async (
    username: string,
    displayName: string,
    password: string,
    avatarColor: string
  ) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, password, avatarColor }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrarse");
    await AsyncStorage.setItem("nudo_auth", JSON.stringify(data));
    setUser(data.user);
    setToken(data.token);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("nudo_auth");
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (fields: {
    displayName?: string;
    avatarColor?: string;
    avatarUrl?: string | null;
  }) => {
    if (!user) return;
    const res = await fetch(`${API_BASE}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar perfil");
    const updated = { ...user, ...data };
    setUser(updated);
    const stored = await AsyncStorage.getItem("nudo_auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      await AsyncStorage.setItem(
        "nudo_auth",
        JSON.stringify({ ...parsed, user: updated })
      );
    }
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, updateProfile }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

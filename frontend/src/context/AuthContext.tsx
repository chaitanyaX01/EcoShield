import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  loginOtp: (mobile: string, otp: string) => Promise<void>;
  registerOtp: (mobile: string, otp: string, name: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("ecoshield_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      let storedToken = localStorage.getItem("ecoshield_token");

      if (!storedToken) {
        try {
          const params = new URLSearchParams(window.location.search);
          const demoRole = params.get("demo_role");
          if (demoRole === "admin") {
            const res = await api.login("admin@ecoshield.pune", "admin123");
            if (res.access_token) {
              localStorage.setItem("ecoshield_token", res.access_token);
              storedToken = res.access_token;
              setToken(res.access_token);
              setUser(res.user);
              setIsLoading(false);
              return;
            }
          } else if (demoRole === "citizen") {
            const res = await api.login("pooja.citizen@pune.gov.in", "password123");
            if (res.access_token) {
              localStorage.setItem("ecoshield_token", res.access_token);
              storedToken = res.access_token;
              setToken(res.access_token);
              setUser(res.user);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // fallback to standard check
        }
      }

      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.user) {
          setUser(res.user);
        }
      } catch {
        localStorage.removeItem("ecoshield_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string = "admin123") => {
    const res = await api.login(email, password);
    if (res.access_token) {
      localStorage.setItem("ecoshield_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    const res = await api.register(name, email, password, role);
    if (res.access_token) {
      localStorage.setItem("ecoshield_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    }
  };

  const loginOtp = async (mobile: string, otp: string) => {
    const res = await api.loginOtp(mobile, otp);
    if (res.access_token) {
      localStorage.setItem("ecoshield_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    }
  };

  const registerOtp = async (mobile: string, otp: string, name: string, role: string) => {
    const res = await api.registerOtp(mobile, otp, name, role);
    if (res.access_token) {
      localStorage.setItem("ecoshield_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem("ecoshield_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        loginOtp,
        registerOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

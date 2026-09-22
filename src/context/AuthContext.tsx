import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getRole, getViewer } from "../lib/github";
import type { Role } from "../types";

const STORAGE_KEY = "liquid-blog:gh-token";

type Status = "idle" | "checking" | "ready" | "error";

interface AuthState {
  token: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: Role | null;
  status: Status;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  canEdit: boolean;
  isAdmin: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  token: null,
  username: null,
  avatarUrl: null,
  role: null,
  status: "idle",
  error: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  const verify = useCallback(async (token: string) => {
    setState((s) => ({ ...s, status: "checking", error: null }));
    try {
      const viewer = await getViewer(token);
      const role = await getRole(token, viewer.login);
      localStorage.setItem(STORAGE_KEY, token);
      setState({
        token,
        username: viewer.login,
        avatarUrl: viewer.avatarUrl,
        role,
        status: "ready",
        error: role
          ? null
          : "Este token é válido, mas o usuário não é admin nem colaborador deste repositório.",
      });
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
      setState({
        ...initialState,
        status: "error",
        error:
          err instanceof Error
            ? "Não foi possível validar o token: " + err.message
            : "Não foi possível validar o token.",
      });
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      // Define o token otimisticamente enquanto valida, para telas
      // protegidas não redirecionarem para /login achando que não há
      // sessão nenhuma durante essa checagem inicial.
      setState((s) => ({ ...s, token: saved, status: "checking" }));
      verify(saved);
    }
  }, [verify]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      canEdit: state.role === "admin" || state.role === "colaborador",
      isAdmin: state.role === "admin",
      login: verify,
      logout,
    }),
    [state, verify, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

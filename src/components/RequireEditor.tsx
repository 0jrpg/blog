import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatusPanel from "./StatusPanel";

export default function RequireEditor({ children }: { children: ReactNode }) {
  const { status, canEdit, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (status === "checking" || status === "idle") {
    return <StatusPanel kind="loading" title="Verificando permissões…" />;
  }

  if (!canEdit) {
    return (
      <StatusPanel
        kind="error"
        title="Sem permissão"
        detail="Sua conta não é admin nem colaboradora deste repositório."
      />
    );
  }

  return <>{children}</>;
}

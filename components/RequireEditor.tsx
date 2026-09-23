"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import StatusPanel from "./StatusPanel";

export default function RequireEditor({ children }: { children: ReactNode }) {
  const { status, canEdit, token } = useAuth();
  const router = useRouter();

  const shouldRedirectToLogin = !token && status !== "checking";

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    }
  }, [shouldRedirectToLogin, router]);

  if (!token) {
    return <StatusPanel kind="loading" title="Redirecionando para o login…" />;
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

"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StatusPanel from "./StatusPanel";

export default function RequireEditor({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const canEdit = session?.user?.role === "admin" || session?.user?.role === "colaborador";
  const shouldRedirect = status === "unauthenticated";

  useEffect(() => {
    if (shouldRedirect) router.replace("/login");
  }, [shouldRedirect, router]);

  if (status === "loading") {
    return <StatusPanel kind="loading" title="Verificando sessão…" />;
  }

  if (status === "unauthenticated") {
    return <StatusPanel kind="loading" title="Redirecionando para o login…" />;
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

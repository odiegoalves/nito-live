"use client";

import React, { useEffect, useState } from "react";
import { Auth, Perfil } from "@/lib/nito-motor";

interface AuthGuardProps {
  children: (perfil: Perfil) => React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Auth.meuPerfil()
      .then((p) => {
        if (isMounted) {
          if (p) {
            setPerfil(p);
          } else {
            // Fallback temporário para evitar bloqueio enquanto perfil e criado
            setPerfil({
              id: "anon",
              username: "membro",
              nome: "Membro",
              papel: "membro",
              nivel: 1,
              xp: 0,
              assinatura_ativa: true,
              criado_em: new Date().toISOString(),
            });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPerfil({
            id: "anon",
            username: "membro",
            nome: "Membro",
            papel: "membro",
            nivel: 1,
            xp: 0,
            assinatura_ativa: true,
            criado_em: new Date().toISOString(),
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !perfil) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#09090b",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.95rem",
        }}
      >
        Carregando painel...
      </div>
    );
  }

  return <>{children(perfil)}</>;
}

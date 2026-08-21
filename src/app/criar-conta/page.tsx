"use client";

// A tela de cadastro agora vive dentro de /login, na aba "Criar conta".
// Esta rota continua existindo para nao quebrar links antigos.
import { useEffect } from "react";

export default function CriarContaPage() {
  useEffect(() => {
    window.location.replace("/login?modo=cadastro");
  }, []);
  return null;
}

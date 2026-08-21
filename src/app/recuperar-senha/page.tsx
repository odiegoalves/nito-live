"use client";

// A recuperacao de senha agora vive dentro de /login, na aba "Recuperar".
// Esta rota continua existindo para nao quebrar links antigos.
import { useEffect } from "react";

export default function RecuperarSenhaPage() {
  useEffect(() => {
    window.location.replace("/login?modo=recuperar");
  }, []);
  return null;
}

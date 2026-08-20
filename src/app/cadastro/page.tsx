"use client";

import { useState } from "react";
import { Auth } from "@/lib/nito-motor";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./auth.module.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await Auth.cadastrar(email, password, name);
      setMessage({
        type: "success",
        text: "Conta criada com sucesso! Faça login ou verifique seu e-mail.",
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Erro ao realizar cadastro." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>NITO</div>
          <h1>Crie sua conta no NITO LIVE</h1>
          <p>Acesse a comunidade, aulas e automações para suas lives.</p>
        </div>

        {message && (
          <div
            className={`${styles.message} ${styles[message.type]}`}
            style={
              message.type === "success"
                ? { border: "1px solid #059669", background: "rgba(5, 150, 105, 0.1)", padding: "1.5rem", borderRadius: "12px", textAlign: "center" }
                : {}
            }
          >
            {message.type === "success" && <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📧</div>}
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><User size={16} /> Nome Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className={styles.inputGroup}>
            <label><Mail size={16} /> E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div className={styles.inputGroup}>
            <label><Lock size={16} /> Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? "Criando conta..." : "Cadastrar Minha Conta"} <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footerText}>
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

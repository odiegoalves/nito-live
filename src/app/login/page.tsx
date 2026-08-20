"use client";

import React, { useState } from "react";
import { Auth } from "@/lib/nito-motor";
import { Mail, Lock, User, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "../cadastro/auth.module.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (mode === "login") {
        await Auth.entrar(email, password);
        window.location.href = "/comunidade";
      } else if (mode === "signup") {
        await Auth.cadastrar(email, password, nome);
        setMessage({
          type: "success",
          text: "Conta criada com sucesso! Verifique seu e-mail ou faça login.",
        });
        setMode("login");
      } else if (mode === "forgot") {
        await Auth.esqueciSenha(email);
        setMessage({
          type: "success",
          text: "Instruções para redefinição de senha enviadas para seu e-mail.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Ocorreu um erro ao processar sua solicitação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>NITO</div>
          <h1>
            {mode === "login" && "Acesse sua conta"}
            {mode === "signup" && "Crie sua conta no Nito Live"}
            {mode === "forgot" && "Recuperar Senha"}
          </h1>
          <p>
            {mode === "login" && "Entre com seus dados para acessar a comunidade e seu painel."}
            {mode === "signup" && "Preencha seus dados para começar no Nito Live."}
            {mode === "forgot" && "Digite seu e-mail para receber as instruções de recuperação."}
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: message.type === "success" ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              color: message.type === "success" ? "#4ade80" : "#f87171",
            }}
          >
            {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", backgroundColor: "#18181b", padding: "0.25rem", borderRadius: "8px" }}>
          <button
            type="button"
            onClick={() => { setMode("login"); setMessage(null); }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: mode === "login" ? "#ef4444" : "transparent",
              color: mode === "login" ? "#fff" : "#a1a1aa",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setMessage(null); }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: mode === "signup" ? "#ef4444" : "transparent",
              color: mode === "signup" ? "#fff" : "#a1a1aa",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "signup" && (
            <div className={styles.inputGroup}>
              <label><User size={16} /> Nome Completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
          )}

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

          {mode !== "forgot" && (
            <div className={styles.inputGroup}>
              <label><Lock size={16} /> Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
              />
            </div>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
              <button
                type="button"
                onClick={() => { setMode("forgot"); setMessage(null); }}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <button type="submit" disabled={isLoading} className={styles.submitBtn}>
            {isLoading
              ? "Processando..."
              : mode === "login"
              ? "Entrar no Painel"
              : mode === "signup"
              ? "Criar Minha Conta"
              : "Enviar Recuperação"}{" "}
            <ArrowRight size={18} />
          </button>
        </form>

        {mode === "forgot" && (
          <p className={styles.footerText}>
            Lembrou da senha?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}
            >
              Voltar ao login
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

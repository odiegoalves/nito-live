"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NICHOS } from "@/lib/nichos";
import { saveEmpresa } from "@/app/actions/empresa";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nichoId, setNichoId] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const nichoSelecionado = NICHOS.find((n) => n.id === nichoId);

  const handleFinish = async () => {
    if (!nome || !nichoId) return;
    setIsLoading(true);
    try {
      const result = await saveEmpresa({ nome, nicho: nichoId, telefone, email });
      if (result && result.error) {
        alert("Erro ao configurar empresa: " + result.error);
        setIsLoading(false);
      } else if (result && result.success) {
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
      alert("Erro crítico: " + (error.message || "Erro desconhecido"));
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>V</div>
          <span className={styles.logoText}>VALORA</span>
        </div>

        {step === 1 && (
          <>
            <h1 className={styles.title}>Qual é o seu ramo de atuação?</h1>
            <p className={styles.subtitle}>
              Escolha seu nicho e o sistema se adapta completamente para o seu negócio — terminologia, materiais e cálculos personalizados.
            </p>

            <div className={styles.nichoGrid}>
              {NICHOS.map((n) => (
                <button
                  key={n.id}
                  className={`${styles.nichoCard} ${nichoId === n.id ? styles.nichoSelected : ""}`}
                  onClick={() => setNichoId(n.id)}
                >
                  <span className={styles.nichoEmoji}>{n.emoji}</span>
                  <span className={styles.nichoNome}>{n.nome}</span>
                  <span className={styles.nichoDesc}>{n.descricao}</span>
                </button>
              ))}
            </div>

            <button
              className={styles.nextBtn}
              disabled={!nichoId}
              onClick={() => setStep(2)}
            >
              Continuar →
            </button>
          </>
        )}

        {step === 2 && nichoSelecionado && (
          <>
            <div className={styles.nichoConfirm}>
              {nichoSelecionado.emoji} {nichoSelecionado.nome}
            </div>
            <h1 className={styles.title}>Agora, sobre sua empresa</h1>
            <p className={styles.subtitle}>
              Essas informações aparecerão nos orçamentos enviados ao cliente.
            </p>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome da empresa / profissional *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={`Ex: ${nichoSelecionado.nome === "Barbearia" ? "Barbearia do João" : "Empresa " + nichoSelecionado.nome}`}
                />
              </div>
              <div className={styles.formGroup}>
                <label>WhatsApp / Telefone</label>
                <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className={styles.formGroup}>
                <label>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="empresa@email.com" />
              </div>
            </div>

            <div className={styles.preview}>
              <h4>O sistema será configurado para {nichoSelecionado.nome}:</h4>
              <ul>
                <li>✅ Unidades: {nichoSelecionado.unidadesPrincipais.join(", ")}</li>
                <li>✅ Categorias sugeridas: {nichoSelecionado.categoriasMateriais.slice(0, 3).join(", ")}...</li>
                <li>✅ Serviços de exemplo pré-configurados</li>
              </ul>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>← Voltar</button>
              <button className={styles.nextBtn} disabled={!nome || isLoading} onClick={handleFinish}>
                {isLoading ? "Configurando..." : "Entrar no VALORA 🚀"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

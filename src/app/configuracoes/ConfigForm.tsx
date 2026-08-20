"use client";

import { useState, useRef } from "react";
import { Building2, Upload, Save, Check, Users } from "lucide-react";
import { NICHOS } from "@/lib/nichos";
import { saveEmpresa } from "@/app/actions/empresa";
import styles from "./configuracoes.module.css";
import formStyles from "@/components/ui/Form.module.css";

type Empresa = {
  nome: string;
  nicho: string;
  logo: string | null;
  endereco: string | null;
  cidade: string | null;
  telefone: string | null;
  email: string | null;
  plano: string;
};

export function ConfigForm({ empresa }: { empresa: Empresa }) {
  const [nome, setNome] = useState(empresa.nome);
  const [nicho, setNicho] = useState(empresa.nicho);
  const [endereco, setEndereco] = useState(empresa.endereco ?? "");
  const [cidade, setCidade] = useState(empresa.cidade ?? "");
  const [telefone, setTelefone] = useState(empresa.telefone ?? "");
  const [email, setEmail] = useState(empresa.email ?? "");
  const [logo, setLogo] = useState<string | null>(empresa.logo);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await saveEmpresa({ nome, nicho, logo: logo ?? undefined, endereco, cidade, telefone, email });
    setSaved(true);
    setIsLoading(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const nichoAtual = NICHOS.find((n) => n.id === nicho);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurações da Empresa</h1>
          <p className={styles.subtitle}>Personalize seu perfil e as informações dos orçamentos</p>
        </div>
        <button onClick={handleSave} disabled={isLoading} className="premium-button" style={{ gap: "0.5rem", height: 40, display: "flex", alignItems: "center" }}>
          {saved ? <><Check size={16} /> Salvo!</> : isLoading ? "Salvando..." : <><Save size={16} /> Salvar</>}
        </button>
      </header>

      <div className={styles.grid}>
        {/* Coluna 1 - Identidade */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}><Building2 size={16} /> Identidade da Empresa</h3>

          {/* Logo Upload */}
          <div className={styles.logoArea} onClick={() => fileRef.current?.click()}>
            {logo ? (
              <img src={logo} alt="Logo" className={styles.logoPreview} />
            ) : (
              <div className={styles.logoPlaceholder}>
                <Upload size={24} />
                <span>Clique para enviar logomarca</span>
                <span style={{ fontSize: "0.75rem" }}>PNG, JPG — recomendado 200×200px</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
          </div>
          {logo && (
            <button onClick={() => setLogo(null)} style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.5rem" }}>
              Remover logo
            </button>
          )}

          <div className={formStyles.formGroup} style={{ marginTop: "1rem" }}>
            <label className={formStyles.label}>Nome da Empresa / Profissional *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className={formStyles.input} placeholder="Ex: Lava-Jato do João" />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>WhatsApp / Telefone</label>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={formStyles.input} placeholder="(00) 00000-0000" />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formStyles.input} placeholder="empresa@email.com" />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Endereço</label>
            <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className={formStyles.input} placeholder="Rua, número, bairro" />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Cidade / Estado</label>
            <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className={formStyles.input} placeholder="Ex: Juiz de Fora - MG" />
          </div>
        </div>

        {/* Coluna 2 - Nicho */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🎯 Nicho de Atuação</h3>
          {nichoAtual && (
            <div className={styles.nichoAtual}>
              <span className={styles.nichoEmoji}>{nichoAtual.emoji}</span>
              <div>
                <div className={styles.nichoNome}>{nichoAtual.nome}</div>
                <div className={styles.nichoDesc}>{nichoAtual.descricao}</div>
              </div>
            </div>
          )}
          <div className={styles.nichoGrid}>
            {NICHOS.map((n) => (
              <button
                key={n.id}
                className={`${styles.nichoBtn} ${nicho === n.id ? styles.nichoBtnActive : ""}`}
                onClick={() => setNicho(n.id)}
              >
                {n.emoji} {n.nome}
              </button>
            ))}
          </div>

          {/* Plano */}
          <div className={styles.planoBox}>
            <h4>Configurações de Acesso</h4>
            <div className={styles.planoRow}>
              <span className={`${styles.planoBadge} ${empresa.plano === "premium" ? styles.planoPremium : empresa.plano === "pro" ? styles.planoPro : styles.planoFree}`}>
                {empresa.plano.toUpperCase()}
              </span>
              {empresa.plano !== "premium" && (
                <a href="/planos" className={styles.upgradeLink}>Fazer Upgrade →</a>
              )}
            </div>
            
            <a href="/configuracoes/equipe" className={styles.teamLink}>
              <Users size={16} />
              Gerenciar Equipe (Funcionários)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

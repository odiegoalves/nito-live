"use client";

import { useState } from "react";
import { Users, Mail, UserPlus, Trash2, ArrowLeft, Shield, AlertCircle } from "lucide-react";
import Link from "next/link";
import { addFuncionario, removeFuncionario } from "@/app/actions/equipe";
import styles from "./equipe.module.css";
import formStyles from "@/components/ui/Form.module.css";

export function EquipeClient({ empresa, initialEquipe }: { empresa: any, initialEquipe: any[] }) {
  const [email, setEmail] = useState("");
  const [equipe, setEquipe] = useState(initialEquipe);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isPremium = empresa.plano === "premium";
  const numFuncionarios = equipe.filter(u => u.id !== empresa.userId).length;
  const freeSlots = 3;
  const hasFreeSlots = numFuncionarios < freeSlots;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      await addFuncionario(email);
      setEmail("");
      // Recarregar equipe (simplificado: recarregar página ou atualizar estado)
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar funcionário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este acesso?")) return;
    try {
      await removeFuncionario(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/configuracoes" className={styles.backLink}><ArrowLeft size={16} /> Voltar</Link>
          <h1 className={styles.title}>Gerenciar Equipe</h1>
          <p className={styles.subtitle}>Gerencie os acessos dos seus funcionários ao sistema</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Lado Esquerdo: Adicionar */}
        <div className={styles.mainContent}>
          {!isPremium && (
            <div className={styles.warningBox}>
              <AlertCircle size={20} />
              <div>
                <strong>Acesso Restrito</strong>
                <p>O gerenciamento de equipe está disponível apenas no plano <strong>PREMIUM</strong>. Faça o upgrade para liberar o acesso para seus colaboradores.</p>
                <Link href="/planos" className={styles.upgradeBtn}>Ver Planos</Link>
              </div>
            </div>
          )}

          {isPremium && (
            <div className={`premium-card ${styles.addSection}`}>
              <h3 className={styles.sectionTitle}><UserPlus size={18} /> Adicionar Novo Membro</h3>
              <p className={styles.sectionDesc}>Insira o e-mail do seu colaborador. Ele receberá o acesso assim que fizer login com este e-mail.</p>
              
              <form onSubmit={handleAdd} className={styles.form}>
                <div className={formStyles.formGroup}>
                  <div className={styles.inputWithIcon}>
                    <Mail size={18} />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e-mail@funcionario.com"
                      className={formStyles.input}
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="premium-button">
                  {isLoading ? "Adicionando..." : "Adicionar à Equipe"}
                </button>
              </form>
              
              {!hasFreeSlots && (
                <p className={styles.taxNotice}>
                  ⚠️ Você já usou seus 3 acessos gratuitos. Esta nova adição custará <strong>R$ 10,00 adicionais</strong> na sua próxima fatura.
                </p>
              )}
              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}

          <div className={`premium-card ${styles.listSection}`}>
            <h3 className={styles.sectionTitle}><Users size={18} /> Membros da Equipe ({equipe.length})</h3>
            <div className={styles.userList}>
              {equipe.map((user) => (
                <div key={user.id} className={styles.userRow}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {user.nome?.charAt(0) || user.email.charAt(0)}
                    </div>
                    <div>
                      <div className={styles.userName}>
                        {user.nome || "Pendente"} 
                        {user.id === empresa.userId && <span className={styles.ownerBadge}>DONO</span>}
                      </div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                  </div>
                  {user.id !== empresa.userId && isPremium && (
                    <button onClick={() => handleRemove(user.id)} className={styles.removeBtn} title="Remover acesso">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Direito: Info */}
        <div className={styles.sidebar}>
          <div className={`premium-card ${styles.infoCard}`}>
            <h4 className={styles.infoTitle}>Como funciona?</h4>
            <ul className={styles.infoList}>
              <li><strong>Plano Premium:</strong> Inclui 3 acessos grátis para funcionários além do dono.</li>
              <li><strong>Custo Adicional:</strong> A partir do 4º funcionário, será cobrado R$ 10,00 fixos por cada novo e-mail cadastrado.</li>
              <li><strong>Sincronização:</strong> Assim que você adicionar o e-mail, o funcionário só precisa criar uma conta (ou logar) com esse mesmo e-mail para acessar os dados da sua empresa.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

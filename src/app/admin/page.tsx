import { getAllUsersAdmin, getDashboardStats } from "@/app/actions/admin";
import { ArrowLeft, Users, CreditCard, BarChart3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import styles from "./admin.module.css";
import { AdminClient } from "./AdminClient";
import { createClient } from "@/lib/supabase-server";

export default async function AdminPanel() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let users = [];
  let stats = { totalUsers: 0, totalOrcamentos: 0, totalEmpresas: 0 };
  
  try {
    [users, stats] = await Promise.all([
      getAllUsersAdmin(),
      getDashboardStats()
    ]);
  } catch (e: any) {
    console.error("ERRO AO ACESSAR ADMIN:", e);
    return (
      <div className={styles.denied}>
        <ShieldCheck size={64} color="#ef4444" />
        <h1>Acesso Restrito</h1>
        <p>Houve um erro ao verificar suas permissões ou ao carregar os dados: {e.message || "Erro desconhecido"}</p>
        <Link href="/" className="premium-button">Voltar para o Início</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={16} /> Dashboard</Link>
          <h1 className={styles.title}>Centro de Comando</h1>
          <p className={styles.subtitle}>Gestão de Usuários, Assinaturas e Suporte</p>
        </div>
        <div className={styles.adminBadge}>ADMINISTRADOR</div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Users size={20} /></div>
          <div className={styles.statInfo}>
            <span>Usuários Registrados</span>
            <strong>{stats.totalUsers}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(107, 70, 193, 0.1)", color: "#a78bfa" }}><CreditCard size={20} /></div>
          <div className={styles.statInfo}>
            <span>Assinaturas Ativas</span>
            <strong>{users.filter(u => u.empresa?.plano !== "free").length}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}><BarChart3 size={20} /></div>
          <div className={styles.statInfo}>
            <span>Total Orçamentos</span>
            <strong>{stats.totalOrcamentos}</strong>
          </div>
        </div>
      </div>

      <AdminClient initialUsers={users as any} currentUserId={user?.id || ""} />
    </div>
  );
}

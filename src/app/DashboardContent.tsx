"use client";

import { LayoutDashboard, Users, FileText, Package, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import styles from "./page.module.css";
import Link from "next/link";

export default function DashboardContent({ empresa }: { empresa: any }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel de Controle</h1>
          <p className={styles.subtitle}>Bem-vindo de volta, {empresa.nome}!</p>
        </div>
        <div className={styles.nichoBadge}>
          {empresa.nicho.replace("_", " ")}
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`premium-card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Orçamentos Pendentes</span>
            <FileText size={18} className={styles.statIconLight} />
          </div>
          <div className={styles.statValue}>0</div>
          <Link href="/orcamentos" className={styles.statLink}>Ver todos <ArrowUpRight size={14} /></Link>
        </div>
        <div className={`premium-card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Serviços na Agenda</span>
            <Calendar size={18} style={{ color: "var(--success)" }} />
          </div>
          <div className={styles.statValue}>0</div>
          <Link href="/agenda" className={styles.statLink}>Ver agenda <ArrowUpRight size={14} /></Link>
        </div>
        <div className={`premium-card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Clientes Totais</span>
            <Users size={18} className={styles.statIconLight} />
          </div>
          <div className={styles.statValue}>0</div>
          <Link href="/clientes" className={styles.statLink}>Ver clientes <ArrowUpRight size={14} /></Link>
        </div>
        <div className={`premium-card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Receita Estimada</span>
            <TrendingUp size={18} className={styles.statIconLight} />
          </div>
          <div className={styles.statValue}>R$ 0,00</div>
          <Link href="/financeiro" className={styles.statLink}>Ver extrato <ArrowUpRight size={14} /></Link>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={`premium-card ${styles.chartCard}`}>
          <div className={styles.chartHeader}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3>Faturamento Mensal</h3>
          </div>
          <div className={styles.chartPlaceholder}>
            <div className={styles.yAxis}>
              <span>5k</span>
              <span>2.5k</span>
              <span>0</span>
            </div>
            <div className={styles.chartArea}>
              <div className={styles.gridLines}>
                <div className={styles.gridLine}></div>
                <div className={styles.gridLine}></div>
                <div className={styles.gridLine}></div>
              </div>
              <div className={styles.mockLine} style={{ width: "0%" }}></div>
              <div className={styles.xAxis}>
                <span>Jan</span>
                <span>Fev</span>
                <span>Mar</span>
                <span>Abr</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`premium-card ${styles.chartCard}`}>
          <div className={styles.chartHeader}>
            <Package size={18} color="var(--primary)" />
            <h3>Top Materiais (Consumo)</h3>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--secondary-foreground)", fontSize: "0.9rem" }}>
            Aguardando dados de consumo...
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={`premium-card ${styles.welcomeCard}`}>
          <div className={styles.welcomeInfo}>
            <h2>{empresa.nome}, vamos começar?</h2>
            <p>Seu sistema está pronto para o nicho de <strong>{empresa.nicho.replace("_", " ")}</strong>. O próximo passo é cadastrar seus primeiros materiais para calcular orçamentos com precisão.</p>
            <div className={styles.welcomeBtns}>
              <Link href="/materiais" className="premium-button">Cadastrar Materiais</Link>
              <Link href="/servicos" className="premium-button" style={{ background: "transparent", border: "1px solid var(--primary)", color: "var(--primary)" }}>Configurar Serviços</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

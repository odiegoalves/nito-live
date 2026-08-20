"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Percent, Briefcase, FileText } from "lucide-react";
import fStyles from "./page.module.css";
import { getFinanceiro } from "@/app/actions/orcamentos";
import { Modal } from "@/components/ui/Modal";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

type ItemFinanceiro = { id: string; numero: string; cliente: string; valor: number; data: string | Date };

type Dados = { 
  receita: number; 
  custos: number; 
  lucro: number; 
  margem: number; 
  total: number; 
  perdas: number; 
  totalCancelados: number;
  itensEntregues?: ItemFinanceiro[];
  itensCancelados?: ItemFinanceiro[];
};

export default function FinanceiroPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [dados, setDados] = useState<Dados>({ 
    receita: 0, 
    custos: 0, 
    lucro: 0, 
    margem: 0, 
    total: 0, 
    perdas: 0, 
    totalCancelados: 0,
    itensEntregues: [],
    itensCancelados: []
  });
  const [loading, setLoading] = useState(true);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState<ItemFinanceiro[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getFinanceiro(periodo).then((d) => { setDados(d as any); setLoading(false); });
  }, [periodo]);

  const openHistory = (title: string, items: ItemFinanceiro[] = []) => {
    setModalTitle(title);
    setModalItems(items);
    setIsModalOpen(true);
  };

  return (
    <div className={fStyles.container}>
      <header className={fStyles.header}>
        <div>
          <h1 className={fStyles.title}>Análise Financeira</h1>
          <p className={fStyles.subtitle}>Métricas reais baseadas em orçamentos com status "Entregue"</p>
        </div>
        <select className={fStyles.filterSelect} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="semana">Última Semana</option>
          <option value="mes">Este Mês</option>
          <option value="ano">Este Ano</option>
        </select>
      </header>

      <section className={fStyles.statsGrid}>
        {[
          { 
            label: "Receita Total", 
            value: fmt(dados.receita), 
            sub: "Orçamentos entregues", 
            icon: <DollarSign size={20} className={fStyles.statIcon} />,
            onClick: () => openHistory("Histórico de Receita (Entregues)", dados.itensEntregues)
          },
          { 
            label: "Lucro Líquido", 
            value: fmt(dados.lucro), 
            sub: "Após custo de materiais", 
            icon: <TrendingUp size={20} className={fStyles.statIcon} />,
            onClick: () => openHistory("Histórico de Lucro Líquido", dados.itensEntregues)
          },
          { 
            label: "Faturamento Perdido", 
            value: fmt(dados.perdas), 
            sub: `${dados.totalCancelados} cancelamentos`, 
            icon: <Percent size={20} className={fStyles.statIcon} style={{ color: "#ef4444" }} />,
            onClick: () => openHistory("Histórico de Cancelamentos", dados.itensCancelados)
          },
          { 
            label: "Serviços Realizados", 
            value: dados.total.toString(), 
            sub: "No período selecionado", 
            icon: <Briefcase size={20} className={fStyles.statIcon} />,
            onClick: () => openHistory("Histórico de Serviços Realizados", dados.itensEntregues)
          },
        ].map((card) => (
          <div key={card.label} className={`premium-card ${fStyles.statCard}`} onClick={card.onClick} style={{ cursor: "pointer" }}>
            <div className={fStyles.statHeader}>
              <span className={fStyles.statTitle}>{card.label}</span>
              {card.icon}
            </div>
            <div className={fStyles.statValue}>{loading ? "—" : card.value}</div>
            <div className={fStyles.statSubtitle}>{card.sub}</div>
            <div className={fStyles.clickHint}>Clique para ver detalhes</div>
          </div>
        ))}
      </section>

      <div className={`premium-card ${fStyles.chartCard}`}>
        <h3 className={fStyles.chartTitle}>Resumo do Período</h3>
        <p className={fStyles.chartSubtitle}>{periodo === "semana" ? "Últimos 7 dias" : periodo === "mes" ? "Este mês" : "Este ano"}</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>Carregando...</div>
        ) : (dados.total === 0 && dados.totalCancelados === 0) ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
            Nenhum dado financeiro neste período.<br />
            As métricas aparecem para orçamentos "Entregues" ou "Cancelados".
          </div>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div className={fStyles.metricBar}>
                <div className={fStyles.metricBarLabel}><span>Receita</span><strong>{fmt(dados.receita)}</strong></div>
                <div className={fStyles.barTrack}><div className={fStyles.barFill} style={{ width: "100%", background: "var(--primary)" }}></div></div>
              </div>
              <div className={fStyles.metricBar}>
                <div className={fStyles.metricBarLabel}><span>Custo de Materiais</span><strong>{fmt(dados.custos)}</strong></div>
                <div className={fStyles.barTrack}><div className={fStyles.barFill} style={{ width: `${dados.receita > 0 ? (dados.custos / dados.receita) * 100 : 0}%`, background: "var(--warning)" }}></div></div>
              </div>
              <div className={fStyles.metricBar}>
                <div className={fStyles.metricBarLabel}><span>Lucro Líquido</span><strong>{fmt(dados.lucro)}</strong></div>
                <div className={fStyles.barTrack}><div className={fStyles.barFill} style={{ width: `${dados.receita > 0 ? (dados.lucro / dados.receita) * 100 : 0}%`, background: "var(--success)" }}></div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <div className={fStyles.historyList}>
          {modalItems.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--secondary-foreground)", padding: "2rem" }}>Nenhum registro encontrado.</p>
          ) : (
            modalItems.map(item => (
              <div key={item.id} className={fStyles.historyItem}>
                <div className={fStyles.itemMain}>
                  <div className={fStyles.itemIcon}><FileText size={18} /></div>
                  <div>
                    <div className={fStyles.itemNum}>{item.numero}</div>
                    <div className={fStyles.itemClient}>{item.cliente}</div>
                  </div>
                </div>
                <div className={fStyles.itemValues}>
                  <div className={fStyles.itemVal}>{fmt(item.valor)}</div>
                  <div className={fStyles.itemDate}>{new Date(item.data).toLocaleDateString("pt-BR")}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import styles from "@/components/layout/list.module.css";
import { updateStatusOrcamento } from "@/app/actions/orcamentos";

type Agendamento = {
  id: string;
  data: string;
  hora: string;
  orcamento: {
    id: string;
    numero: string;
    status: string;
    valorFinal: number;
    cliente: { nome: string; telefone: string | null };
    servicos: { servico: { nome: string } }[];
  };
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AgendaList({ initialAgendamentos }: { initialAgendamentos: Agendamento[] }) {
  // Ordenar: Agendados primeiro, depois Cancelados, depois Entregues
  const sorted = [...initialAgendamentos].sort((a, b) => {
    const order: Record<string, number> = { Agendado: 0, Cancelado: 1, Entregue: 2 };
    return (order[a.orcamento.status] ?? 3) - (order[b.orcamento.status] ?? 3);
  });

  const agendados = sorted.filter((a) => a.orcamento.status === "Agendado");
  const cancelados = sorted.filter((a) => a.orcamento.status === "Cancelado");
  const entregues = sorted.filter((a) => a.orcamento.status === "Entregue");

  const renderSection = (title: string, icon: React.ReactNode, items: Agendamento[], color: string) => (
    <div className={styles.tableCard} style={{ marginBottom: "1.5rem" }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: "0.5rem", color }}>
        {icon}
        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{title} ({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--secondary-foreground)", fontSize: "0.875rem" }}>
          Nenhum item nesta seção.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Orçamento</th>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{a.data.split("-").reverse().join("/")}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Clock size={12} /> {a.hora}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{a.orcamento.numero}</td>
                <td>{a.orcamento.cliente.nome}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                    {a.orcamento.servicos.map((s, idx) => (
                      <span key={idx} style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem" }}>
                        {s.servico.nome}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: "var(--success)" }}>{fmt(a.orcamento.valorFinal)}</td>
                <td>
                  <div className={styles.actions}>
                    {a.orcamento.status !== "Entregue" && (
                      <CheckCircle2
                        size={16}
                        className={styles.actionIcon}
                        style={{ color: "var(--success)" }}
                        onClick={() => updateStatusOrcamento(a.orcamento.id, "Entregue")}
                      />
                    )}
                    {a.orcamento.status === "Cancelado" && (
                      <CheckCircle2
                        size={16}
                        className={styles.actionIcon}
                        style={{ color: "var(--primary)" }}
                        onClick={() => updateStatusOrcamento(a.orcamento.id, "Agendado")}
                      />
                    )}
                    {a.orcamento.status === "Agendado" && (
                      <XCircle
                        size={16}
                        className={`${styles.actionIcon} ${styles.actionDelete}`}
                        onClick={() => updateStatusOrcamento(a.orcamento.id, "Cancelado")}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Agenda</h1>
          <p className={styles.subtitle}>Visualize e gerencie seus serviços agendados</p>
        </div>
      </header>

      {renderSection("📅 Agendados — Próximas Entregas", <Calendar size={18} />, agendados, "var(--primary)")}
      {renderSection("🔴 Cancelados — Recuperar", <XCircle size={18} />, cancelados, "var(--danger)")}
      {renderSection("✅ Entregues — Histórico", <CheckCircle2 size={18} />, entregues, "var(--success)")}
    </div>
  );
}

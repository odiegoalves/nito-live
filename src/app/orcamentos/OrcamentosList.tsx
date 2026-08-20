"use client";

import { useState, useMemo } from "react";
import { Plus, Eye, Edit2, Trash2, Calendar, CheckCircle2, XCircle, Send, FileDown, Lock, Package, Trash, ChevronRight } from "lucide-react";
import styles from "@/components/layout/list.module.css";
import orcStyles from "./orcamentos.module.css";
import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import {
  createOrcamento,
  updateOrcamento,
  updateStatusOrcamento,
  agendarOrcamento,
  deleteOrcamento,
} from "@/app/actions/orcamentos";
import { gerarPDFOrcamento } from "@/lib/pdf";

type Cliente = { id: string; nome: string; telefone: string | null };
type Servico = { 
  id: string; 
  nome: string; 
  materiais: { qtdUsada: number; material: { custoUnitario: number } }[]; 
  percentualMao: number 
};
type Agendamento = { data: string; hora: string } | null;
type OrcamentoServico = { servico: Servico };

type Orcamento = {
  id: string;
  numero: string;
  status: string;
  custoMateriais: number;
  valorMaoDeObra: number;
  valorFinal: number;
  observacoes: string | null;
  createdAt: Date;
  cliente: Cliente;
  servicos: OrcamentoServico[];
  agendamento: Agendamento;
};

const STATUS_COLORS: Record<string, string> = {
  Pendente: styles.statusPendente,
  Agendado: styles.statusAtivo,
  Entregue: styles.statusAprovado,
  Cancelado: styles.statusCancelado,
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Empresa = { nome: string; nicho: string; logo: string | null; endereco: string | null; cidade: string | null; telefone: string | null; email: string | null; plano: string };

export function OrcamentosList({
  initialOrcamentos,
  clientes,
  servicos,
  empresa,
}: {
  initialOrcamentos: Orcamento[];
  clientes: Cliente[];
  servicos: Servico[];
  empresa: Empresa;
}) {
  const isPremium = empresa.plano === "premium";
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isViewOpen, setViewOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isAgendaOpen, setAgendaOpen] = useState(false);
  const [selected, setSelected] = useState<Orcamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [busca, setBusca] = useState("");

  // Create form
  const [clienteId, setClienteId] = useState("");
  const [servicosEscolhidos, setServicosEscolhidos] = useState<Servico[]>([]);
  const [servicoIdTemp, setServicoIdTemp] = useState("");
  const [obs, setObs] = useState("");

  // Edit form
  const [editObs, setEditObs] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Agenda form
  const [agData, setAgData] = useState("");
  const [agHora, setAgHora] = useState("");

  // Cálculo de custos do NOVO orçamento (Memoizado)
  const custosNovo = useMemo(() => {
    let custoMat = 0;
    let mao = 0;

    servicosEscolhidos.forEach(s => {
      const cMat = s.materiais.reduce((acc, sm) => acc + (sm.material.custoUnitario * sm.qtdUsada), 0);
      custoMat += cMat;
      mao += cMat * (s.percentualMao / 100);
    });

    return { custoMat, mao, total: custoMat + mao };
  }, [servicosEscolhidos]);

  const addServico = () => {
    if (!servicoIdTemp) return;
    const s = servicos.find(x => x.id === servicoIdTemp);
    if (s) {
      setServicosEscolhidos([...servicosEscolhidos, s]);
      setServicoIdTemp("");
    }
  };

  const removeServico = (index: number) => {
    setServicosEscolhidos(servicosEscolhidos.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || servicosEscolhidos.length === 0) return;
    setIsLoading(true);
    try {
      await createOrcamento({ 
        clienteId, 
        servicoIds: servicosEscolhidos.map(s => s.id), 
        observacoes: obs 
      });
      setCreateOpen(false);
      setClienteId(""); setServicosEscolhidos([]); setObs("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsLoading(true);
    try {
      await updateOrcamento(selected.id, { observacoes: editObs, status: editStatus });
      setEditOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsLoading(true);
    try {
      await agendarOrcamento(selected.id, agData, agHora);
      setAgendaOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const openView = (o: Orcamento) => { setSelected(o); setViewOpen(true); };
  const openEdit = (o: Orcamento) => { setSelected(o); setEditObs(o.observacoes ?? ""); setEditStatus(o.status); setEditOpen(true); };
  const openAgendar = (o: Orcamento) => {
    setSelected(o);
    setAgData(o.agendamento?.data ?? "");
    setAgHora(o.agendamento?.hora ?? "");
    setAgendaOpen(true);
  };

  const handleEnviarWhatsApp = (o: Orcamento) => {
    const tel = o.cliente.telefone?.replace(/\D/g, "");
    if (!tel) return alert("Cliente sem WhatsApp cadastrado.");
    const listaServicos = o.servicos.map(s => `• ${s.servico.nome}`).join("\n");
    const msg = encodeURIComponent(
      `Olá ${o.cliente.nome}! 👋\n\n*Orçamento ${o.numero}*\n\n` +
      `Serviços:\n${listaServicos}\n\n` +
      `*Valor Total: ${fmt(o.valorFinal)}*\n\n` +
      (o.observacoes ? `Obs: ${o.observacoes}\n\n` : "") +
      `Aguardamos sua confirmação! 🚀`
    );
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank");
  };

  const filtrados = initialOrcamentos.filter((o) => {
    const statusOk = filtroStatus === "Todos" || o.status === filtroStatus;
    const buscaOk = 
      o.numero.includes(busca) || 
      o.cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      o.servicos.some(s => s.servico.nome.toLowerCase().includes(busca.toLowerCase()));
    return statusOk && buscaOk;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Orçamentos</h1>
          <p className={styles.subtitle}>Gestão profissional de propostas multi-serviços</p>
        </div>
        <button className="premium-button" onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> Novo Orçamento
        </button>
      </header>

      <div className={styles.tableCard}>
        <div className={styles.filters}>
          <input type="text" placeholder="Buscar..." className={styles.searchInput} value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className={styles.filterSelect} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Agendado">Agendado</option>
            <option value="Entregue">Entregue</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Itens do Orçamento</th>
              <th>Status</th>
              <th>Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 700 }}>{o.numero}</td>
                <td>{o.cliente.nome}</td>
                <td>
                  <div className={orcStyles.itemList}>
                    {o.servicos.map((s, idx) => (
                      <span key={idx} className={orcStyles.itemBadge}>{s.servico.nome}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`${styles.status} ${STATUS_COLORS[o.status] || styles.statusPendente}`}>
                    {o.status}
                  </span>
                </td>
                <td style={{ fontWeight: 800, color: "var(--primary)" }}>{fmt(o.valorFinal)}</td>
                <td>
                  <div className={styles.actions}>
                    <Eye size={15} className={styles.actionIcon} onClick={() => openView(o)} />
                    <Edit2 size={15} className={styles.actionIcon} onClick={() => openEdit(o)} />
                    <Calendar size={15} className={styles.actionIcon} onClick={() => openAgendar(o)} />
                    <Send size={15} className={styles.actionIcon} style={{ color: "#25D366" }} onClick={() => handleEnviarWhatsApp(o)} />
                    {isPremium ? (
                      <FileDown size={15} className={styles.actionIcon} style={{ color: "var(--primary)" }} onClick={() => gerarPDFOrcamento(o as any, empresa)} />
                    ) : (
                      <Lock size={15} className={styles.actionIcon} style={{ opacity: 0.3 }} />
                    )}
                    <Trash2 size={15} className={`${styles.actionIcon} ${styles.actionDelete}`} onClick={() => deleteOrcamento(o.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVO ORÇAMENTO (DESIGN PREMIUM) */}
      <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} title="Gerar Proposta Profissional" width="900px">
        <form onSubmit={handleCreate} className={orcStyles.premiumForm}>
          <div className={orcStyles.mainGrid}>
            <div className={orcStyles.configSection}>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>Cliente *</label>
                <select required className={formStyles.select} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Selecione o cliente...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div className={orcStyles.addItemSection}>
                <label className={formStyles.label}>Adicionar Serviços ao Orçamento</label>
                <div className={orcStyles.addBar}>
                  <select className={formStyles.select} value={servicoIdTemp} onChange={(e) => setServicoIdTemp(e.target.value)}>
                    <option value="">Escolher serviço...</option>
                    {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                  <button type="button" onClick={addServico} className={orcStyles.addBtn}><Plus size={20} /></button>
                </div>
                
                <div className={orcStyles.selectedList}>
                  {servicosEscolhidos.map((s, i) => (
                    <div key={i} className={orcStyles.selectedItem}>
                      <div className={orcStyles.selectedInfo}>
                        <ChevronRight size={14} color="var(--primary)" />
                        <span>{s.nome}</span>
                      </div>
                      <button type="button" onClick={() => removeServico(i)} className={orcStyles.miniDel}><Trash size={12} /></button>
                    </div>
                  ))}
                  {servicosEscolhidos.length === 0 && <p className={orcStyles.emptyMsg}>Nenhum serviço selecionado.</p>}
                </div>
              </div>

              <div className={formStyles.formGroup} style={{ marginTop: "1.5rem" }}>
                <label className={formStyles.label}>Observações / Condições</label>
                <textarea className={formStyles.textarea} rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: Válido por 7 dias. Pagamento via PIX." />
              </div>
            </div>

            <div className={orcStyles.priceSection}>
              <div className={orcStyles.glassCard}>
                <h3>VALOR TOTAL</h3>
                <div className={orcStyles.priceRow}><span>Serviços ({servicosEscolhidos.length})</span><strong>{fmt(custosNovo.total)}</strong></div>
                <div className={orcStyles.divider}></div>
                <div className={orcStyles.totalRow}>
                  <span>Total do Orçamento</span>
                  <strong>{fmt(custosNovo.total)}</strong>
                </div>
              </div>
              <button type="submit" disabled={isLoading || servicosEscolhidos.length === 0} className={orcStyles.mainSubmit}>
                {isLoading ? "Processando..." : "Gerar Orçamento"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL VISUALIZAR DETALHES */}
      <Modal isOpen={isViewOpen} onClose={() => setViewOpen(false)} title={`Orçamento: ${selected?.numero}`}>
        {selected && (
          <div className={orcStyles.detailView}>
            <div className={orcStyles.detailHeader}>
              <div>
                <label>CLIENTE</label>
                <h2>{selected.cliente.nome}</h2>
              </div>
              <span className={`${styles.status} ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
            </div>
            
            <div className={orcStyles.detailBody}>
              <h4 className={orcStyles.sectionTitle}>SERVIÇOS CONTRATADOS</h4>
              <div className={orcStyles.serviceTable}>
                {selected.servicos.map((s, i) => (
                  <div key={i} className={orcStyles.serviceRow}>
                    <span>{s.servico.nome}</span>
                    <strong>Sincronizado</strong>
                  </div>
                ))}
              </div>

              <div className={orcStyles.glassCard} style={{ marginTop: "2rem", padding: "1.5rem" }}>
                <div className={orcStyles.priceRow}><span>Materiais Aplicados</span><strong>{fmt(selected.custoMateriais)}</strong></div>
                <div className={orcStyles.priceRow}><span>Mão de Obra Especializada</span><strong>{fmt(selected.valorMaoDeObra)}</strong></div>
                <div className={orcStyles.divider}></div>
                <div className={orcStyles.priceRow} style={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>
                  <span>VALOR FINAL</span><strong>{fmt(selected.valorFinal)}</strong>
                </div>
              </div>

              {selected.observacoes && (
                <div className={orcStyles.obsBox}>
                  <label>OBSERVAÇÕES</label>
                  <p>{selected.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL EDITAR */}
      <Modal isOpen={isEditOpen} onClose={() => setEditOpen(false)} title="Editar Status/Obs">
        <form onSubmit={handleEdit}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Status do Orçamento</label>
            <select className={formStyles.select} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="Pendente">Pendente</option>
              <option value="Agendado">Agendado</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Observações Internas</label>
            <textarea className={formStyles.textarea} rows={4} value={editObs} onChange={(e) => setEditObs(e.target.value)} />
          </div>
          <div className={formStyles.actions}>
            <button type="button" className={formStyles.cancelBtn} onClick={() => setEditOpen(false)}>Cancelar</button>
            <button type="submit" disabled={isLoading} className="premium-button">Salvar Alterações</button>
          </div>
        </form>
      </Modal>

      {/* MODAL AGENDAR */}
      <Modal isOpen={isAgendaOpen} onClose={() => setAgendaOpen(false)} title="Agendamento">
        <form onSubmit={handleAgendar}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div className={formStyles.formGroup} style={{ flex: 1 }}>
              <label className={formStyles.label}>Data</label>
              <input type="date" required className={formStyles.input} value={agData} onChange={(e) => setAgData(e.target.value)} />
            </div>
            <div className={formStyles.formGroup} style={{ flex: 1 }}>
              <label className={formStyles.label}>Hora</label>
              <input type="time" required className={formStyles.input} value={agHora} onChange={(e) => setAgHora(e.target.value)} />
            </div>
          </div>
          <div className={formStyles.actions}>
            <button type="button" className={formStyles.cancelBtn} onClick={() => setAgendaOpen(false)}>Voltar</button>
            <button type="submit" disabled={isLoading} className="premium-button">Confirmar Agenda</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

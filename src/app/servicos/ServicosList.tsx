"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Package, X, Calculator, Trash, ChevronRight, Info } from "lucide-react";
import styles from "@/components/layout/list.module.css";
import sStyles from "./servicos.module.css";
import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { createServico, updateServico, deleteServico } from "@/app/actions/servicos";
import { getNichoById } from "@/lib/nichos";

type Material = { id: string; nome: string; unidade: string; custoUnitario: number };
type ServicoMaterial = { id: string; qtdUsada: number; material: Material };
type Servico = {
  id: string;
  nome: string;
  nicho: string | null;
  tempoMinutos: number;
  percentualMao: number;
  status: string;
  materiais: ServicoMaterial[];
};

const CONVERSOES: Record<string, Record<string, number>> = {
  volume: { ml: 1, litro: 1000, L: 1000 },
  peso: { g: 1, kg: 1000 },
  comprimento: { cm: 1, metro: 100, m: 100 },
  unidade: { unidade: 1, un: 1, folha: 1 },
};

function getGrupo(unidade: string) {
  for (const [grupo, unidades] of Object.entries(CONVERSOES)) {
    if (unidade.toLowerCase() in unidades) return grupo;
  }
  return "unidade";
}

function converterQtd(qtd: number, de: string, para: string) {
  const grupoDe = getGrupo(de);
  const grupoPara = getGrupo(para);
  
  if (grupoDe !== grupoPara) return qtd; // Não consegue converter entre tipos diferentes (ex: ml para kg)

  const fatorDe = CONVERSOES[grupoDe][de.toLowerCase()] || 1;
  const fatorPara = CONVERSOES[grupoPara][para.toLowerCase()] || 1;

  return (qtd * fatorDe) / fatorPara;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ServicosList({
  initialServicos,
  materiais,
  empresa,
}: {
  initialServicos: Servico[];
  materiais: Material[];
  empresa: { nicho: string };
}) {
  const nichoConfig = getNichoById(empresa.nicho);
  const labelMaterial = nichoConfig?.labelMaterial || "Material";
  const labelServico = nichoConfig?.labelServico || "Serviço";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Servico | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busca, setBusca] = useState("");

  // Form principal
  const [nome, setNome] = useState("");
  const [tempo, setTempo] = useState("60");
  const [percentual, setPercentual] = useState("30");

  // Lista de materiais temporários (vínculos)
  const [materiaisTemp, setMateriaisTemp] = useState<{ materialId: string; qtdUsada: number; material: Material; labelExibicao: string }[]>([]);
  const [tempMatId, setTempMatId] = useState("");
  const [tempQtd, setTempQtd] = useState("");
  const [tempUnidade, setTempUnidade] = useState("");

  // Atualiza unidade temp quando seleciona material
  const handleSelectMaterial = (id: string) => {
    setTempMatId(id);
    const m = materiais.find(x => x.id === id);
    if (m) setTempUnidade(m.unidade);
  };

  // Cálculo de custos derivado (Memoizado para performance)
  const custos = useMemo(() => {
    const custoMat = materiaisTemp.reduce((acc, m) => acc + (m.material.custoUnitario * m.qtdUsada), 0);
    const mao = custoMat * (parseFloat(percentual || "0") / 100);
    return { custoMat, mao, total: custoMat + mao };
  }, [materiaisTemp, percentual]);

  const openCreate = () => {
    setEditingItem(null); setNome(""); setTempo("60"); setPercentual("30");
    setMateriaisTemp([]); setTempMatId(""); setTempQtd("");
    setIsModalOpen(true);
  };

  const openEdit = (s: Servico) => {
    setEditingItem(s); setNome(s.nome); setTempo(s.tempoMinutos.toString());
    setPercentual(s.percentualMao.toString());
    setMateriaisTemp(s.materiais.map(sm => ({
      materialId: sm.material.id,
      qtdUsada: sm.qtdUsada,
      material: sm.material,
      labelExibicao: `${sm.qtdUsada} ${sm.material.unidade}`
    })));
    setIsModalOpen(true);
  };

  const addMaterialTemp = () => {
    if (!tempMatId || !tempQtd) return;
    const mat = materiais.find(m => m.id === tempMatId);
    if (!mat) return;
    
    const qtdBase = converterQtd(parseFloat(tempQtd), tempUnidade, mat.unidade);

    setMateriaisTemp([...materiaisTemp, {
      materialId: tempMatId,
      qtdUsada: qtdBase,
      material: mat,
      labelExibicao: `${tempQtd}${tempUnidade}`
    }]);
    setTempMatId(""); setTempQtd("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = {
        nome, nicho: nichoConfig?.nome || "",
        tempoMinutos: parseInt(tempo),
        percentualMao: parseFloat(percentual),
        status: "ativo",
        materiais: materiaisTemp.map(m => ({ materialId: m.materialId, qtdUsada: m.qtdUsada }))
      };
      if (editingItem) {
        await updateServico(editingItem.id, data);
      } else {
        await createServico(data);
      }
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const filtrados = initialServicos.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{labelServico}s</h1>
          <p className={styles.subtitle}>Engenharia de custos e precificação técnica</p>
        </div>
        <button className="premium-button" onClick={openCreate}><Plus size={18} /> Novo {labelServico}</button>
      </header>

      <div className={styles.tableCard}>
        <div className={styles.filters}>
          <input type="text" placeholder="Pesquisar..." className={styles.searchInput} value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{labelServico}</th>
              <th>Mão de Obra</th>
              <th>Investimento Final</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(s => {
              const c = materiaisTemp.length > 0 && s.id === editingItem?.id ? custos : { total: s.materiais.reduce((acc, sm) => acc + (sm.material.custoUnitario * sm.qtdUsada), 0) * (1 + s.percentualMao/100) };
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{s.nome}</div>
                    <div className={sStyles.materialTags}>
                      {s.materiais.map(sm => <span key={sm.id} className={sStyles.materialTag}>{sm.material.nome}</span>)}
                    </div>
                  </td>
                  <td><span className={sStyles.badge}>{s.percentualMao}%</span></td>
                  <td><strong style={{ color: "var(--primary)", fontSize: "1.1rem" }}>{fmt(c.total)}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <Edit2 size={16} className={styles.actionIcon} onClick={() => openEdit(s)} />
                      <Trash2 size={16} className={`${styles.actionIcon} ${styles.actionDelete}`} onClick={() => deleteServico(s.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Refinar Serviço" : "Engenharia de Novo Serviço"} width="900px">
        <form onSubmit={handleSubmit} className={sStyles.premiumForm}>
          <div className={sStyles.mainGrid}>
            <div className={sStyles.configSection}>
              <h4 className={sStyles.sectionTitle}><Info size={16} /> Definições Básicas</h4>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>Nome do {labelServico}</label>
                <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className={formStyles.input} placeholder="Ex: Lavagem Detalhada" />
              </div>
              <div className={sStyles.row}>
                <div className={formStyles.formGroup}>
                  <label className={formStyles.label}>Tempo (min)</label>
                  <input type="number" value={tempo} onChange={e => setTempo(e.target.value)} onFocus={e => e.target.select()} className={formStyles.input} />
                </div>
                <div className={formStyles.formGroup}>
                  <label className={formStyles.label}>Mão de Obra %</label>
                  <input type="number" value={percentual} onChange={e => setPercentual(e.target.value)} onFocus={e => e.target.select()} className={formStyles.input} />
                </div>
              </div>

              <div className={sStyles.compositionArea}>
                <h4 className={sStyles.sectionTitle}><Package size={16} /> Composição de {labelMaterial}s</h4>
                <div className={sStyles.addBar}>
                  <select value={tempMatId} onChange={e => handleSelectMaterial(e.target.value)} className={formStyles.select}>
                    <option value="">Selecionar {labelMaterial.toLowerCase()}...</option>
                    {materiais.map(m => <option key={m.id} value={m.id}>{m.nome} ({fmt(m.custoUnitario)}/{m.unidade})</option>)}
                  </select>
                  <div className={sStyles.qtyGroup}>
                    <input type="number" placeholder="0" value={tempQtd} onChange={e => setTempQtd(e.target.value)} onFocus={e => e.target.select()} className={formStyles.input} />
                    <select value={tempUnidade} onChange={e => setTempUnidade(e.target.value)} className={formStyles.select}>
                      <option value="unidade">un</option>
                      <option value="folha">folha</option>
                      <option value="ml">ml</option>
                      <option value="litro">L</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="cm">cm</option>
                      <option value="metro">m</option>
                    </select>
                    <button type="button" onClick={addMaterialTemp} className={sStyles.addBtn}><Plus size={20} /></button>
                  </div>
                </div>

                <div className={sStyles.compositionList}>
                  {materiaisTemp.length === 0 ? (
                    <div className={sStyles.emptyState}>Nenhum material adicionado à engenharia deste serviço.</div>
                  ) : (
                    materiaisTemp.map((m, i) => (
                      <div key={i} className={sStyles.compositionItem}>
                        <div className={sStyles.compInfo}>
                          <ChevronRight size={14} color="var(--primary)" />
                          <span>{m.material.nome}</span>
                          <small>{m.labelExibicao}</small>
                        </div>
                        <button type="button" onClick={() => setMateriaisTemp(materiaisTemp.filter((_, idx) => idx !== i))} className={sStyles.miniDel}><Trash size={12} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={sStyles.priceSection}>
              <div className={sStyles.glassCard}>
                <h3>RESUMO DO PREÇO</h3>
                <div className={sStyles.priceRow}>
                  <span>Custos de Insumos</span>
                  <strong>{fmt(custos.custoMat)}</strong>
                </div>
                <div className={sStyles.priceRow}>
                  <span>Mão de Obra ({percentual}%)</span>
                  <strong>{fmt(custos.mao)}</strong>
                </div>
                <div className={sStyles.divider}></div>
                <div className={sStyles.totalRow}>
                  <span>Preço Sugerido</span>
                  <strong>{fmt(custos.total)}</strong>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className={sStyles.mainSubmit}>
                {isLoading ? "Processando..." : editingItem ? "Atualizar Engenharia" : "Finalizar Cadastro"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

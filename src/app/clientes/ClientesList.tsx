"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Send } from "lucide-react";
import styles from "@/components/layout/list.module.css";
import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { createCliente, updateCliente, deleteCliente } from "@/app/actions/clientes";

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  totalGasto: number;
};

export function ClientesList({ initialClientes }: { initialClientes: Cliente[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const openCreate = () => {
    setEditingCliente(null);
    setNome(""); setTelefone(""); setEmail("");
    setIsModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setNome(c.nome); setTelefone(c.telefone ?? ""); setEmail(c.email ?? "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    setIsLoading(true);
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, { nome, telefone, email });
      } else {
        await createCliente({ nome, telefone, email });
      }
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      await deleteCliente(id);
    }
  };

  const handleWhatsApp = (tel: string | null, nome: string) => {
    if (!tel) return alert("Cliente sem WhatsApp cadastrado.");
    const numero = tel.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${nome}, tudo bem?`);
    window.open(`https://wa.me/55${numero}?text=${msg}`, "_blank");
  };

  const clientesFiltrados = initialClientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone ?? "").includes(busca)
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Gestão de contatos e histórico</p>
        </div>
        <button className={`premium-button ${styles.primaryBtn}`} onClick={openCreate}>
          <Plus size={18} /> Novo Cliente
        </button>
      </header>

      <div className={styles.tableCard}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className={styles.searchInput}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>WhatsApp</th>
              <th>E-mail</th>
              <th>Total Gasto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--secondary-foreground)" }}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.nome.toUpperCase()}</td>
                  <td>{c.telefone || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td style={{ fontWeight: 600, color: "var(--success)" }}>
                    {c.totalGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Send
                        size={16}
                        className={styles.actionIcon}
                        style={{ color: "#25D366" }}
                        onClick={() => handleWhatsApp(c.telefone, c.nome)}
                      />
                      <Edit2 size={16} className={styles.actionIcon} onClick={() => openEdit(c)} />
                      <Trash2
                        size={16}
                        className={`${styles.actionIcon} ${styles.actionDelete}`}
                        onClick={() => handleDelete(c.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCliente ? "Editar Cliente" : "Cadastrar Novo Cliente"}
      >
        <form onSubmit={handleSubmit}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Nome Completo / Empresa *</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className={formStyles.input} placeholder="Ex: João da Silva" />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>WhatsApp</label>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className={formStyles.input} placeholder="(00) 00000-0000" />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>E-mail (Opcional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formStyles.input} placeholder="joao@email.com" />
          </div>
          <div className={formStyles.actions}>
            <button type="button" className={formStyles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" disabled={isLoading} className="premium-button">
              {isLoading ? "Salvando..." : editingCliente ? "Salvar Alterações" : "Salvar Cliente"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

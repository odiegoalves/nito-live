"use client";

import { useState } from "react";
import { Edit2, Trash2, Shield, User, Star, Key, Plus, Copy, Check, Save, RefreshCw, MessageSquare } from "lucide-react";
import styles from "./admin.module.css";
import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { updateUserDetails, deleteUserAdmin, createLicenseAdmin } from "@/app/actions/admin";
import { NICHOS } from "@/lib/nichos";

type UserData = {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  createdAt: Date;
  empresa: {
    nome: string;
    nicho: string;
    plano: string;
    telefone: string | null;
    metodoPagamento: string | null;
    planoExpiresAt: Date | string | null;
    _count: {
      clientes: number;
      orcamentos: number;
    }
  } | null;
};

export function AdminClient({ initialUsers, currentUserId }: { initialUsers: UserData[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // States de Criação de Chave / Licença
  const [createEmail, setCreateEmail] = useState("");
  const [createNome, setCreateNome] = useState("");
  const [createPlano, setCreatePlano] = useState("pro");
  const [createChave, setCreateChave] = useState("");
  const [createdResult, setCreatedResult] = useState<{ email: string; chave: string } | null>(null);

  // Edit states
  const [editRole, setEditRole] = useState("");
  const [editPlano, setEditPlano] = useState("");
  const [editNicho, setEditNicho] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editEmpresaNome, setEditEmpresaNome] = useState("");
  const [editChave, setEditChave] = useState("");
  const [copiedChave, setCopiedChave] = useState(false);

  const gerarNovaChave = (plano = "basic") => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const prefix = plano.toUpperCase() === "PREMIUM" ? "LIVEINF-PREMIUM" : plano.toUpperCase() === "PRO" ? "LIVEINF-PRO" : "LIVEINF-BASIC";
    let block1 = "", block2 = "", block3 = "", block4 = "";
    for (let i = 0; i < 5; i++) block1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 5; i++) block2 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 5; i++) block3 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 5; i++) block4 += chars.charAt(Math.floor(Math.random() * chars.length));
    return `${prefix}-${block1}-${block2}-${block3}-${block4}`;
  };

  const openCreateModal = () => {
    setCreateEmail("");
    setCreateNome("");
    setCreatePlano("pro");
    setCreateChave(gerarNovaChave("pro"));
    setCreatedResult(null);
    setIsCreateOpen(true);
  };

  const openEdit = (u: UserData) => {
    setSelectedUser(u);
    setEditRole(u.role);
    const userPlano = u.empresa?.plano || "basic";
    setEditPlano(userPlano);
    setEditNicho(u.empresa?.nicho || "");
    setEditNome(u.nome || "");
    setEditEmpresaNome(u.empresa?.nome || "");
    setEditChave(gerarNovaChave(userPlano));
    setCopiedChave(false);
    setIsEditOpen(true);
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail) return alert("Informe o e-mail do cliente.");
    setIsLoading(true);
    try {
      const res = await createLicenseAdmin({
        email: createEmail,
        nome: createNome,
        plano: createPlano,
        chave: createChave
      });

      if (res.ok) {
        setCreatedResult({ email: createEmail, chave: res.chave });
      }
    } catch (err: any) {
      alert("Erro ao criar licença: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      await updateUserDetails(selectedUser.id, {
        role: editRole,
        nome: editNome,
        empresa: {
          plano: editPlano,
          nicho: editNicho,
          nome: editEmpresaNome,
        }
      });
      // Update local state
      setUsers(users.map(u => u.id === selectedUser.id ? {
        ...u,
        role: editRole,
        nome: editNome,
        empresa: u.empresa ? { ...u.empresa, plano: editPlano, nicho: editNicho, nome: editEmpresaNome } : null
      } : u));
      setIsEditOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUserId) return alert("Você não pode deletar a si mesmo!");
    if (!confirm("TEM CERTEZA? Isso apagará permanentemente esta licença e a chave vinculada!")) return;
    
    setIsLoading(true);
    try {
      await deleteUserAdmin(id);
      setUsers(users.filter(u => u.id !== id));
      if (isEditOpen) setIsEditOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const copiarChaveTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedChave(true);
    setTimeout(() => setCopiedChave(false), 2000);
  };

  const enviarWhatsApp = (telefone: string | null | undefined, email: string, chave: string, plano: string) => {
    const mensagem = `Olá! Segue sua chave de acesso exclusiva da extensão NITO LIVE:

🔑 *Chave:* ${chave}
📧 *E-mail:* ${email}
⚡ *Plano:* ${(plano || "PRO").toUpperCase()}

Para ativar:
1. Abra a extensão NITO LIVE
2. Cole esta chave no campo de licença
3. Clique em Ativar Acesso!`;

    const encodedMsg = encodeURIComponent(mensagem);
    const numLimpo = telefone ? telefone.replace(/[^\d]/g, "") : "";
    
    if (numLimpo && numLimpo.length >= 10) {
      window.open(`https://wa.me/55${numLimpo}?text=${encodedMsg}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, "_blank");
    }
  };

  return (
    <>
      {/* CABEÇALHO DO PAINEL ADMIN COM BOTÃO DE NOVA LICENÇA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#fff", margin: 0 }}>Gerenciador de Licenças & Usuários</h2>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0 0" }}>Gere novas chaves, envie por WhatsApp e gerencie licenças da extensão</p>
        </div>
        <button 
          onClick={openCreateModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, #ffd000, #ffaa00)",
            color: "#050507",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontWeight: "800",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(255,208,0,0.25)"
          }}
        >
          <Plus size={18} /> + Nova Chave de Licença
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuário / Empresa</th>
              <th>Chave de Acesso</th>
              <th>Acesso</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Enviar Chave / Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const userChave = `LIVEINF-${(u.empresa?.plano || 'BASIC').toUpperCase()}-${u.id.substring(0, 5).toUpperCase()}-${u.id.substring(5, 10).toUpperCase()}`;
              return (
                <tr key={u.id}>
                  <td>
                    <div className={styles.userMain}>
                      <div className={styles.avatar}>{(u.nome?.[0] || u.email[0]).toUpperCase()}</div>
                      <div>
                        <div className={styles.userName}>{u.nome || "Sem nome"}</div>
                        <div className={styles.userEmail}>{u.email}</div>
                        <div className={styles.empName}>{u.empresa?.nome || "Sem empresa"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.2)", padding: "4px 8px", borderRadius: "6px", color: "#ffd000", fontWeight: "700" }}>
                        {userChave}
                      </span>
                      <button 
                        onClick={() => copiarChaveTexto(userChave)}
                        title="Copiar Chave"
                        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "2px" }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles["role" + u.role]}`}>
                      {u.role === "admin" ? <Star size={12} /> : u.role === "moderator" ? <Shield size={12} /> : <User size={12} />}
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.planoBadge} ${styles["plano" + (u.empresa?.plano || "free")]}`}>
                      {(u.empresa?.plano || "free").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className={styles.userStats}>
                      <span>{u.empresa?._count.clientes || 0} CLI</span>
                      <span>{u.empresa?._count.orcamentos || 0} ORC</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.adminActions} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button 
                        onClick={() => enviarWhatsApp(u.empresa?.telefone, u.email, userChave, u.empresa?.plano || 'pro')}
                        className={styles.waIconBtn || styles.whatsappBtn}
                        style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 10px", fontWeight: "800", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        title="Enviar chave diretamente pelo WhatsApp"
                      >
                        <MessageSquare size={14} /> WhatsApp
                      </button>
                      <button className={styles.editBtn} onClick={() => openEdit(u)} title="Editar Licença / Gerar Nova Chave"><Edit2 size={16} /></button>
                      <button className={styles.delBtn} onClick={() => handleDelete(u.id)} title="Excluir Licença com Problema"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CRIAR NOVA CHAVE DE LICENÇA */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="🔑 Criar Nova Chave de Licença">
        {!createdResult ? (
          <form onSubmit={handleCreateLicense} className={styles.adminForm}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>E-mail do Cliente *</label>
              <input 
                type="email" 
                value={createEmail} 
                onChange={e => setCreateEmail(e.target.value)} 
                placeholder="ex: albertovgf@gmail.com"
                className={formStyles.input} 
                required 
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Nome do Cliente (Opcional)</label>
              <input 
                type="text" 
                value={createNome} 
                onChange={e => setCreateNome(e.target.value)} 
                placeholder="ex: Alberto Silva"
                className={formStyles.input} 
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Plano da Licença</label>
              <select 
                value={createPlano} 
                onChange={e => {
                  setCreatePlano(e.target.value);
                  setCreateChave(gerarNovaChave(e.target.value));
                }} 
                className={formStyles.select}
              >
                <option value="basic">BÁSICO (Individual - 1 Licença)</option>
                <option value="pro">PRO (Duplo - 2 Licenças + IA/Vídeos)</option>
                <option value="premium">PREMIUM (Infinity - Ilimitado + Todos os recursos)</option>
              </select>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Chave de Acesso Gerada</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  value={createChave} 
                  onChange={e => setCreateChave(e.target.value)} 
                  className={formStyles.input} 
                  style={{ fontFamily: "monospace", fontWeight: "700", color: "#ffd000" }} 
                />
                <button 
                  type="button"
                  onClick={() => setCreateChave(gerarNovaChave(createPlano))}
                  style={{ background: "rgba(255,208,0,0.15)", border: "1px solid rgba(255,208,0,0.3)", color: "#ffd000", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <RefreshCw size={14} /> Gerar Outra
                </button>
              </div>
            </div>

            <div className={formStyles.actions}>
              <button type="button" className={formStyles.cancelBtn} onClick={() => setIsCreateOpen(false)}>Cancelar</button>
              <button type="submit" disabled={isLoading} className="premium-button">
                {isLoading ? "Gerando..." : <><Key size={18} /> Ativar Licença Agora</>}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
            <h3 style={{ color: "#00e676", fontSize: "16px", margin: "0 0 6px 0" }}>Licença Ativada com Sucesso!</h3>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 16px 0" }}>
              Envie estes dados para o seu cliente para liberar o acesso:
            </p>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px", textAlign: "left", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>E-mail de Login:</div>
              <strong style={{ fontSize: "13px", color: "#fff", display: "block", marginBottom: "10px" }}>{createdResult.email}</strong>

              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>Chave de Acesso:</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: "8px", padding: "8px 12px", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "14px", color: "#ffd000", fontFamily: "monospace" }}>{createdResult.chave}</strong>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => enviarWhatsApp(null, createdResult.email, createdResult.chave, createPlano)}
                    style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontWeight: "800", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </button>
                  <button 
                    onClick={() => copiarChaveTexto(createdResult.chave)}
                    style={{ background: "#ffd000", color: "#000", border: "none", borderRadius: "6px", padding: "6px 12px", fontWeight: "800", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    {copiedChave ? <Check size={14} /> : <Copy size={14} />} {copiedChave ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsCreateOpen(false)}
              className="premium-button"
              style={{ width: "100%" }}
            >
              Concluído
            </button>
          </div>
        )}
      </Modal>

      {/* MODAL DE EDIÇÃO DE LICENÇA EXISTENTE (COM GERADOR DE NOVA CHAVE E EXCLUSÃO) */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`EDITAR LICENÇA: ${selectedUser?.email}`}>
        <form onSubmit={handleUpdate} className={styles.adminForm}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Chave da licença</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input 
                type="text" 
                value={editChave} 
                onChange={e => setEditChave(e.target.value)} 
                className={formStyles.input} 
                style={{ fontFamily: "monospace", fontWeight: "700", color: "#ffd000" }} 
              />
              <button 
                type="button"
                onClick={() => setEditChave(gerarNovaChave(editPlano))}
                title="Gerar uma nova chave aleatória"
                style={{ background: "rgba(255,208,0,0.15)", border: "1px solid rgba(255,208,0,0.3)", color: "#ffd000", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}
              >
                <RefreshCw size={14} /> Gerar Nova
              </button>
              <button 
                type="button"
                onClick={() => copiarChaveTexto(editChave)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "#fff", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}
              >
                {copiedChave ? <Check size={14} /> : <Copy size={14} />} {copiedChave ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Plano da Licença</label>
              <select 
                value={editPlano} 
                onChange={e => {
                  setEditPlano(e.target.value);
                  setEditChave(gerarNovaChave(e.target.value));
                }} 
                className={formStyles.select}
              >
                <option value="basic">Básico — R$ 97/mês</option>
                <option value="pro">Pro — R$ 147/mês</option>
                <option value="premium">Premium — R$ 197/mês</option>
                <option value="free">Gratuito / Teste</option>
              </select>
            </div>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Nível de Acesso</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)} className={formStyles.select}>
                <option value="user">USUÁRIO PADRÃO</option>
                <option value="moderator">MODERADOR (SUPORTE)</option>
                <option value="admin">ADMINISTRADOR TOTAL</option>
              </select>
            </div>
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Nome Completo / Empresa</label>
            <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)} className={formStyles.input} />
          </div>

          <div className={formStyles.actions} style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "16px" }}>
            <button 
              type="button" 
              onClick={() => selectedUser && handleDelete(selectedUser.id)} 
              style={{ background: "rgba(255,23,23,0.15)", border: "1px solid rgba(255,23,23,0.4)", color: "#ff2626", borderRadius: "8px", padding: "10px 14px", fontSize: "11px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Trash2 size={16} /> Excluir Licença com Problema
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className={formStyles.cancelBtn} onClick={() => setIsEditOpen(false)}>Cancelar</button>
              <button type="submit" disabled={isLoading} className="premium-button">
                {isLoading ? "Salvando..." : <><Save size={18} /> Salvar Alterações</>}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}

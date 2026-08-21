"use client";

// =============================================================================
// NITO LIVE - Aulas.
// Trilha organizada por modulo. So a administracao publica; o aluno assiste,
// curte, comenta e baixa o material. Cada aula concluida rende 100 XP.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, ehAdmin } from "@/components/nito/AppShell";
import { AulaDetalhe } from "@/components/nito/AulaDetalhe";
import { Icone } from "@/components/nito/NitoIcones";
import {
  Aulas,
  AulasAdmin,
  Aula,
  AulaMaterial,
  AulaProgresso,
  Perfil,
} from "@/lib/nito-motor";

function duracao(seg?: number | null) {
  if (!seg) return "";
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const AULA_VAZIA = {
  id: undefined as string | undefined,
  modulo: "",
  modulo_ordem: 1,
  ordem: 1,
  titulo: "",
  descricao: "",
  video_url: "",
  duracao_seg: 0,
  publicado: true,
};

function Conteudo({ perfil }: { perfil: Perfil }) {
  const admin = ehAdmin(perfil);

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [progresso, setProgresso] = useState<Record<string, AulaProgresso>>({});
  const [materiais, setMateriais] = useState<Record<string, AulaMaterial[]>>({});
  const [curtidas, setCurtidas] = useState<Record<string, number>>({});
  const [curtidas_minhas, setMinhas] = useState<Set<string>>(new Set());
  const [aberta, setAberta] = useState<Aula | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [form, setForm] = useState({ ...AULA_VAZIA });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await Aulas.listar(admin);
      setAulas(lista);
      const ids = lista.map((a) => a.id);
      const [prog, mats, cont, minhas] = await Promise.all([
        Aulas.meuProgresso(),
        Aulas.materiais(ids),
        Aulas.contarCurtidas(ids),
        Aulas.minhasCurtidas(ids),
      ]);
      setProgresso(prog);
      setMateriais(mats);
      setCurtidas(cont);
      setMinhas(minhas);
    } catch {
      setAulas([]);
    } finally {
      setCarregando(false);
    }
  }, [admin]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Agrupa por modulo mantendo a ordem que veio do banco.
  const modulos = useMemo(() => {
    const mapa = new Map<string, Aula[]>();
    aulas.forEach((a) => {
      const chave = a.modulo || "Sem módulo";
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(a);
    });
    return Array.from(mapa.entries());
  }, [aulas]);

  const concluidas = aulas.filter((a) => progresso[a.id]?.concluida).length;
  const pct = aulas.length ? Math.round((concluidas / aulas.length) * 100) : 0;

  function aoCurtir(aulaId: string, agora: boolean) {
    setMinhas((antes) => {
      const n = new Set(antes);
      if (agora) n.add(aulaId);
      else n.delete(aulaId);
      return n;
    });
    setCurtidas((antes) => ({
      ...antes,
      [aulaId]: Math.max(0, (antes[aulaId] ?? 0) + (agora ? 1 : -1)),
    }));
  }

  async function salvarAula() {
    if (!form.titulo.trim() || !form.modulo.trim() || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await AulasAdmin.salvarAula({
        id: form.id,
        modulo: form.modulo.trim(),
        modulo_ordem: Number(form.modulo_ordem) || 1,
        ordem: Number(form.ordem) || 1,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        video_url: form.video_url.trim() || undefined,
        duracao_seg: Number(form.duracao_seg) || undefined,
        publicado: form.publicado,
      });
      setForm({ ...AULA_VAZIA });
      setMostrarForm(false);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar a aula.");
    } finally {
      setSalvando(false);
    }
  }

  function editar(a: Aula) {
    setForm({
      id: a.id,
      modulo: a.modulo ?? "",
      modulo_ordem: a.modulo_ordem ?? 1,
      ordem: a.ordem ?? 1,
      titulo: a.titulo ?? "",
      descricao: a.descricao ?? "",
      video_url: a.video_url ?? "",
      duracao_seg: a.duracao_seg ?? 0,
      publicado: a.publicado ?? true,
    });
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AppShell perfil={perfil} ativa="aulas">
      <div className="view on">
        <div className="spread" style={{ alignItems: "flex-start" }}>
          <div>
            <h1 className="title-xl">
              Trilha do <em>vendedor de live</em>.
            </h1>
            <p className="sub">Do primeiro produto fixado à live de seis dígitos.</p>
          </div>
        </div>

        {admin && (
          <div className="admin-bar" style={{ marginTop: 22 }}>
            <span className="tag">ADMIN</span>
            <b>Você é o único que publica aqui.</b>
            <div className="push-a">
              <button
                className="btn gold"
                onClick={() => {
                  setForm({ ...AULA_VAZIA });
                  setMostrarForm((v) => !v);
                }}
                type="button"
              >
                {mostrarForm ? "Cancelar" : "+ Nova aula"}
              </button>
            </div>
          </div>
        )}

        {admin && mostrarForm && (
          <div className="panel pad" style={{ marginBottom: 18 }}>
            <h2 className="h-sec" style={{ marginBottom: 16 }}>
              {form.id ? "Editar aula" : "Nova aula"}
            </h2>

            <div className="grid3">
              <div className="campo">
                <label>Módulo</label>
                <input
                  list="lista-modulos"
                  value={form.modulo}
                  onChange={(e) => setForm({ ...form, modulo: e.target.value })}
                  placeholder="Módulo 1 · Fundamentos"
                />
                <datalist id="lista-modulos">
                  {modulos.map(([nome]) => (
                    <option key={nome} value={nome} />
                  ))}
                </datalist>
              </div>
              <div className="campo">
                <label>Ordem do módulo</label>
                <input
                  type="number"
                  value={form.modulo_ordem}
                  onChange={(e) => setForm({ ...form, modulo_ordem: Number(e.target.value) })}
                />
              </div>
              <div className="campo">
                <label>Ordem da aula</label>
                <input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="campo">
              <label>Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Rotação de produtos sem perder o ritmo"
              />
            </div>

            <div className="campo">
              <label>Descrição</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="O que o aluno vai aprender nesta aula…"
              />
            </div>

            <div className="grid2">
              <div className="campo">
                <label>Link do vídeo</label>
                <input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=…"
                />
              </div>
              <div className="campo">
                <label>Duração em segundos</label>
                <input
                  type="number"
                  value={form.duracao_seg}
                  onChange={(e) => setForm({ ...form, duracao_seg: Number(e.target.value) })}
                  placeholder="1025"
                />
              </div>
            </div>

            {erro && (
              <div className="aviso erro">
                <span className="avisoIcone">!</span>
                <div>{erro}</div>
              </div>
            )}

            <div className="spread" style={{ marginTop: 6, flexWrap: "wrap", gap: 10 }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(e) => setForm({ ...form, publicado: e.target.checked })}
                />
                Publicar para os alunos agora
              </label>
              <button className="btn p" onClick={salvarAula} disabled={salvando} type="button">
                {salvando ? "Salvando…" : form.id ? "Salvar alterações" : "Criar aula"}
              </button>
            </div>
          </div>
        )}

        <div className="panel pad" style={{ margin: "18px 0 22px" }}>
          <div className="spread" style={{ marginBottom: 12 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>SEU PROGRESSO NA TRILHA</div>
              <b style={{ font: "900 1.1rem/1 var(--disp)", textTransform: "uppercase" }}>
                {concluidas} de {aulas.length} {aulas.length === 1 ? "aula concluída" : "aulas concluídas"}
              </b>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="num" style={{ font: "900 1.6rem/1 var(--disp)", color: "var(--gold)" }}>{pct}%</div>
              <div className="eyebrow">{modulos.length} {modulos.length === 1 ? "MÓDULO" : "MÓDULOS"}</div>
            </div>
          </div>
          <div className="bar" style={{ height: 10 }}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>

        {aberta && (
          <AulaDetalhe
            aula={aberta}
            admin={admin}
            materiais={materiais[aberta.id] ?? []}
            curtiu={curtidas_minhas.has(aberta.id)}
            curtidas={curtidas[aberta.id] ?? 0}
            onCurtir={aoCurtir}
            onFechar={() => setAberta(null)}
            onMaterialNovo={(m) =>
              setMateriais((antes) => ({ ...antes, [m.aula_id]: [...(antes[m.aula_id] ?? []), m] }))
            }
          />
        )}

        {carregando && (
          <div className="panel pad muted" style={{ textAlign: "center" }}>Carregando a trilha…</div>
        )}

        {!carregando && aulas.length === 0 && (
          <div className="panel pad muted" style={{ textAlign: "center" }}>
            {admin
              ? "Nenhuma aula publicada ainda. Use o botão + Nova aula acima."
              : "As aulas estão sendo preparadas. Volte em breve."}
          </div>
        )}

        {modulos.map(([nome, doModulo]) => {
          const feitas = doModulo.filter((a) => progresso[a.id]?.concluida).length;
          const estado =
            feitas === doModulo.length ? "ok" : feitas > 0 ? "wait" : "no";
          const rotulo =
            feitas === doModulo.length ? "CONCLUÍDO" : feitas > 0 ? "EM ANDAMENTO" : "NÃO INICIADO";

          return (
            <div key={nome}>
              <div className="spread" style={{ marginBottom: 14 }}>
                <h2 className="h-sec">{nome}</h2>
                <span className={`pill ${estado}`}>{rotulo}</span>
              </div>

              <div className="trilha" style={{ marginBottom: 26 }}>
                {doModulo.map((a) => {
                  const p = progresso[a.id];
                  const feita = !!p?.concluida;
                  const pctAula =
                    a.duracao_seg && p?.segundos
                      ? Math.min(100, Math.round((p.segundos / a.duracao_seg) * 100))
                      : 0;

                  return (
                    <article
                      className={`panel aula${feita ? " done" : ""}`}
                      key={a.id}
                      onClick={() => setAberta(a)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setAberta(a)}
                    >
                      <div className="thumb">
                        <div className="play">
                          <Icone nome="play" tam={16} />
                        </div>
                        <span className="mod">AULA {a.ordem}</span>
                        {a.duracao_seg ? <span className="dur num">{duracao(a.duracao_seg)}</span> : null}
                      </div>
                      <div className="info">
                        <b>{a.titulo}</b>
                        {!feita && pctAula > 0 && (
                          <div className="bar" style={{ marginTop: 9 }}>
                            <i style={{ width: `${pctAula}%`, background: "var(--grad)", boxShadow: "0 0 12px rgba(255,15,61,.5)" }} />
                          </div>
                        )}
                        <div className="meta">
                          <span>
                            {feita ? "✓ CONCLUÍDA" : pctAula > 0 ? `${pctAula}% ASSISTIDA` : "NÃO INICIADA"}
                            {!a.publicado && " · RASCUNHO"}
                          </span>
                          <span>
                            ♥ {curtidas[a.id] ?? 0}
                            {admin && (
                              <button
                                className="btn g"
                                style={{ padding: "4px 8px", fontSize: ".58rem", marginLeft: 8 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editar(a);
                                }}
                                type="button"
                              >
                                Editar
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

export default function AulasPage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}

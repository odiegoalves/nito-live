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
  Modulos,
  Aula,
  Modulo,
  AulaMaterial,
  AulaProgresso,
  Perfil,
  comoErro,
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
  modulo_id: "" as string,
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
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [gerenciandoModulos, setGerenciandoModulos] = useState(false);
  const [novoModulo, setNovoModulo] = useState("");
  const [avisoModulo, setAvisoModulo] = useState<string | null>(null);
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
      const [lista, mods] = await Promise.all([Aulas.listar(admin), Modulos.listar()]);
      setAulas(lista);
      setModulos(mods);
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

  // A trilha e montada a partir dos MODULOS, nao das aulas. Assim um modulo
  // recem criado aparece vazio, esperando a primeira aula.
  const trilha = useMemo(() => {
    const porModulo = new Map<string, Aula[]>();
    aulas.forEach((a) => {
      const chave = a.modulo_id ?? "sem-modulo";
      if (!porModulo.has(chave)) porModulo.set(chave, []);
      porModulo.get(chave)!.push(a);
    });

    const blocos = modulos.map((m) => ({
      modulo: m,
      aulas: porModulo.get(m.id) ?? [],
    }));

    const soltas = porModulo.get("sem-modulo") ?? [];
    if (soltas.length) {
      blocos.push({
        modulo: { id: "sem-modulo", nome: "Sem módulo", ordem: 999, criado_em: "" } as Modulo,
        aulas: soltas,
      });
    }
    return blocos;
  }, [aulas, modulos]);

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

  async function criarModulo() {
    const nome = novoModulo.trim();
    if (!nome || salvando) return;
    setSalvando(true);
    setAvisoModulo(null);
    try {
      await Modulos.salvar({ nome, ordem: modulos.length + 1 });
      setNovoModulo("");
      await carregar();
    } catch (e) {
      setAvisoModulo(comoErro(e, "Não consegui criar o módulo.").message);
    } finally {
      setSalvando(false);
    }
  }

  async function apagarModulo(m: Modulo) {
    if (salvando) return;
    setAvisoModulo(null);
    try {
      const quantas = await Modulos.quantasAulas(m.id);
      if (quantas > 0) {
        setAvisoModulo(
          `"${m.nome}" tem ${quantas} ${quantas === 1 ? "aula" : "aulas"}. Apague ou mova ${
            quantas === 1 ? "ela" : "elas"
          } antes de excluir o módulo.`
        );
        return;
      }
      if (!window.confirm(`Excluir o módulo "${m.nome}"? Ele está vazio, então nada de conteúdo se perde.`)) return;
      setSalvando(true);
      await Modulos.apagar(m.id);
      await carregar();
    } catch (e) {
      setAvisoModulo(comoErro(e, "Não consegui excluir o módulo.").message);
    } finally {
      setSalvando(false);
    }
  }

  async function apagarAula(a: Aula) {
    if (salvando) return;
    if (!window.confirm(`Excluir a aula "${a.titulo}"? Os comentários e o progresso dos alunos vão junto. Isso não tem volta.`)) return;
    setSalvando(true);
    try {
      await AulasAdmin.apagarAula(a.id);
      if (aberta?.id === a.id) setAberta(null);
      await carregar();
    } catch (e) {
      setErro(comoErro(e, "Não consegui excluir a aula.").message);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarAula() {
    if (!form.titulo.trim() || !form.modulo_id || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const mod = modulos.find((m) => m.id === form.modulo_id);
      await AulasAdmin.salvarAula({
        id: form.id,
        modulo_id: form.modulo_id,
        modulo: mod?.nome ?? form.modulo,
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
      setErro(comoErro(e, "Não consegui salvar a aula.").message);
    } finally {
      setSalvando(false);
    }
  }

  function editar(a: Aula) {
    setForm({
      id: a.id,
      modulo: a.modulo ?? "",
      modulo_id: a.modulo_id ?? "",
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
              <button className="btn g" onClick={() => setGerenciandoModulos((v) => !v)} type="button">
                {gerenciandoModulos ? "Fechar módulos" : "Módulos"}
              </button>
              <button
                className="btn gold"
                onClick={() => {
                  setForm({ ...AULA_VAZIA });
                  setMostrarForm((v) => !v);
                }}
                disabled={modulos.length === 0}
                type="button"
              >
                {mostrarForm ? "Cancelar" : "+ Nova aula"}
              </button>
            </div>
          </div>
        )}

        {admin && modulos.length === 0 && (
          <div className="aviso" style={{ marginTop: 4 }}>
            <span className="avisoIcone">✦</span>
            <div>
              <strong>Crie um módulo primeiro</strong>
              Toda aula precisa morar dentro de um módulo. Clique em <b>Módulos</b> acima.
            </div>
          </div>
        )}

        {admin && gerenciandoModulos && (
          <div className="panel pad" style={{ marginBottom: 18 }}>
            <h2 className="h-sec" style={{ marginBottom: 16 }}>Módulos da trilha</h2>

            <div className="row" style={{ gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                style={{ flex: 1, minWidth: 220, padding: "12px 14px", borderRadius: 11,
                         background: "rgba(0,0,0,.42)", border: "1px solid var(--line)",
                         color: "var(--txt)", fontFamily: "inherit", fontSize: ".88rem", outline: 0 }}
                value={novoModulo}
                onChange={(e) => setNovoModulo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && criarModulo()}
                placeholder="Nome do módulo. Ex: Módulo 1 · Fundamentos"
              />
              <button className="btn p" onClick={criarModulo} disabled={salvando || !novoModulo.trim()} type="button">
                Criar módulo
              </button>
            </div>

            {avisoModulo && (
              <div className="aviso erro">
                <span className="avisoIcone">!</span>
                <div>{avisoModulo}</div>
              </div>
            )}

            {modulos.length === 0 && (
              <div className="muted tiny">Nenhum módulo ainda. Crie o primeiro no campo acima.</div>
            )}

            {modulos.map((m) => {
              const quantas = aulas.filter((a) => a.modulo_id === m.id).length;
              return (
                <div className="material" key={m.id}>
                  <div className="mi">📚</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{m.nome}</b>
                    <span>{quantas} {quantas === 1 ? "aula" : "aulas"}</span>
                  </div>
                  <button
                    className="btn g"
                    style={{ padding: "6px 11px", fontSize: ".62rem",
                             color: quantas ? "var(--mut2)" : "var(--red)",
                             borderColor: quantas ? "var(--line)" : "rgba(255,15,61,.4)" }}
                    onClick={() => apagarModulo(m)}
                    disabled={salvando}
                    type="button"
                  >
                    EXCLUIR
                  </button>
                </div>
              );
            })}
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
                <select
                  value={form.modulo_id}
                  onChange={(e) => setForm({ ...form, modulo_id: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 11,
                           background: "rgba(0,0,0,.42)", border: "1px solid var(--line)",
                           color: "var(--txt)", fontFamily: "inherit", fontSize: ".88rem", outline: 0 }}
                >
                  <option value="">Escolha o módulo…</option>
                  {modulos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
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
                  placeholder="cole o link ou o código de incorporação"
                />
                <span className="tiny muted" style={{ display: "block", marginTop: 6 }}>
                  Aceita YouTube, Vimeo, Panda, Bunny, arquivo .mp4 ou o &lt;iframe&gt; inteiro copiado de outra plataforma.
                </span>
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
              <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
                {(!form.modulo_id || !form.titulo.trim()) && (
                  <span className="regra">
                    Falta {!form.modulo_id ? "escolher o módulo" : "escrever o título"}.
                  </span>
                )}
                <button
                  className="btn p"
                  onClick={salvarAula}
                  disabled={salvando || !form.modulo_id || !form.titulo.trim()}
                  type="button"
                >
                  {salvando ? "Salvando…" : form.id ? "Salvar alterações" : "Criar aula"}
                </button>
              </div>
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

        {trilha.map(({ modulo, aulas: doModulo }) => {
          const feitas = doModulo.filter((a) => progresso[a.id]?.concluida).length;
          const estado =
            doModulo.length === 0 ? "wait" : feitas === doModulo.length ? "ok" : feitas > 0 ? "wait" : "no";
          const rotulo =
            doModulo.length === 0
              ? "VAZIO"
              : feitas === doModulo.length
              ? "CONCLUÍDO"
              : feitas > 0
              ? "EM ANDAMENTO"
              : "NÃO INICIADO";

          // Modulo vazio so interessa a quem administra.
          if (doModulo.length === 0 && !admin) return null;

          return (
            <div key={modulo.id}>
              <div className="spread" style={{ marginBottom: 14 }}>
                <h2 className="h-sec">{modulo.nome}</h2>
                <span className={`pill ${estado}`}>{rotulo}</span>
              </div>

              {doModulo.length === 0 && (
                <div className="panel pad muted tiny" style={{ marginBottom: 26 }}>
                  Módulo vazio. Use <b>+ Nova aula</b> e escolha “{modulo.nome}”.
                </div>
              )}

              {doModulo.length > 0 && (
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
                            <span className="row" style={{ gap: 6 }}>
                              ♥ {curtidas[a.id] ?? 0}
                              {admin && (
                                <>
                                  <button
                                    className="btn g"
                                    style={{ padding: "4px 8px", fontSize: ".58rem" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editar(a);
                                    }}
                                    type="button"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="btn g"
                                    style={{ padding: "4px 8px", fontSize: ".58rem", color: "var(--red)", borderColor: "rgba(255,15,61,.4)" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      apagarAula(a);
                                    }}
                                    type="button"
                                  >
                                    Excluir
                                  </button>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
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

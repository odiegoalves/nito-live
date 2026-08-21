"use client";

// =============================================================================
// NITO LIVE - Meu Perfil.
// Dados, foto e a vitrine de conquistas. As conquistas sao calculadas a partir
// do que ja existe no banco (XP, nivel, papel) - nao ha tabela separada.
// =============================================================================

import React, { useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Auth, Storage, Perfil, comoErro } from "@/lib/nito-motor";
import { patenteDoNivel, progressoNoNivel, proximaPatente, iniciais, ehVerificado } from "@/lib/nito-gamificacao";
import { SeloVerificado } from "@/components/nito/NitoIcones";

const TABELA_XP = [
  ["Postar um resultado com foto", 150],
  ["Concluir uma aula", 100],
  ["Publicar na comunidade", 50],
  ["Comentar", 15],
  ["Receber uma curtida", 5],
] as const;

function Conteudo({ perfilInicial }: { perfilInicial: Perfil }) {
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial);
  const [nome, setNome] = useState(perfil.nome ?? "");
  const [username, setUsername] = useState(perfil.username ?? "");
  const [bio, setBio] = useState(perfil.bio ?? "");
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [recado, setRecado] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  const patente = patenteDoNivel(perfil.nivel ?? 1);
  const prox = proximaPatente(perfil.nivel ?? 1);
  const prog = progressoNoNivel(perfil.nivel ?? 1, perfil.xp ?? 0);

  const conquistas = [
    { em: "🏆", nome: "Fundador", ganha: perfil.papel === "fundador", falta: "SÓ PARA A EQUIPE" },
    { em: "🌱", nome: "Primeiros passos", ganha: (perfil.xp ?? 0) > 0, falta: "GANHE SEU PRIMEIRO XP" },
    { em: "💬", nome: "Voz ativa", ganha: (perfil.xp ?? 0) >= 500, falta: `${perfil.xp ?? 0} / 500 XP` },
    { em: "⚡", nome: "Nível 5", ganha: (perfil.nivel ?? 1) >= 5, falta: `NÍVEL ${perfil.nivel ?? 1} / 5` },
    { em: "🎯", nome: "Operador", ganha: (perfil.nivel ?? 1) >= 10, falta: `NÍVEL ${perfil.nivel ?? 1} / 10` },
    { em: "👑", nome: "Estrategista", ganha: (perfil.nivel ?? 1) >= 20, falta: `NÍVEL ${perfil.nivel ?? 1} / 20` },
    { em: "🔥", nome: "Mestre da Live", ganha: (perfil.nivel ?? 1) >= 35, falta: `NÍVEL ${perfil.nivel ?? 1} / 35` },
    { em: "💎", nome: "Lenda NITO", ganha: (perfil.nivel ?? 1) >= 50, falta: `NÍVEL ${perfil.nivel ?? 1} / 50` },
  ];
  const ganhas = conquistas.filter((c) => c.ganha).length;

  async function salvar() {
    if (salvando) return;
    setSalvando(true);
    setRecado(null);
    try {
      const atualizado = await Auth.atualizarPerfil({
        nome: nome.trim(),
        username: username.trim(),
        bio: bio.trim(),
      });
      setPerfil(atualizado);
      setRecado({ tipo: "ok", texto: "Perfil salvo." });
    } catch (e) {
      setRecado({
        tipo: "erro",
        texto: comoErro(e, "Não consegui salvar.").message,
      });
    } finally {
      setSalvando(false);
    }
  }

  async function trocarFoto(f: File | null) {
    if (!f || enviandoFoto) return;
    if (!f.type.startsWith("image/")) {
      setRecado({ tipo: "erro", texto: "Escolha uma imagem JPG ou PNG." });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setRecado({ tipo: "erro", texto: "Imagem muito grande. O limite é 5 MB." });
      return;
    }
    setEnviandoFoto(true);
    setRecado(null);
    try {
      const url = await Storage.enviar("avatars", f);
      const atualizado = await Auth.atualizarPerfil({ avatar_url: url });
      setPerfil(atualizado);
      setRecado({ tipo: "ok", texto: "Foto atualizada." });
    } catch (e) {
      setRecado({ tipo: "erro", texto: comoErro(e, "Não consegui enviar a foto.").message });
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <AppShell perfil={perfil} ativa="perfil">
      <div className="view on">
        <div>
          <h1 className="title-xl">
            Meu <em>perfil</em>.
          </h1>
          <p className="sub">É assim que a comunidade te vê.</p>
        </div>

        <div className="panel pad" style={{ margin: "22px 0" }}>
          <div className="perfil-head">
            <input ref={fotoRef} type="file" accept="image/*" hidden onChange={(e) => trocarFoto(e.target.files?.[0] ?? null)} />
            <button className="foto" onClick={() => fotoRef.current?.click()} type="button" title="Alterar foto do perfil"
                    style={perfil.avatar_url ? { backgroundImage: `url(${perfil.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
              {!perfil.avatar_url && <span className="ini">{iniciais(perfil.nome)}</span>}
              <span className="cam">{enviandoFoto ? "⏳" : "📷"}</span>
            </button>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="row" style={{ gap: 9, marginBottom: 5, flexWrap: "wrap" }}>
                <b style={{ font: "900 1.3rem/1 var(--disp)", textTransform: "uppercase" }}>
                  {perfil.nome}
                  {ehVerificado(perfil.papel) && <SeloVerificado tam={17} />}
                </b>
                <span className={`pat-chip ${patente.cor}`}>{patente.nome}</span>
                {perfil.papel === "fundador" && <span className="tagchip">FUNDADOR</span>}
              </div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                @{perfil.username} · MEMBRO DESDE{" "}
                {new Date(perfil.criado_em).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).toUpperCase()}
              </div>
              <p className="muted tiny" style={{ margin: "0 0 12px" }}>
                Toque na foto para trocar — do computador ou da galeria do celular. JPG ou PNG, até 5 MB.
              </p>

              <div className="bar">
                <i style={{ width: `${prog.percentual}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7,
                            font: "700 .64rem/1 var(--mono)", color: "var(--mut)", flexWrap: "wrap", gap: 8 }}>
                <span>NÍVEL {perfil.nivel ?? 1} · {patente.nome.toUpperCase()}</span>
                <span>
                  <b style={{ color: "var(--gold)" }}>{(perfil.xp ?? 0).toLocaleString("pt-BR")}</b> XP
                  {prox ? ` · PRÓXIMA PATENTE: ${prox.nome.toUpperCase()}` : " · PATENTE MÁXIMA"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid2">
          <div className="panel pad">
            <h2 className="h-sec" style={{ marginBottom: 18 }}>Seus dados</h2>

            <div className="campo">
              <label>Nome de exibição</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="campo">
              <label>Nome de usuário</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="campo">
              <label>Biografia</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
                        placeholder="Conte em uma linha o que você vende nas lives." />
            </div>

            {recado && (
              <div className={`aviso ${recado.tipo === "ok" ? "sucesso" : "erro"}`}>
                <span className="avisoIcone">{recado.tipo === "ok" ? "✓" : "!"}</span>
                <div>{recado.texto}</div>
              </div>
            )}

            <button className="btn p" onClick={salvar} disabled={salvando} type="button">
              {salvando ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>

          <div className="stack">
            <div className="panel pad">
              <div className="spread" style={{ marginBottom: 16 }}>
                <h2 className="h-sec">Conquistas</h2>
                <span className="eyebrow">{ganhas} DE {conquistas.length}</span>
              </div>
              <div className="conq">
                {conquistas.map((c) => (
                  <div className={`medalha${c.ganha ? " got" : ""}`} key={c.nome}>
                    <div className="em">{c.em}</div>
                    <b>{c.nome}</b>
                    <span>{c.ganha ? "DESBLOQUEADA" : c.falta}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel pad">
              <h2 className="h-sec" style={{ marginBottom: 14 }}>Como ganhar XP</h2>
              {TABELA_XP.map(([acao, pontos], i) => (
                <div className="spread" key={acao}
                     style={{ padding: "9px 0", borderBottom: i < TABELA_XP.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span className="tiny">{acao}</span>
                  <span className="num" style={{ color: "var(--gold)", fontWeight: 800, fontSize: ".76rem" }}>
                    +{pontos}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function PerfilPage() {
  return <AuthGuard>{(perfil) => <Conteudo perfilInicial={perfil} />}</AuthGuard>;
}

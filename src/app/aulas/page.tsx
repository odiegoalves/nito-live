"use client";

import React, { useState, useEffect, useRef } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/community-beta/Sidebar";
import { Topbar } from "@/components/community-beta/Topbar";
import { CommunityFooter } from "@/components/community-beta/CommunityFooter";
import { Aulas, Aula, AulaProgresso, Perfil } from "@/lib/nito-motor";
import { BookOpen, Lock, PlayCircle, CheckCircle, Clock } from "lucide-react";

export default function AulasPage() {
  return (
    <AuthGuard>
      {(perfil) => <AulasContent perfil={perfil} />}
    </AuthGuard>
  );
}

function AulasContent({ perfil }: { perfil: Perfil }) {
  const [aulasList, setAulasList] = useState<Aula[]>([]);
  const [progressoMap, setProgressoMap] = useState<Record<string, AulaProgresso>>({});
  const [aulaSelecionada, setAulaSelecionada] = useState<Aula | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function carregarDados() {
      setCarregando(true);
      try {
        const [lista, prog] = await Promise.all([
          Aulas.listar(),
          Aulas.meuProgresso().catch(() => ({})),
        ]);

        if (mounted) {
          if (!lista || lista.length === 0) {
            setBloqueado(true);
          } else {
            setAulasList(lista);
            setProgressoMap(prog);
            setAulaSelecionada(lista[0]);
          }
        }
      } catch (err) {
        if (mounted) {
          setBloqueado(true);
        }
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregarDados();

    return () => {
      mounted = false;
    };
  }, []);

  // Timer de progresso do vídeo (a cada 15s)
  useEffect(() => {
    if (!aulaSelecionada || !videoRef.current) return;

    const salvarProgressoAtual = async () => {
      if (!videoRef.current || !aulaSelecionada) return;
      const segundos = Math.floor(videoRef.current.currentTime);
      const duracao = aulaSelecionada.duracao_seg || Math.floor(videoRef.current.duration || 0);
      const concluida = duracao > 0 ? segundos / duracao >= 0.9 : false;

      try {
        await Aulas.salvarProgresso(aulaSelecionada.id, segundos, concluida);
        setProgressoMap((prev) => ({
          ...prev,
          [aulaSelecionada.id]: {
            user_id: perfil.id,
            aula_id: aulaSelecionada.id,
            segundos,
            concluida: prev[aulaSelecionada.id]?.concluida || concluida,
            atualizado_em: new Date().toISOString(),
          },
        }));
      } catch (err) {
        console.error("Erro ao salvar progresso:", err);
      }
    };

    intervalRef.current = setInterval(salvarProgressoAtual, 15000);

    const handlePauseOrEnded = () => {
      salvarProgressoAtual();
    };

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener("pause", handlePauseOrEnded);
      videoEl.addEventListener("ended", handlePauseOrEnded);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoEl) {
        videoEl.removeEventListener("pause", handlePauseOrEnded);
        videoEl.removeEventListener("ended", handlePauseOrEnded);
      }
      salvarProgressoAtual();
    };
  }, [aulaSelecionada, perfil.id]);

  // Agrupar aulas por módulo
  const aulasPorModulo: Record<string, Aula[]> = {};
  aulasList.forEach((aula) => {
    const mod = aula.modulo || "Módulo 1";
    if (!aulasPorModulo[mod]) aulasPorModulo[mod] = [];
    aulasPorModulo[mod].push(aula);
  });

  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/aulas" perfil={perfil} />

      <div style={styles.mainWrapper}>
        <Topbar perfil={perfil} />

        <div style={styles.contentBody}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.headerIconBox}>
                <BookOpen size={22} color="#ef4444" />
              </div>
              <div>
                <h1 style={styles.pageTitle}>Aulas & Treinamentos</h1>
                <p style={styles.pageSubtitle}>
                  Aprenda as melhores estratégias de vendas ao vivo com o Nito Live.
                </p>
              </div>
            </div>
          </div>

          {carregando ? (
            <div style={styles.loadingBox}>Carregando conteúdo de aulas...</div>
          ) : bloqueado ? (
            <div style={styles.lockCard}>
              <div style={styles.lockIconBox}>
                <Lock size={48} color="#ef4444" />
              </div>
              <h2 style={styles.lockTitle}>Assinatura Inativa</h2>
              <p style={styles.lockText}>
                Esta área é exclusiva para alunos e membros com assinatura ativa do Nito Live.
              </p>
            </div>
          ) : (
            <div style={styles.aulasGrid}>
              {/* Coluna Esquerda: Player principal */}
              <div style={styles.playerColumn}>
                {aulaSelecionada && (
                  <div style={styles.playerCard}>
                    <div style={styles.videoWrapper}>
                      {aulaSelecionada.video_url ? (
                        <video
                          ref={videoRef}
                          src={aulaSelecionada.video_url}
                          controls
                          style={styles.videoElement}
                          poster={aulaSelecionada.thumb_url}
                        />
                      ) : (
                        <div style={styles.noVideoBox}>
                          <PlayCircle size={64} color="#ef4444" />
                          <span>Vídeo em processamento</span>
                        </div>
                      )}
                    </div>

                    <div style={styles.playerMeta}>
                      <span style={styles.moduloBadge}>{aulaSelecionada.modulo}</span>
                      <h2 style={styles.aulaTitle}>{aulaSelecionada.titulo}</h2>
                      {aulaSelecionada.descricao && (
                        <p style={styles.aulaDesc}>{aulaSelecionada.descricao}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Lista de Módulos e Aulas */}
              <div style={styles.listColumn}>
                {Object.entries(aulasPorModulo).map(([modNome, aulasArr]) => (
                  <div key={modNome} style={styles.moduloCard}>
                    <h3 style={styles.moduloTitle}>{modNome}</h3>
                    <div style={styles.aulasList}>
                      {aulasArr.map((aula) => {
                        const isSelected = aulaSelecionada?.id === aula.id;
                        const prog = progressoMap[aula.id];
                        const isConcluida = prog?.concluida ?? false;

                        return (
                          <div
                            key={aula.id}
                            onClick={() => setAulaSelecionada(aula)}
                            style={{
                              ...styles.aulaItem,
                              ...(isSelected ? styles.aulaItemActive : {}),
                            }}
                          >
                            <div style={styles.aulaItemIcon}>
                              {isConcluida ? (
                                <CheckCircle size={18} color="#10b981" />
                              ) : (
                                <PlayCircle
                                  size={18}
                                  color={isSelected ? "#ef4444" : "#94a3b8"}
                                />
                              )}
                            </div>
                            <div style={styles.aulaItemText}>
                              <span style={styles.aulaItemTitle}>{aula.titulo}</span>
                              {aula.duracao_seg && (
                                <span style={styles.aulaItemDuracao}>
                                  <Clock size={11} style={{ marginRight: 4 }} />
                                  {Math.floor(aula.duracao_seg / 60)} min
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CommunityFooter />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#09090b",
    color: "#f8fafc",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflowX: "hidden",
  },
  contentBody: {
    flex: 1,
    padding: "1.75rem 2rem",
    display: "flex",
    flexDirection: "column",
    maxWidth: "1340px",
    width: "100%",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  headerIconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#ffffff",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: 0,
  },
  loadingBox: {
    padding: "3rem",
    textAlign: "center",
    color: "#94a3b8",
    backgroundColor: "#121215",
    borderRadius: "16px",
  },
  lockCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "20px",
    padding: "4rem 2rem",
    textAlign: "center",
    maxWidth: "500px",
    margin: "2rem auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  lockIconBox: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lockTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
  },
  lockText: {
    fontSize: "0.9rem",
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.5,
  },
  aulasGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "1.75rem",
    marginBottom: "2rem",
  },
  playerColumn: {
    minWidth: 0,
  },
  playerCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    overflow: "hidden",
  },
  videoWrapper: {
    width: "100%",
    aspectRatio: "16 / 9",
    backgroundColor: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  videoElement: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  noVideoBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    color: "#94a3b8",
  },
  playerMeta: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  moduloBadge: {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: "0.2rem 0.6rem",
    borderRadius: "6px",
    alignSelf: "flex-start",
  },
  aulaTitle: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
  },
  aulaDesc: {
    fontSize: "0.9rem",
    color: "#cbd5e1",
    lineHeight: 1.5,
    margin: 0,
  },
  listColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  moduloCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  moduloTitle: {
    fontSize: "0.9rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
    paddingBottom: "0.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  aulasList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  aulaItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.6rem 0.75rem",
    borderRadius: "10px",
    cursor: "pointer",
    backgroundColor: "#09090b",
    border: "1px solid transparent",
    transition: "all 0.2s",
  },
  aulaItemActive: {
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  aulaItemIcon: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },
  aulaItemText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
  },
  aulaItemTitle: {
    fontSize: "0.825rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  aulaItemDuracao: {
    fontSize: "0.7rem",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
  },
};

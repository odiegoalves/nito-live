"use client";

import React, { useState, useEffect } from "react";
import { Vendas, Venda, Fmt } from "@/lib/nito-motor";

export function SalesChartCard() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function carregarVendasGrafico() {
      setCarregando(true);
      try {
        const lista = await Vendas.listar({ limite: 500 }).catch(() => []);
        if (mounted) {
          setVendas(lista);
        }
      } catch (err) {
        console.error("Erro ao carregar vendas do gráfico:", err);
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregarVendasGrafico();

    const unsub = Vendas.assinar((novaVenda) => {
      if (!mounted || !novaVenda) return;
      setVendas((prev) => [novaVenda, ...prev.filter((v) => v.id !== novaVenda.id)]);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Agregar por dia nos últimos 14 dias
  const diasMap: Record<string, number> = {};
  const hoje = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(hoje.getTime() - i * 864e5);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    diasMap[key] = 0;
  }

  vendas.forEach((v) => {
    if (v.status === "aprovado") {
      const key = new Date(v.ocorrido_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      if (diasMap[key] !== undefined) {
        diasMap[key] += v.valor_centavos;
      }
    }
  });

  const chartData = Object.entries(diasMap).map(([label, centavos]) => ({
    label,
    value: centavos / 100, // em Reais
  }));

  const temVendas = chartData.some((d) => d.value > 0);

  // Cálculo de SVG
  const values = chartData.map((d) => d.value);
  const maxValue = Math.max(...values, 100);
  const minValue = 0;

  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const widthDraw = svgWidth - paddingX * 2;
  const heightDraw = svgHeight - paddingY * 2;

  const points = chartData.map((d, index) => {
    const x = paddingX + (index / (chartData.length - 1 || 1)) * widthDraw;
    const y =
      svgHeight -
      paddingY -
      ((d.value - minValue) / (maxValue - minValue || 1)) * heightDraw;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    svgHeight - paddingY
  } L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div style={styles.card}>
      {/* Top Header */}
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <h2 style={styles.cardTitle}>SUAS VENDAS (14 DIAS)</h2>
          <span style={styles.cardSubtitle}>
            Faturamento diário em tempo real
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={styles.chartContainer}>
        {carregando ? (
          <div style={styles.emptyOverlay}>Carregando gráfico de vendas...</div>
        ) : !temVendas ? (
          <div style={styles.emptyOverlay}>Sem vendas no período. Conecte a extensão NITO LIVE.</div>
        ) : null}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={styles.svg}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgWidth - paddingX}
            y2={paddingY}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={svgHeight / 2}
            x2={svgWidth - paddingX}
            y2={svgHeight / 2}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={svgHeight - paddingY}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY}
            stroke="rgba(255, 255, 255, 0.05)"
          />

          {/* Área preenchida */}
          <path d={areaD} fill="url(#neonGradient)" />

          {/* Linha principal */}
          <path
            d={pathD}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />

          {/* Pontos de destaque */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#ffffff"
                stroke="#ef4444"
                strokeWidth="2"
              />
              <text
                x={pt.x}
                y={svgHeight - 6}
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "1.5rem",
    marginBottom: "1.75rem",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  titleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "0.04em",
    margin: 0,
  },
  cardSubtitle: {
    fontSize: "0.775rem",
    color: "#94a3b8",
  },
  chartContainer: {
    width: "100%",
    height: "220px",
    position: "relative",
  },
  svg: {
    width: "100%",
    height: "100%",
    overflow: "visible",
  },
  emptyOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#94a3b8",
    fontSize: "0.85rem",
    backgroundColor: "rgba(18, 18, 21, 0.85)",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    zIndex: 2,
    textAlign: "center",
  },
};

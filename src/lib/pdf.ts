// Utilitário de geração de PDF usando jsPDF (client-side only)
// Disponível apenas no plano Premium

export async function gerarPDFOrcamento(orcamento: {
  numero: string;
  status: string;
  createdAt: Date | string;
  custoMateriais: number;
  valorMaoDeObra: number;
  valorFinal: number;
  observacoes: string | null;
  cliente: { nome: string; telefone: string | null; email: string | null };
  servicos: { 
    servico: { 
      nome: string; 
      tempoMinutos: number;
      materiais: { qtdUsada: number; material: { nome: string; unidade: string } }[]
    } 
  }[];
  agendamento: { data: string; hora: string } | null;
}, empresa: {
  nome: string;
  nicho: string;
  endereco: string | null;
  cidade: string | null;
  telefone: string | null;
  email: string | null;
  logo: string | null;
}) {
  // Import dinâmico para evitar erro de SSR
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const W = doc.internal.pageSize.getWidth();
  let y = 20;

  // ── Cabeçalho Premium (Roxo VALORA) ─────────────────────────────────────────
  doc.setFillColor(107, 70, 193);
  doc.rect(0, 0, W, 42, "F");

  // Logo da empresa
  if (empresa.logo) {
    try {
      doc.addImage(empresa.logo, "PNG", 14, 8, 24, 24);
    } catch { /* ignore error */ }
  }

  // Nome da empresa
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(empresa.nome || "VALORA", empresa.logo ? 42 : 14, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const infoEmpresa = [
    empresa.telefone,
    empresa.email,
    empresa.cidade
  ].filter(Boolean).join("  |  ");
  if (infoEmpresa) doc.text(infoEmpresa, empresa.logo ? 42 : 14, 29);

  // Número e Data
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(orcamento.numero, W - 14, 22, { align: "right" });
  doc.setFontSize(8);
  doc.text("DATA: " + new Date(orcamento.createdAt).toLocaleDateString("pt-BR"), W - 14, 30, { align: "right" });

  y = 55;

  // ── Dados do Cliente ────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATÁRIO / CLIENTE", 14, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, W - 14, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(orcamento.cliente.nome.toUpperCase(), 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (orcamento.cliente.telefone) {
    doc.text(`WhatsApp: ${orcamento.cliente.telefone}`, 14, y);
    y += 5;
  }
  y += 10;

  // ── Descritivo de Serviços e Materiais ──────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DETALHAMENTO TÉCNICO DOS SERVIÇOS", 14, y);
  y += 4;
  doc.line(14, y, W - 14, y);
  y += 8;

  orcamento.servicos.forEach((sObj, index) => {
    const s = sObj.servico;
    
    // Título do Serviço
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${index + 1}. ${s.nome.toUpperCase()}`, 14, y);
    y += 6;

    // Lista de materiais usados nesse serviço
    if (s.materiais && s.materiais.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const listaMatais = "Insumos aplicados: " + s.materiais.map(m => `${m.material.nome} (${m.qtdUsada}${m.material.unidade})`).join(", ");
      const linhas = doc.splitTextToSize(listaMatais, W - 28);
      doc.text(linhas, 18, y);
      y += (linhas.length * 5) + 3;
    } else {
      y += 2;
    }
    
    doc.setTextColor(30, 41, 59);
    y += 4;

    // Verificação de quebra de página
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  y += 5;

  // ── Resumo Financeiro ───────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, W - 28, 25, "F");
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(107, 70, 193);
  doc.text("VALOR TOTAL DO INVESTIMENTO", 20, y);
  doc.text(fmt(orcamento.valorFinal), W - 20, y, { align: "right" });
  
  y += 15;

  // ── Agendamento ─────────────────────────────────────────────────────────────
  if (orcamento.agendamento) {
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PREVISÃO DE ENTREGA / AGENDAMENTO", 14, y);
    y += 4;
    doc.line(14, y, W - 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${orcamento.agendamento.data.split("-").reverse().join("/")} às ${orcamento.agendamento.hora}`, 14, y);
    y += 12;
  }

  // ── Observações ─────────────────────────────────────────────────────────────
  if (orcamento.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CONDIÇÕES E OBSERVAÇÕES", 14, y);
    y += 4;
    doc.line(14, y, W - 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const obsLinhas = doc.splitTextToSize(orcamento.observacoes, W - 28);
    doc.text(obsLinhas, 14, y);
  }

  // ── Finalização e Download ──────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`VALORA - Inteligência em Precificação Profissional`, W / 2, pageH - 10, { align: "center" });

  try {
    // Método robusto para download de PDF (Blob + Link)
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `Orcamento-${orcamento.numero.replace(/\//g, "-")}.pdf`;
    
    // Adiciona ao corpo, clica e remove (necessário em alguns navegadores)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libera a memória
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    console.error("Erro ao gerar/baixar PDF:", error);
    // Fallback para o método clássico caso o Blob falhe
    doc.save(`Orcamento-${orcamento.numero}.pdf`);
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getEmpresa } from "./empresa";

export async function getOrcamentos() {
  const empresa = await getEmpresa();
  if (!empresa) return [];

  return prisma.orcamento.findMany({
    where: { empresaId: empresa.id },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: {
            include: {
              materiais: { include: { material: true } }
            }
          }
        }
      },
      agendamento: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrcamento(data: {
  clienteId: string;
  servicoIds: string[];
  observacoes?: string;
}) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  const servicosData = await prisma.servico.findMany({
    where: { 
      id: { in: data.servicoIds },
      empresaId: empresa.id 
    },
    include: {
      materiais: { include: { material: true } }
    }
  });

  let custoMateriais = 0;
  let valorMaoDeObra = 0;

  servicosData.forEach(servico => {
    const custoMatServico = servico.materiais.reduce(
      (acc, sm) => acc + sm.material.custoUnitario * sm.qtdUsada,
      0
    );
    custoMateriais += custoMatServico;
    valorMaoDeObra += custoMatServico * (servico.percentualMao / 100);
  });

  const valorFinal = custoMateriais + valorMaoDeObra;
  const count = await prisma.orcamento.count({ where: { empresaId: empresa.id } });
  const numero = `ORC-${(count + 1).toString().padStart(4, "0")}`;

  const orcamento = await prisma.orcamento.create({
    data: {
      numero,
      empresaId: empresa.id,
      clienteId: data.clienteId,
      observacoes: data.observacoes,
      custoMateriais,
      valorMaoDeObra,
      valorFinal,
      status: "Pendente",
      servicos: {
        create: data.servicoIds.map(id => ({
          servicoId: id
        }))
      }
    },
  });

  revalidatePath("/orcamentos");
  return orcamento;
}

export async function updateOrcamento(id: string, data: { observacoes?: string; status?: string }) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.orcamento.update({
    where: { id, empresaId: empresa.id },
    data,
  });
  revalidatePath("/orcamentos");
}

export async function updateStatusOrcamento(id: string, status: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.orcamento.update({
    where: { id, empresaId: empresa.id },
    data: { status },
  });
  revalidatePath("/orcamentos");
  revalidatePath("/agenda");
}

export async function agendarOrcamento(id: string, data: string, hora: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  // Verificar se o orçamento pertence à empresa do usuário logado
  const orc = await prisma.orcamento.findUnique({
    where: { id, empresaId: empresa.id }
  });

  if (!orc) throw new Error("Orçamento não encontrado ou acesso negado");

  await prisma.agendamento.upsert({
    where: { orcamentoId: id },
    update: { data, hora },
    create: { orcamentoId: id, data, hora },
  });

  await prisma.orcamento.update({
    where: { id, empresaId: empresa.id },
    data: { status: "Agendado" },
  });

  revalidatePath("/orcamentos");
  revalidatePath("/agenda");
}

export async function deleteOrcamento(id: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.orcamento.delete({
    where: { id, empresaId: empresa.id },
  });
  revalidatePath("/orcamentos");
}

export async function getAgendamentos() {
  const empresa = await getEmpresa();
  if (!empresa) return [];

  return prisma.agendamento.findMany({
    where: {
      orcamento: { empresaId: empresa.id }
    },
    include: {
      orcamento: {
        include: {
          cliente: true,
          servicos: {
            include: { servico: true }
          }
        },
      },
    },
    orderBy: [{ data: "asc" }, { hora: "asc" }],
  });
}

export async function getFinanceiro(periodo: string) {
  const empresa = await getEmpresa();
  if (!empresa) return { receita: 0, custos: 0, lucro: 0, margem: 0, total: 0, perdas: 0, totalCancelados: 0, itensEntregues: [], itensCancelados: [] };

  const agora = new Date();
  let dataInicio = new Date();

  if (periodo === "semana") dataInicio.setDate(agora.getDate() - 7);
  else if (periodo === "mes") dataInicio.setMonth(agora.getMonth() - 1);
  else if (periodo === "ano") dataInicio.setFullYear(agora.getFullYear() - 1);

  // Buscar orçamentos Entregues E Cancelados com dados do cliente
  const orcamentos = await prisma.orcamento.findMany({
    where: {
      empresaId: empresa.id,
      status: { in: ["Entregue", "Cancelado"] },
      createdAt: { gte: dataInicio },
    },
    include: {
      cliente: { select: { nome: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const entregues = orcamentos.filter(o => o.status === "Entregue");
  const cancelados = orcamentos.filter(o => o.status === "Cancelado");

  const receita = entregues.reduce((acc, o) => acc + o.valorFinal, 0);
  const custos = entregues.reduce((acc, o) => acc + o.custoMateriais, 0);
  const lucro = receita - custos;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;
  
  const perdas = cancelados.reduce((acc, o) => acc + o.valorFinal, 0);

  return {
    receita,
    custos,
    lucro,
    margem,
    total: entregues.length,
    perdas,
    totalCancelados: cancelados.length,
    itensEntregues: entregues.map(o => ({
      id: o.id,
      numero: o.numero,
      cliente: o.cliente.nome,
      valor: o.valorFinal,
      data: o.createdAt
    })),
    itensCancelados: cancelados.map(o => ({
      id: o.id,
      numero: o.numero,
      cliente: o.cliente.nome,
      valor: o.valorFinal,
      data: o.createdAt
    }))
  };
}

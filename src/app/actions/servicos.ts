"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getEmpresa } from "./empresa";

export async function getServicos() {
  const empresa = await getEmpresa();
  if (!empresa) return [];

  return prisma.servico.findMany({
    where: { empresaId: empresa.id },
    include: {
      materiais: {
        include: { material: true },
      },
    },
    orderBy: { nome: "asc" },
  });
}

export async function createServico(data: {
  nome: string;
  nicho?: string;
  tempoMinutos: number;
  percentualMao: number;
  status: string;
  materiais?: { materialId: string; qtdUsada: number }[];
}) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  const servico = await prisma.servico.create({
    data: {
      nome: data.nome,
      nicho: data.nicho,
      tempoMinutos: data.tempoMinutos,
      percentualMao: data.percentualMao,
      status: data.status,
      empresaId: empresa.id,
      // Cria os vínculos de materiais simultaneamente
      materiais: data.materiais ? {
        create: data.materiais.map(m => ({
          materialId: m.materialId,
          qtdUsada: m.qtdUsada
        }))
      } : undefined
    },
  });

  revalidatePath("/servicos");
  return servico;
}

export async function updateServico(
  id: string,
  data: {
    nome: string;
    nicho: string;
    tempoMinutos: number;
    percentualMao: number;
    status: string;
  }
) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.servico.update({
    where: { id, empresaId: empresa.id },
    data,
  });
  revalidatePath("/servicos");
}

export async function deleteServico(id: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.servico.delete({
    where: { id, empresaId: empresa.id },
  });
  revalidatePath("/servicos");
}

export async function vincularMaterial(servicoId: string, materialId: string, qtdUsada: number) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  const [serv, mat] = await Promise.all([
    prisma.servico.findUnique({ where: { id: servicoId, empresaId: empresa.id } }),
    prisma.material.findUnique({ where: { id: materialId, empresaId: empresa.id } }),
  ]);

  if (!serv || !mat) throw new Error("Acesso negado.");

  await prisma.servicoMaterial.create({
    data: { servicoId, materialId, qtdUsada },
  });
  revalidatePath("/servicos");
}

export async function desvincularMaterial(smId: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  const sm = await prisma.servicoMaterial.findUnique({
    where: { id: smId },
    include: { servico: true }
  });

  if (sm?.servico.empresaId !== empresa.id) throw new Error("Não autorizado");

  await prisma.servicoMaterial.delete({
    where: { id: smId },
  });
  revalidatePath("/servicos");
}

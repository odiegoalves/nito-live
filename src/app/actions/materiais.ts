"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getEmpresa } from "./empresa";

export async function getMateriais() {
  const empresa = await getEmpresa();
  if (!empresa) return [];

  return prisma.material.findMany({
    where: { empresaId: empresa.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMaterial(data: {
  nome: string;
  categoria: string;
  unidade: string;
  valorPago: number;
  qtdEstoque: number;
}) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  const custoUnitario = data.valorPago / data.qtdEstoque;

  await prisma.material.create({
    data: {
      ...data,
      empresaId: empresa.id,
      custoUnitario,
    },
  });
  revalidatePath("/materiais");
}

export async function updateMaterial(
  id: string,
  data: {
    nome: string;
    categoria: string;
    unidade: string;
    valorPago: number;
    qtdEstoque: number;
  }
) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  const custoUnitario = data.valorPago / data.qtdEstoque;

  await prisma.material.update({
    where: { id, empresaId: empresa.id },
    data: { ...data, custoUnitario },
  });
  revalidatePath("/materiais");
}

export async function deleteMaterial(id: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.material.delete({
    where: { id, empresaId: empresa.id },
  });
  revalidatePath("/materiais");
}

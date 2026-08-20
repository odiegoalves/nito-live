"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getEmpresa } from "./empresa";

export async function getClientes() {
  const empresa = await getEmpresa();
  if (!empresa) return [];
  
  return prisma.cliente.findMany({
    where: { empresaId: empresa.id },
    include: {
      orcamentos: {
        select: { valorFinal: true }
      }
    },
    orderBy: { nome: "asc" },
  });
}

export async function createCliente(data: { nome: string; email?: string; telefone?: string }) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.cliente.create({
    data: {
      ...data,
      empresaId: empresa.id,
    },
  });
  revalidatePath("/clientes");
}

export async function updateCliente(id: string, data: { nome: string; email?: string; telefone?: string }) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.cliente.update({
    where: { id, empresaId: empresa.id },
    data,
  });
  revalidatePath("/clientes");
}

export async function deleteCliente(id: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Não autorizado");

  await prisma.cliente.delete({
    where: { id, empresaId: empresa.id },
  });
  revalidatePath("/clientes");
}

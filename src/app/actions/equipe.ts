"use server";

import { prisma } from "@/lib/prisma";
import { getEmpresa } from "./empresa";
import { revalidatePath } from "next/cache";

export async function getEquipe() {
  const empresa = await getEmpresa();
  if (!empresa) return [];

  return prisma.user.findMany({
    where: { empresaId: empresa.id },
    orderBy: { createdAt: "asc" }
  });
}

export async function addFuncionario(email: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Empresa não encontrada");

  // Verificar se o plano permite (apenas Premium ou Pro com taxa)
  if (empresa.plano === "free") {
    throw new Error("O plano gratuito não permite adicionar funcionários. Faça upgrade para o Premium.");
  }

  // Verificar quantos funcionários já existem (excluindo o dono)
  const totalFuncionarios = await prisma.user.count({
    where: { 
      empresaId: empresa.id,
      id: { not: empresa.userId } // Exclui o dono
    }
  });

  // Se for premium, os 3 primeiros são grátis. 
  // O usuário disse: "Premium libera acesso pra mais 3 usuários".
  // Se quiser adicionar mais, cobra 10 reais.
  // Por enquanto, vamos apenas permitir a adição e registrar.

  // Verificar se o usuário já existe no sistema
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (existingUser.empresaId) {
      throw new Error("Este usuário já pertence a uma empresa.");
    }
    // Vincula o usuário existente à empresa
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { empresaId: empresa.id }
    });
  } else {
    // Cria um convite/placeholder (o usuário precisará se cadastrar com este e-mail)
    // Nota: Como o ID é UUID e vem do Supabase, vamos criar sem ID e esperar o primeiro login?
    // Melhor: Criar um registro que será capturado no onboarding ou login.
    // Para simplificar, vamos criar o usuário com um ID temporário e depois o login resolve.
    // Mas o login usa o ID do Supabase. 
    // Então, vamos apenas criar o usuário e quando ele logar, o upsert do Onboarding vai encontrar pelo e-mail?
    // O upsert atual usa ID. Vou mudar o onboarding para encontrar por e-mail também.
    
    await prisma.user.create({
      data: {
        email,
        nome: "Funcionário Convidado",
        role: "user",
        empresaId: empresa.id
      }
    });
  }

  revalidatePath("/configuracoes/equipe");
  return { success: true };
}

export async function removeFuncionario(userId: string) {
  const empresa = await getEmpresa();
  if (!empresa) throw new Error("Empresa não encontrada");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.id === empresa.userId) throw new Error("Você não pode remover o dono da empresa.");

  await prisma.user.update({
    where: { id: userId },
    data: { empresaId: null }
  });

  revalidatePath("/configuracoes/equipe");
  return { success: true };
}

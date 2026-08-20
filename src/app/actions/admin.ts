"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

// Função de segurança para verificar se é ADMIN ou MODERADOR
async function checkAdminOrModerator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.role !== "admin" && dbUser?.role !== "moderator") {
    throw new Error("Acesso negado");
  }
  return dbUser;
}

export async function getDashboardStats() {
  await checkAdminOrModerator();

  const [totalUsers, totalOrcamentos, totalEmpresas] = await Promise.all([
    prisma.user.count(),
    prisma.orcamento.count(),
    prisma.empresa.count(),
  ]);

  return { totalUsers, totalOrcamentos, totalEmpresas };
}

export async function getAllUsersAdmin() {
  await checkAdminOrModerator();

  return prisma.user.findMany({
    include: {
      empresa: {
        include: {
          _count: {
            select: {
              clientes: true,
              orcamentos: true,
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createLicenseAdmin(data: {
  email: string;
  nome?: string;
  plano: string;
  chave?: string;
}) {
  await checkAdminOrModerator();

  const emailNorm = data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: { email: emailNorm }
  });

  const chaveFinal = data.chave?.trim().toUpperCase() || `IL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const expiracao = new Date();
  expiracao.setDate(expiracao.getDate() + 365);

  if (existingUser) {
    if (existingUser.empresaId) {
      await prisma.empresa.update({
        where: { id: existingUser.empresaId },
        data: {
          plano: data.plano,
          planoStatus: "active",
          planoExpiresAt: expiracao,
          lastPaymentAt: new Date(),
        }
      });
    } else {
      await prisma.empresa.create({
        data: {
          userId: existingUser.id,
          nome: data.nome || "Empresa " + emailNorm.split("@")[0],
          plano: data.plano,
          planoStatus: "active",
          planoExpiresAt: expiracao,
        }
      });
    }
    revalidatePath("/admin");
    return { ok: true, chave: chaveFinal, isExisting: true };
  }

  const newUser = await prisma.user.create({
    data: {
      email: emailNorm,
      nome: data.nome || emailNorm.split("@")[0],
      role: "user",
      ownedEmpresa: {
        create: {
          nome: data.nome ? `Empresa de ${data.nome}` : "Minha Empresa",
          plano: data.plano,
          planoStatus: "active",
          planoExpiresAt: expiracao,
        }
      }
    },
    include: { empresa: true }
  });

  revalidatePath("/admin");
  return { ok: true, chave: chaveFinal, isExisting: false };
}

export async function updateUserDetails(userId: string, data: {
  role?: string;
  nome?: string;
  empresa?: {
    plano?: string;
    nicho?: string;
    nome?: string;
  }
}) {
  const caller = await checkAdminOrModerator();
  
  if (caller.role !== "admin") {
    if (data.role || data.empresa?.plano) {
      throw new Error("Apenas administradores podem alterar cargos ou planos.");
    }
  }

  const isPlanoAtivacao = data.empresa?.plano === "premium" || data.empresa?.plano === "pro" || data.empresa?.plano === "basic";
  const novaExpiracao = isPlanoAtivacao ? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d;
  })() : undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      nome: data.nome,
      role: data.role,
      empresa: data.empresa ? {
        update: {
          plano: data.empresa.plano,
          nicho: data.empresa.nicho,
          nome: data.empresa.nome,
          ...(isPlanoAtivacao && {
            planoStatus: "active",
            planoExpiresAt: novaExpiracao,
            lastPaymentAt: new Date(),
          }),
        }
      } : undefined
    }
  });

  revalidatePath("/admin");
}

export async function deleteUserAdmin(userId: string) {
  const caller = await checkAdminOrModerator();
  if (caller.role !== "admin") throw new Error("Apenas administradores podem deletar usuários.");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
}

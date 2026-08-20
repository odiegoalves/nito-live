"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function getEmpresa() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        nome: user.user_metadata.full_name || "",
      },
      create: {
        id: user.id,
        email: user.email!,
        nome: user.user_metadata.full_name || "",
        role: "user",
      },
    });

    let empresa = null;

    // 1. Tentar encontrar a empresa onde ele é dono
    empresa = await prisma.empresa.findUnique({
      where: { userId: user.id },
    });

    // 2. Se não for dono, tentar encontrar a empresa vinculada (funcionário)
    if (!empresa && dbUser.empresaId) {
      empresa = await prisma.empresa.findUnique({
        where: { id: dbUser.empresaId },
      });
    }

    // 3. Se ainda não tem empresa (novo dono), criar uma
    if (!empresa) {
      empresa = await prisma.empresa.create({
        data: {
          userId: user.id,
          nome: "Minha Empresa",
          nicho: "",
          plano: "free",
          planoStatus: "active",
        },
      });
      
      // Vincular o dono à empresa recém-criada
      await prisma.user.update({
        where: { id: user.id },
        data: { empresaId: empresa.id }
      });
    } else if (!dbUser.empresaId) {
       // Garantir que o dono também tenha o empresaId preenchido
       await prisma.user.update({
        where: { id: user.id },
        data: { empresaId: empresa.id }
      });
    }

    // --- LÓGICA DE MONITORAMENTO FINANCEIRO ---
    if (empresa.plano !== "free" && empresa.planoExpiresAt) {
      const hoje = new Date();
      const expiracao = new Date(empresa.planoExpiresAt);

      if (hoje > expiracao && empresa.planoStatus !== "expired") {
        empresa = await prisma.empresa.update({
          where: { id: empresa.id },
          data: { planoStatus: "expired" }
        });
      }
    }

    return empresa;
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return null;
  }
}

export async function saveEmpresa(data: {
  nome?: string;
  nicho?: string;
  logo?: string;
  endereco?: string;
  cidade?: string;
  telefone?: string;
  email?: string;
  plano?: string;
  planoStatus?: string;
  planoExpiresAt?: Date;
  metodoPagamento?: string;
}) {
  let success = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "Não autorizado" };

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email || "",
        nome: user.user_metadata?.full_name || "",
      },
      create: {
        id: user.id,
        email: user.email || "",
        nome: user.user_metadata?.full_name || "",
      },
    });

    await prisma.empresa.upsert({
      where: { userId: user.id },
      update: data,
      create: { 
        userId: user.id,
        nome: data.nome || "Minha Empresa",
        plano: data.plano || "free",
        planoStatus: "active",
        ...data, 
      },
    });

    revalidatePath("/");
    revalidatePath("/configuracoes");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("ERRO NO SAVE EMPRESA:", err);
    return { error: err.message || String(err) };
  }
}

// ... (getAllEmpresasAdmin continua igual)

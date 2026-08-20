import { getServicos } from "@/app/actions/servicos";
import { getMateriais } from "@/app/actions/materiais";
import { getEmpresa } from "@/app/actions/empresa";
import { ServicosList } from "./ServicosList";
import { redirect } from "next/navigation";

export default async function ServicosPage() {
  const [servicos, materiais, empresa] = await Promise.all([
    getServicos(),
    getMateriais(),
    getEmpresa(),
  ]);

  if (!empresa) redirect("/onboarding");

  return (
    <ServicosList
      initialServicos={servicos as any}
      materiais={materiais}
      empresa={empresa}
    />
  );
}

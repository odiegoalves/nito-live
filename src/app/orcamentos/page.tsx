import { getOrcamentos } from "@/app/actions/orcamentos";
import { getClientes } from "@/app/actions/clientes";
import { getServicos } from "@/app/actions/servicos";
import { getEmpresa } from "@/app/actions/empresa";
import { OrcamentosList } from "./OrcamentosList";
import { redirect } from "next/navigation";

export default async function OrcamentosPage() {
  const [orcamentos, clientes, servicos, empresa] = await Promise.all([
    getOrcamentos(),
    getClientes(),
    getServicos(),
    getEmpresa(),
  ]);

  if (!empresa) redirect("/onboarding");

  return (
    <OrcamentosList
      initialOrcamentos={orcamentos as any}
      clientes={clientes}
      servicos={servicos as any}
      empresa={empresa}
    />
  );
}

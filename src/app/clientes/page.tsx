import { getClientes } from "@/app/actions/clientes";
import { getEmpresa } from "@/app/actions/empresa";
import { ClientesList } from "./ClientesList";
import { redirect } from "next/navigation";

export default async function ClientesPage() {
  const [data, empresa] = await Promise.all([
    getClientes(),
    getEmpresa()
  ]);

  if (!empresa) redirect("/onboarding");
  
  const clientes = data.map(c => ({
    ...c,
    totalGasto: c.orcamentos.reduce((acc, o) => acc + o.valorFinal, 0)
  }));

  return <ClientesList initialClientes={clientes} />;
}

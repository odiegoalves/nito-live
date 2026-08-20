import { getAgendamentos } from "@/app/actions/orcamentos";
import { getEmpresa } from "@/app/actions/empresa";
import { AgendaList } from "./AgendaList";
import { redirect } from "next/navigation";

export default async function AgendaPage() {
  const [agendamentos, empresa] = await Promise.all([
    getAgendamentos(),
    getEmpresa()
  ]);

  if (!empresa) redirect("/onboarding");

  return <AgendaList initialAgendamentos={agendamentos as any} />;
}

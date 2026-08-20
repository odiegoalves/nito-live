import { getEmpresa } from "@/app/actions/empresa";
import { getEquipe } from "@/app/actions/equipe";
import { EquipeClient } from "./EquipeClient";
import { redirect } from "next/navigation";

export default async function EquipePage() {
  const empresa = await getEmpresa();
  if (!empresa) redirect("/onboarding");
  
  const equipe = await getEquipe();
  
  return <EquipeClient empresa={empresa} initialEquipe={equipe} />;
}

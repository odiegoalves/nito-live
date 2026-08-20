import { getEmpresa } from "@/app/actions/empresa";
import { ConfigForm } from "./ConfigForm";
import { redirect } from "next/navigation";

export default async function ConfiguracoesPage() {
  const empresa = await getEmpresa();
  if (!empresa) redirect("/onboarding");
  
  return <ConfigForm empresa={empresa} />;
}

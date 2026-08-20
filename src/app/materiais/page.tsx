import { getMateriais } from "@/app/actions/materiais";
import { getEmpresa } from "@/app/actions/empresa";
import { MateriaisList } from "./MateriaisList";
import { redirect } from "next/navigation";

export default async function MateriaisPage() {
  const [materiais, empresa] = await Promise.all([
    getMateriais(),
    getEmpresa(),
  ]);

  if (!empresa) redirect("/onboarding");

  return <MateriaisList initialMateriais={materiais} empresa={empresa} />;
}

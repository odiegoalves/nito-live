// A aba virou "Ranking", porque e la que tambem ficam as premiacoes.
// Este arquivo existe so para nao deixar link antigo morto.
import { redirect } from "next/navigation";

export default function IndicacoesAntigo() {
  redirect("/ranking");
}

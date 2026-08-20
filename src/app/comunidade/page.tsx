"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { CommunityPageContent } from "@/components/community-beta/CommunityPageContent";

export default function ComunidadePage() {
  return (
    <AuthGuard>
      {(perfil) => <CommunityPageContent perfil={perfil} />}
    </AuthGuard>
  );
}

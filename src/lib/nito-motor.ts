// =============================================================================
// NITO LIVE — MOTOR DE TEMPO REAL & CAMADA DE DADOS
// toda leitura e escrita passa por aqui.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (typeof window !== "undefined" && (!SUPABASE_URL || !SUPABASE_ANON)) {
  console.error(
    "[NITO] Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Defina no .env.local e tambem no painel da Vercel (Settings > Environment Variables)."
  );
}

// IMPORTANTE: createBrowserClient (@supabase/ssr) grava a sessao em COOKIE.
// O src/middleware.ts le a sessao do cookie. Se aqui fosse createClient
// (@supabase/supabase-js), a sessao ficaria no localStorage, o middleware nao
// enxergaria ninguem logado e TODA rota privada cairia de volta no /login.
export const sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON, {
  realtime: { params: { eventsPerSecond: 20 } },
});

export interface Perfil {
  id: string;
  username: string;
  nome: string;
  avatar_url?: string;
  bio?: string;
  papel: "membro" | "moderador" | "fundador";
  nivel: number;
  xp: number;
  assinatura_ativa: boolean;
  assinatura_expira_em?: string;
  criado_em: string;
}

export type TipoPost =
  | "importante"   // so a administracao publica
  | "resultado"    // foto obrigatoria
  | "insight"
  | "melhoria"
  | "texto"        // legado
  | "print_ganho"
  | "depoimento";

export interface Enquete {
  id: string;
  post_id: string;
  pergunta: string;
  votos_sim: number;
  votos_nao: number;
  meu_voto?: boolean | null;
}

export interface Post {
  id: string;
  autor_id: string;
  titulo?: string;
  conteudo: string;
  imagem_url?: string;
  tipo: TipoPost;
  situacao?: "aberta" | "em_analise" | "aceita" | "recusada";
  enquete?: Enquete | null;
  fixado: boolean;
  curtidas_count: number;
  comentarios_count: number;
  criado_em: string;
  autor?: Partial<Perfil>;
}

export interface Comentario {
  id: string;
  post_id?: string;
  autor_id?: string;
  conteudo: string;
  criado_em: string;
  autor?: Partial<Perfil>;
}

export type PostCategorySlug = "all" | "strategy" | "results" | "help" | "tools" | "texto" | "print_ganho" | "depoimento";

export type PostCategoryLabel =
  | "Todos os tópicos"
  | "Lives & Estratégias"
  | "Resultados Reais"
  | "Dúvidas & Ajuda"
  | "Ferramentas"
  | "Print de Ganho"
  | "Depoimento"
  | "Discussão";

export interface CommentItem {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorLevel: number;
  createdAt: string;
  content: string;
  likesCount: number;
  userLiked?: boolean;
}

export interface PostItem {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorEmail?: string;
  authorLevel: number;
  createdAt: string;
  category: PostCategoryLabel;
  categorySlug: PostCategorySlug;
  title: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  userLiked?: boolean;
  commentsCount: number;
  viewsCount: number;
  comments: CommentItem[];
}

export interface MensagemChat {
  id: string;
  sala?: string;
  autor_id?: string;
  conteudo: string | null;
  midia_url?: string | null;
  midia_tipo?: "imagem" | "video" | null;
  midia_nome?: string | null;
  mencoes?: string[];
  criado_em: string;
  autor?: Partial<Perfil>;
}

export interface Venda {
  id: string;
  user_id: string;
  id_pedido: string;
  origem: string;
  produto?: string;
  valor_centavos: number;
  status: "pendente" | "aprovado" | "cancelado" | "reembolsado";
  ocorrido_em: string;
  criado_em: string;
}

export interface Aula {
  id: string;
  modulo: string;
  // Ordem em que o MODULO aparece na trilha (os dois vieram na migracao 10).
  modulo_ordem?: number;
  // Aula que precisa estar concluida para esta liberar. Ainda nao usado na tela.
  liberada_apos?: string | null;
  ordem: number;
  titulo: string;
  descricao?: string;
  video_url?: string;
  thumb_url?: string;
  duracao_seg?: number;
  publicado: boolean;
  criado_em: string;
}

export interface AulaMaterial {
  id: string;
  aula_id: string;
  titulo: string;
  tipo: "arquivo" | "link";
  url: string;
  tamanho_bytes?: number | null;
  ordem: number;
}

export interface AulaComentario {
  id: string;
  aula_id: string;
  autor_id: string;
  conteudo: string;
  criado_em: string;
  autor?: Partial<Perfil>;
}

export interface AulaProgresso {
  user_id: string;
  aula_id: string;
  segundos: number;
  concluida: boolean;
  atualizado_em: string;
}

// ---------------------------------------------------------------------------
// AUTENTICACAO
// ---------------------------------------------------------------------------
export const Auth = {
  async cadastrar(email: string, senha: string, nome: string) {
    const { data, error } = await sb.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    if (error) throw error;
    return data;
  },

  // Confirma a conta com o codigo de 6 digitos que chegou no e-mail.
  async confirmarCadastro(email: string, codigo: string) {
    const { data, error } = await sb.auth.verifyOtp({
      email,
      token: codigo,
      type: "signup",
    });
    if (error) throw error;
    return data;
  },

  // Reenvia o codigo de confirmacao de cadastro.
  async reenviarCodigo(email: string) {
    const { error } = await sb.auth.resend({ type: "signup", email });
    if (error) throw error;
  },

  // Valida o codigo de recuperacao e ja grava a senha nova.
  async confirmarRecuperacao(email: string, codigo: string, novaSenha: string) {
    const { error: erroCodigo } = await sb.auth.verifyOtp({
      email,
      token: codigo,
      type: "recovery",
    });
    if (erroCodigo) throw erroCodigo;

    const { data, error } = await sb.auth.updateUser({ password: novaSenha });
    if (error) throw error;
    return data;
  },

  async entrar(email: string, senha: string) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    return data;
  },

  async esqueciSenha(email: string) {
    // Envia o codigo de recuperacao (o modelo de e-mail no Supabase usa {{ .Token }}).
    const { data, error } = await sb.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  async sair() {
    await sb.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  async sessao() {
    const { data } = await sb.auth.getSession();
    return data.session;
  },

  async meuPerfil(): Promise<Perfil | null> {
    const s = await this.sessao();
    if (!s) return null;
    const { data, error } = await sb
      .from("perfis")
      .select("*")
      .eq("id", s.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async atualizarPerfil(dados: Partial<Perfil>): Promise<Perfil> {
    const s = await this.sessao();
    if (!s) throw new Error("Não autenticado");
    const { data, error } = await sb
      .from("perfis")
      .update(dados)
      .eq("id", s.user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Chame isso no topo de TODA pagina privada
  async exigirLogin(destino = "/login"): Promise<Perfil | null> {
    const s = await this.sessao();
    if (!s) {
      if (typeof window !== "undefined") {
        window.location.href = destino;
      }
      return null;
    }
    return this.meuPerfil();
  },
};

// ---------------------------------------------------------------------------
// FEED DA COMUNIDADE — posts, curtidas, comentarios
// ---------------------------------------------------------------------------
const SELECT_POST = `
  id, titulo, conteudo, imagem_url, tipo, fixado,
  curtidas_count, comentarios_count, criado_em,
  autor:perfis!posts_autor_id_fkey ( id, nome, username, avatar_url, nivel, papel )
`;

export const Feed = {
  async listar({ tipo = null, limite = 20, antesDe = null }: { tipo?: string | null; limite?: number; antesDe?: string | null } = {}): Promise<Post[]> {
    let q = sb
      .from("posts")
      .select(SELECT_POST)
      .order("fixado", { ascending: false })
      .order("criado_em", { ascending: false })
      .limit(limite);
    if (tipo) q = q.eq("tipo", tipo);
    if (antesDe) q = q.lt("criado_em", antesDe);
    const { data, error } = await q;
    if (error) throw error;
    return (data as unknown as Post[]) || [];
  },

  async criar({
    titulo = null,
    conteudo,
    imagemFile = null,
    tipo = "insight",
  }: {
    titulo?: string | null;
    conteudo: string;
    imagemFile?: File | null;
    tipo?: TipoPost;
  }): Promise<Post> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");

    let imagem_url: string | null = null;
    if (imagemFile) {
      imagem_url = await Storage.enviar("prints", imagemFile);
    }

    const { data, error } = await sb
      .from("posts")
      .insert({ autor_id: user.id, titulo, conteudo, imagem_url, tipo })
      .select(SELECT_POST)
      .single();
    if (error) throw error;
    return data as unknown as Post;
  },

  async apagar(postId: string) {
    const { error } = await sb.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  // Curtir / descurtir. Atualiza a tela na hora (otimista) e o servidor confirma.
  async alternarCurtida(postId: string, jaCurtiu: boolean): Promise<boolean> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    if (jaCurtiu) {
      const { error } = await sb
        .from("curtidas")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      if (error) throw error;
      return false;
    }
    const { error } = await sb.from("curtidas").insert({ post_id: postId, user_id: user.id });
    if (error && error.code !== "23505") throw error; // 23505 = ja curtiu
    return true;
  },

  async minhasCurtidas(postIds: string[]): Promise<Set<string>> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user || !postIds.length) return new Set();
    const { data, error } = await sb
      .from("curtidas")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    if (error) throw error;
    return new Set(data.map((r) => r.post_id));
  },

  async comentarios(postId: string): Promise<Comentario[]> {
    const { data, error } = await sb
      .from("comentarios")
      .select(
        "id, conteudo, criado_em, autor:perfis!comentarios_autor_id_fkey (id, nome, username, avatar_url)"
      )
      .eq("post_id", postId)
      .order("criado_em", { ascending: true });
    if (error) throw error;
    return (data as unknown as Comentario[]) || [];
  },

  async comentar(postId: string, conteudo: string): Promise<Comentario> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    const { data, error } = await sb
      .from("comentarios")
      .insert({ post_id: postId, autor_id: user.id, conteudo })
      .select(
        "id, conteudo, criado_em, autor:perfis!comentarios_autor_id_fkey (id, nome, username, avatar_url)"
      )
      .single();
    if (error) throw error;
    return data as unknown as Comentario;
  },

  // ---- TEMPO REAL ----
  assinar(handlers: {
    onNovoPost?: (post: Post) => void;
    onPostRemovido?: (id: string) => void;
    onContadores?: (post: Partial<Post>) => void;
    onNovoComentario?: (comentario: Comentario) => void;
  } = {}) {
    const canal = sb
      .channel("feed-comunidade")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async ({ new: linha }) => {
          const { data } = await sb
            .from("posts")
            .select(SELECT_POST)
            .eq("id", linha.id)
            .single();
          handlers.onNovoPost?.((data as unknown as Post) ?? (linha as unknown as Post));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        ({ new: linha }) => handlers.onContadores?.(linha as unknown as Partial<Post>)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        ({ old: linha }) => handlers.onPostRemovido?.(linha.id)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comentarios" },
        async ({ new: linha }) => {
          const { data } = await sb
            .from("comentarios")
            .select(
              "id, post_id, conteudo, criado_em, autor:perfis!comentarios_autor_id_fkey (id, nome, username, avatar_url)"
            )
            .eq("id", linha.id)
            .single();
          handlers.onNovoComentario?.(
            (data as unknown as Comentario) ?? (linha as unknown as Comentario)
          );
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(canal);
    };
  },
};

// ---------------------------------------------------------------------------
// CHAT AO VIVO + PRESENCA
// ---------------------------------------------------------------------------
export const Enquetes = {
  // Abre a enquete de uma sugestao recem publicada.
  async abrir(postId: string, pergunta = "A comunidade quer isso?"): Promise<Enquete> {
    const { data, error } = await sb
      .from("enquetes")
      .insert({ post_id: postId, pergunta })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as Enquete;
  },

  // Enquetes de varios posts de uma vez, ja com o voto do usuario atual.
  async doPosts(postIds: string[]): Promise<Record<string, Enquete>> {
    if (!postIds.length) return {};
    const { data, error } = await sb.from("enquetes").select("*").in("post_id", postIds);
    if (error) throw error;

    const mapa: Record<string, Enquete> = {};
    (data ?? []).forEach((e: any) => { mapa[e.post_id] = e as Enquete; });

    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      const ids = (data ?? []).map((e: any) => e.id);
      if (ids.length) {
        const { data: meus } = await sb
          .from("enquete_votos")
          .select("enquete_id, voto")
          .eq("user_id", user.id)
          .in("enquete_id", ids);
        (meus ?? []).forEach((v: any) => {
          const alvo = Object.values(mapa).find((e) => e.id === v.enquete_id);
          if (alvo) alvo.meu_voto = v.voto;
        });
      }
    }
    return mapa;
  },

  // Votar de novo no mesmo lugar troca o voto; nao duplica.
  async votar(enqueteId: string, voto: boolean) {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    const { error } = await sb
      .from("enquete_votos")
      .upsert({ enquete_id: enqueteId, user_id: user.id, voto }, { onConflict: "enquete_id,user_id" });
    if (error) throw error;
  },
};

export const Chat = {
  async historico(sala = "geral", limite = 50): Promise<MensagemChat[]> {
    const { data, error } = await sb
      .from("mensagens_chat")
      .select(
        "id, sala, autor_id, conteudo, criado_em, midia_url, midia_tipo, midia_nome, mencoes, autor:perfis!mensagens_chat_autor_id_fkey (id, nome, username, avatar_url, papel, nivel)"
      )
      .eq("sala", sala)
      .order("criado_em", { ascending: false })
      .limit(limite);
    if (error) throw error;
    return ((data as unknown as MensagemChat[]) || []).reverse();
  },

  async enviar(
    conteudo: string,
    sala = "geral",
    extras: {
      midiaFile?: File | null;
      mencoes?: string[];
    } = {}
  ): Promise<MensagemChat | null> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");

    const texto = (conteudo ?? "").trim();
    let midia_url: string | null = null;
    let midia_tipo: "imagem" | "video" | null = null;
    let midia_nome: string | null = null;

    if (extras.midiaFile) {
      const f = extras.midiaFile;
      midia_url = await Storage.enviar("midias", f);
      midia_tipo = f.type.startsWith("video") ? "video" : "imagem";
      midia_nome = f.name;
    }

    // Mensagem vazia de verdade (sem texto e sem arquivo) nao vai.
    if (!texto && !midia_url) return null;

    const { data, error } = await sb
      .from("mensagens_chat")
      .insert({
        sala,
        autor_id: user.id,
        conteudo: texto || null,
        midia_url,
        midia_tipo,
        midia_nome,
        mencoes: extras.mencoes ?? [],
      })
      .select("id, conteudo, criado_em, midia_url, midia_tipo, midia_nome, mencoes")
      .single();
    if (error) throw error;
    return data as unknown as MensagemChat;
  },


  assinar(
    sala = "geral",
    handlers: {
      onMensagem?: (msg: MensagemChat) => void;
      onOnline?: (qtd: number, membros: any[]) => void;
      onDigitando?: (payload: { nome: string }) => void;
    } = {},
    perfil: Perfil | null = null
  ) {
    const canal = sb.channel(`chat:${sala}`, {
      config: { presence: { key: perfil?.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random())) } },
    });

    canal
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens_chat", filter: `sala=eq.${sala}` },
        async ({ new: linha }) => {
          const { data } = await sb
            .from("mensagens_chat")
            .select(
              "id, sala, autor_id, conteudo, criado_em, midia_url, midia_tipo, midia_nome, mencoes, autor:perfis!mensagens_chat_autor_id_fkey (id, nome, username, avatar_url, papel, nivel)"
            )
            .eq("id", linha.id)
            .single();
          handlers.onMensagem?.((data as unknown as MensagemChat) ?? (linha as unknown as MensagemChat));
        }
      )
      .on("presence", { event: "sync" }, () => {
        // O Supabase guarda uma entrada por CONEXAO, nao por pessoa. A mesma
        // pessoa pode gerar duas entradas (aba recarregada, componente montado
        // duas vezes, reconexao). Sem agrupar por id, ela aparece duplicada
        // na lista e o contador de online fica inflado.
        const estado = canal.presenceState() as Record<string, any[]>;
        const porPessoa = new Map<string, any>();

        Object.values(estado)
          .flat()
          .forEach((m: any) => {
            if (!m) return;
            const chave = m.id ?? m.nome ?? JSON.stringify(m);
            const jaTem = porPessoa.get(chave);
            // Mantem a conexao mais antiga, para o horario de entrada nao
            // ficar pulando a cada recarga de aba.
            if (!jaTem || (m.entrou_em && jaTem.entrou_em && m.entrou_em < jaTem.entrou_em)) {
              porPessoa.set(chave, m);
            }
          });

        const membros = Array.from(porPessoa.values());
        handlers.onOnline?.(membros.length, membros);
      })
      .on("broadcast", { event: "digitando" }, ({ payload }) => handlers.onDigitando?.(payload))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && perfil) {
          await canal.track({
            id: perfil.id,
            nome: perfil.nome,
            avatar_url: perfil.avatar_url,
            entrou_em: new Date().toISOString(),
          });
        }
      });

    return {
      digitando: (nome: string) => canal.send({ type: "broadcast", event: "digitando", payload: { nome } }),
      sair: async () => {
        // untrack ANTES de remover: avisa os outros navegadores que esta
        // pessoa saiu. Sem isso, a presenca antiga fica pendurada e, se a
        // pessoa voltar logo, ela aparece duas vezes na lista de online.
        try {
          await canal.untrack();
        } catch {
          // canal ja pode estar fechado - seguir para a remocao
        }
        sb.removeChannel(canal);
      },
    };
  },
};

// ---------------------------------------------------------------------------
// VENDAS
// ---------------------------------------------------------------------------
export const Vendas = {
  async listar({ limite = 100 }: { limite?: number } = {}): Promise<Venda[]> {
    const { data, error } = await sb
      .from("vendas")
      .select("*")
      .order("ocorrido_em", { ascending: false })
      .limit(limite);
    if (error) throw error;
    return (data as Venda[]) || [];
  },

  async resumo(dias = 30): Promise<{ faturamento_centavos: number; pedidos_aprovados: number; ticket_medio_centavos: number }> {
    const desde = new Date(Date.now() - dias * 864e5).toISOString();
    const { data, error } = await sb.rpc("fn_resumo_vendas", { desde });
    if (error) throw error;
    return data?.[0] ?? { faturamento_centavos: 0, pedidos_aprovados: 0, ticket_medio_centavos: 0 };
  },

  assinar(onVenda: (venda: Venda, eventType: string) => void) {
    let canal: any;
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      canal = sb
        .channel("minhas-vendas")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vendas", filter: `user_id=eq.${user.id}` },
          (p) => onVenda?.((p.new ?? p.old) as Venda, p.eventType)
        )
        .subscribe();
    });
    return () => canal && sb.removeChannel(canal);
  },
};

// ---------------------------------------------------------------------------
// AULAS
// ---------------------------------------------------------------------------
export const Aulas = {
  // incluirRascunhos so tem efeito para quem e staff: a politica do banco
  // esconde aula nao publicada de todo mundo mais.
  async listar(incluirRascunhos = false): Promise<Aula[]> {
    let q = sb.from("aulas").select("*");
    if (!incluirRascunhos) q = q.eq("publicado", true);
    const { data, error } = await q
      .order("modulo_ordem", { ascending: true })
      .order("modulo", { ascending: true })
      .order("ordem", { ascending: true });
    if (error) throw error;
    return (data as Aula[]) || [];
  },

  async meuProgresso(): Promise<Record<string, AulaProgresso>> {
    const { data, error } = await sb.from("aulas_progresso").select("*");
    if (error) throw error;
    return Object.fromEntries(((data as AulaProgresso[]) || []).map((r) => [r.aula_id, r]));
  },

  // ---- materiais ----
  async materiais(aulaIds: string[]): Promise<Record<string, AulaMaterial[]>> {
    if (!aulaIds.length) return {};
    const { data, error } = await sb
      .from("aulas_materiais")
      .select("*")
      .in("aula_id", aulaIds)
      .order("ordem", { ascending: true });
    if (error) throw error;
    const mapa: Record<string, AulaMaterial[]> = {};
    (data ?? []).forEach((m: any) => {
      (mapa[m.aula_id] ||= []).push(m as AulaMaterial);
    });
    return mapa;
  },

  // ---- curtidas ----
  async minhasCurtidas(aulaIds: string[]): Promise<Set<string>> {
    if (!aulaIds.length) return new Set();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return new Set();
    const { data } = await sb
      .from("aulas_curtidas")
      .select("aula_id")
      .eq("user_id", user.id)
      .in("aula_id", aulaIds);
    return new Set((data ?? []).map((c: any) => c.aula_id));
  },

  async alternarCurtida(aulaId: string, jaCurtiu: boolean): Promise<boolean> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    if (jaCurtiu) {
      await sb.from("aulas_curtidas").delete().eq("aula_id", aulaId).eq("user_id", user.id);
      return false;
    }
    await sb.from("aulas_curtidas").insert({ aula_id: aulaId, user_id: user.id });
    return true;
  },

  async contarCurtidas(aulaIds: string[]): Promise<Record<string, number>> {
    if (!aulaIds.length) return {};
    const { data } = await sb.from("aulas_curtidas").select("aula_id").in("aula_id", aulaIds);
    const c: Record<string, number> = {};
    (data ?? []).forEach((l: any) => {
      c[l.aula_id] = (c[l.aula_id] ?? 0) + 1;
    });
    return c;
  },

  // ---- comentarios ----
  async comentarios(aulaId: string): Promise<AulaComentario[]> {
    const { data, error } = await sb
      .from("aulas_comentarios")
      .select(
        "id, aula_id, autor_id, conteudo, criado_em, autor:perfis!aulas_comentarios_autor_id_fkey (id, nome, username, avatar_url, nivel)"
      )
      .eq("aula_id", aulaId)
      .order("criado_em", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as AulaComentario[];
  },

  async comentar(aulaId: string, conteudo: string): Promise<AulaComentario> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    const texto = conteudo.trim();
    if (!texto) throw new Error("Escreva alguma coisa.");
    const { data, error } = await sb
      .from("aulas_comentarios")
      .insert({ aula_id: aulaId, autor_id: user.id, conteudo: texto })
      .select(
        "id, aula_id, autor_id, conteudo, criado_em, autor:perfis!aulas_comentarios_autor_id_fkey (id, nome, username, avatar_url, nivel)"
      )
      .single();
    if (error) throw error;
    return data as unknown as AulaComentario;
  },

  async salvarProgresso(aulaId: string, segundos: number, concluida = false) {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    const { error } = await sb.from("aulas_progresso").upsert({
      user_id: user.id,
      aula_id: aulaId,
      segundos,
      concluida,
      atualizado_em: new Date().toISOString(),
    });
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// STORAGE
// ---------------------------------------------------------------------------
export const AulasAdmin = {
  // A politica do banco ja recusa quem nao e staff. Isto aqui e a comodidade
  // de ter os comandos num lugar so.
  async salvarAula(aula: Partial<Aula> & { titulo: string; modulo: string }): Promise<Aula> {
    const { data, error } = await sb
      .from("aulas")
      .upsert(
        {
          id: aula.id,
          modulo: aula.modulo,
          modulo_ordem: aula.modulo_ordem ?? 1,
          ordem: aula.ordem ?? 1,
          titulo: aula.titulo,
          descricao: aula.descricao ?? null,
          video_url: aula.video_url ?? null,
          thumb_url: aula.thumb_url ?? null,
          duracao_seg: aula.duracao_seg ?? null,
          publicado: aula.publicado ?? false,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as Aula;
  },

  async apagarAula(aulaId: string) {
    const { error } = await sb.from("aulas").delete().eq("id", aulaId);
    if (error) throw error;
  },

  async anexarMaterial(
    aulaId: string,
    material: { titulo: string; tipo: "arquivo" | "link"; url?: string; arquivo?: File | null; ordem?: number }
  ): Promise<AulaMaterial> {
    let url = material.url ?? "";
    let tamanho: number | null = null;

    if (material.tipo === "arquivo" && material.arquivo) {
      url = await Storage.enviar("midias", material.arquivo);
      tamanho = material.arquivo.size;
    }
    if (!url) throw new Error("Informe o link ou escolha um arquivo.");

    const { data, error } = await sb
      .from("aulas_materiais")
      .insert({
        aula_id: aulaId,
        titulo: material.titulo,
        tipo: material.tipo,
        url,
        tamanho_bytes: tamanho,
        ordem: material.ordem ?? 1,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as AulaMaterial;
  },

  async removerMaterial(id: string) {
    const { error } = await sb.from("aulas_materiais").delete().eq("id", id);
    if (error) throw error;
  },
};

export const Storage = {
  async enviar(bucket: "avatars" | "prints" | "midias", file: File): Promise<string> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await sb.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },
};

// ---------------------------------------------------------------------------
// UTILITARIOS
// ---------------------------------------------------------------------------
export const Fmt = {
  brl: (centavos: number) =>
    (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  quando(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (isNaN(s)) return "";
    if (s < 60) return "agora";
    if (s < 3600) return `${Math.floor(s / 60)} min`;
    if (s < 86400) return `${Math.floor(s / 3600)} h`;
    if (s < 604800) return `${Math.floor(s / 86400)} d`;
    return new Date(iso).toLocaleDateString("pt-BR");
  },
};

export const Nito = {
  sb,
  Auth,
  Feed,
  Chat,
  Vendas,
  Aulas,
  Storage,
  Fmt,
  exigirLogin: (d?: string) => Auth.exigirLogin(d),
};

export default Nito;

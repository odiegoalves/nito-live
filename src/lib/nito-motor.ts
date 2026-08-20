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

export interface Post {
  id: string;
  autor_id: string;
  titulo?: string;
  conteudo: string;
  imagem_url?: string;
  tipo: "texto" | "print_ganho" | "depoimento";
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
  conteudo: string;
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
  ordem: number;
  titulo: string;
  descricao?: string;
  video_url?: string;
  thumb_url?: string;
  duracao_seg?: number;
  publicado: boolean;
  criado_em: string;
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

  async entrar(email: string, senha: string) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    return data;
  },

  async esqueciSenha(email: string) {
    const { data, error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    });
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
    tipo = "texto",
  }: {
    titulo?: string | null;
    conteudo: string;
    imagemFile?: File | null;
    tipo?: "texto" | "print_ganho" | "depoimento";
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
export const Chat = {
  async historico(sala = "geral", limite = 50): Promise<MensagemChat[]> {
    const { data, error } = await sb
      .from("mensagens_chat")
      .select(
        "id, conteudo, criado_em, autor:perfis!mensagens_chat_autor_id_fkey (id, nome, username, avatar_url, papel)"
      )
      .eq("sala", sala)
      .order("criado_em", { ascending: false })
      .limit(limite);
    if (error) throw error;
    return ((data as unknown as MensagemChat[]) || []).reverse();
  },

  async enviar(conteudo: string, sala = "geral"): Promise<MensagemChat | null> {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error("Precisa estar logado.");
    const texto = conteudo.trim();
    if (!texto) return null;
    const { data, error } = await sb
      .from("mensagens_chat")
      .insert({ sala, autor_id: user.id, conteudo: texto })
      .select("id, conteudo, criado_em")
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
              "id, conteudo, criado_em, autor:perfis!mensagens_chat_autor_id_fkey (id, nome, username, avatar_url, papel)"
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
      sair: () => {
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
  async listar(): Promise<Aula[]> {
    const { data, error } = await sb
      .from("aulas")
      .select("*")
      .eq("publicado", true)
      .order("modulo")
      .order("ordem");
    if (error) throw error;
    return (data as Aula[]) || [];
  },

  async meuProgresso(): Promise<Record<string, AulaProgresso>> {
    const { data, error } = await sb.from("aulas_progresso").select("*");
    if (error) throw error;
    return Object.fromEntries(((data as AulaProgresso[]) || []).map((r) => [r.aula_id, r]));
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
export const Storage = {
  async enviar(bucket: "avatars" | "prints", file: File): Promise<string> {
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

"use client";

// =============================================================================
// NITO ALERTAS - vendas da live no celular.
//
// Feito para ficar aberto ao lado enquanto a pessoa transmite: fundo escuro,
// numeros grandes, e um aviso a cada venda que a extensao captura.
//
// Como a venda chega ate aqui:
//   extensao -> api.nitolive.com.br -> Supabase -> este aparelho, pelo tempo real
// Nao existe consulta repetida em laco: o banco empurra a venda assim que ela
// e gravada.
//
// Sobre o aviso: som, vibracao e notificacao dependem de um toque do usuario
// antes - o navegador so libera depois disso. Por isso existe o botao "Ativar
// alertas", e por isso ele aparece em destaque ate ser usado.
//
// Limite honesto: com o aplicativo fechado nada e avisado. Aviso com app
// fechado exige push com chaves proprias, que e outro trabalho.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Vendas, Venda, Perfil, Fmt, sb } from "@/lib/nito-motor";

const COR = {
  fundo: "#09090b",
  cartao: "#131318",
  linha: "#26262e",
  texto: "#f4f4f5",
  fraco: "#8b8b96",
  verde: "#34d399",
  ciano: "#38bdf8",
  vermelho: "#ef4444",
};

// Chave publica do push. E publica por natureza - ela so serve para o
// aparelho pedir inscricao; quem assina o aviso e a chave privada, que fica
// somente no servidor. Pode ser trocada por variavel de ambiente sem publicar
// o site de novo.
const VAPID_PUBLICA =
  process.env.NEXT_PUBLIC_VAPID_PUBLICA ||
  "BHrBri1QWdXlcJ5mzHOCEwzU2sGAvlxMTBHH75Kw4Gz6e44HHReLSKhtqO86k9gZcSmoBScPSvV0jwvlnJAPiiY";

/** O navegador exige a chave em bytes, nao no texto base64 da url. */
function chaveParaBytes(base64url: string): Uint8Array {
  const resto = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + resto).replace(/-/g, "+").replace(/_/g, "/");
  const cru = window.atob(base64);
  const bytes = new Uint8Array(cru.length);
  for (let i = 0; i < cru.length; i++) bytes[i] = cru.charCodeAt(i);
  return bytes;
}

/** Descricao curta do aparelho, so para voce reconhecer na lista. */
function nomeDoAparelho(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Navegador";
}

// Marca de que a pessoa ja ativou os alertas neste aparelho. A permissao e a
// inscricao no push duram para sempre; o que nao dura e a liberacao do som,
// que todo navegador exige a cada abertura. Guardando esta marca, o app volta
// ja ativado e libera o som no primeiro toque em qualquer lugar da tela - a
// pessoa nunca percebe que houve um toque necessario.
const MARCA_ATIVADO = "nito_alertas_ativado";

// O WebKit so considera o audio destravado em alguns tipos de toque. Escutar
// os quatro cobre iPhone, Android e computador sem depender de um so.
const EVENTOS_DE_TOQUE = ["touchend", "click", "pointerdown", "keydown"] as const;

function jaAtivouAntes(): boolean {
  try {
    return window.localStorage.getItem(MARCA_ATIVADO) === "1";
  } catch {
    return false;
  }
}

function guardarAtivado() {
  try {
    window.localStorage.setItem(MARCA_ATIVADO, "1");
  } catch {
    /* sem armazenamento: o botao volta a aparecer, e so */
  }
}

/**
 * Toca o som de caixa registradora.
 *
 * O arquivo e reproduzido pelo Web Audio, e nao por um elemento <audio>. Isso
 * nao e capricho: no iPhone, com a chavinha de silencioso ligada, o elemento
 * <audio> fica mudo e o Web Audio continua tocando. Como o app existe para
 * avisar de venda durante a live, ficar mudo por causa de uma chavinha seria
 * falhar justamente na hora que importa.
 *
 * O iPhone tambem so libera audio depois de um toque da pessoa - por isso
 * "liberar" roda dentro do botao Ativar alertas.
 */
function useSino() {
  const ctxRef = useRef<AudioContext | null>(null);
  const bytesRef = useRef<Uint8Array | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const baixandoRef = useRef<Promise<void> | null>(null);
  // "rodando" e a verdade do navegador, nao a nossa suposicao.
  const [rodando, setRodando] = useState(false);

  // ── 1. o arquivo, antes de existir contexto ───────────────────────────────
  // Baixar o mp3 nao precisa de toque nenhum, entao ele ja fica na memoria
  // assim que a tela abre. Quando a pessoa encostar, so falta decodificar -
  // e decodificar leva milissegundos, sem rede no caminho.
  const baixar = useCallback((): Promise<void> => {
    if (bytesRef.current) return Promise.resolve();
    if (baixandoRef.current) return baixandoRef.current;
    baixandoRef.current = (async () => {
      try {
        const resposta = await fetch("/alertas/venda.mp3", { cache: "force-cache" });
        bytesRef.current = new Uint8Array(await resposta.arrayBuffer());
      } catch {
        /* sem som: o aviso visual e a notificacao continuam de pe */
      } finally {
        baixandoRef.current = null;
      }
    })();
    return baixandoRef.current;
  }, []);

  // ── 2. o contexto, sempre nascido DENTRO do toque ─────────────────────────
  // Esta ordem nao e detalhe. No iPhone, um contexto de audio que nasce fora
  // de um toque da pessoa pode nunca mais ser destravado. Por isso ele so e
  // criado aqui, e "liberar" e a unica porta que cria contexto.
  const decodificar = useCallback((ctx: AudioContext) => {
    if (bufferRef.current || !bytesRef.current) return;
    // decodeAudioData esvazia o bloco que recebe, entao vai sempre uma copia.
    const copia = bytesRef.current.slice().buffer;
    try {
      const retorno = ctx.decodeAudioData(
        copia,
        (b: AudioBuffer) => { bufferRef.current = b; },
        () => {}
      ) as unknown as Promise<AudioBuffer> | undefined;
      // Safari antigo devolve pela funcao acima; o resto devolve promessa.
      if (retorno && typeof retorno.then === "function") {
        retorno.then((b) => { bufferRef.current = b; }).catch(() => {});
      }
    } catch {
      /* formato recusado: o alerta visual continua */
    }
  }, []);

  /**
   * Roda DENTRO do toque da pessoa e e sincrona de proposito.
   *
   * Nada de "await" aqui. No iPhone a promessa de resume() as vezes nao se
   * resolve, e quem esperava por ela ficava parado para sempre - foi o que
   * deixava o aviso "toque na tela" preso mesmo depois do toque.
   *
   * O quadro mudo de 1 amostra e o jeito que o WebKit aceita para considerar
   * o audio destravado.
   */
  const liberar = useCallback(() => {
    let ctx = ctxRef.current;
    if (!ctx) {
      try {
        const C =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!C) return;
        ctx = new C();
        ctx.onstatechange = () => setRodando(ctxRef.current?.state === "running");
        ctxRef.current = ctx;
      } catch {
        return;
      }
    }
    try {
      const p = ctx.resume() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* alguns navegadores nem tem resume */
    }
    try {
      const mudo = ctx.createBufferSource();
      mudo.buffer = ctx.createBuffer(1, 1, 22050);
      mudo.connect(ctx.destination);
      mudo.start(0);
    } catch {
      /* destravar e uma tentativa, nunca um bloqueio */
    }
    setRodando(ctx.state === "running");
    if (bytesRef.current) decodificar(ctx);
    else baixar().then(() => { if (ctxRef.current) decodificar(ctxRef.current); });
  }, [baixar, decodificar]);

  const tocar = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (!bufferRef.current) {
      // Chegou venda antes de decodificar: decodifica agora e toca em seguida.
      decodificar(ctx);
      window.setTimeout(() => { if (bufferRef.current) disparar(ctx, bufferRef.current); }, 250);
      return;
    }
    disparar(ctx, bufferRef.current);
  }, [decodificar]);

  // ── 3. voltar do segundo plano ────────────────────────────────────────────
  // O iPhone interrompe o audio quando o app sai da frente. Ao voltar, o
  // contexto precisa ser retomado, senao a proxima venda chega muda.
  useEffect(() => {
    const aoVoltar = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (document.visibilityState === "visible" && ctx.state !== "running") {
        try {
          const p = ctx.resume() as unknown as Promise<void> | undefined;
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {
          /* so tenta */
        }
      }
      setRodando(ctx.state === "running");
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, []);

  // Deixa o arquivo na memoria assim que a tela abre.
  useEffect(() => {
    baixar();
  }, [baixar]);

  // Consulta direta ao navegador, sem passar por estado de React: quem chama
  // precisa da verdade do instante, nao da verdade do ultimo desenho da tela.
  const estaRodando = useCallback(() => ctxRef.current?.state === "running", []);

  return { liberar, tocar, rodando, estaRodando };
}

/** Toca o quadro ja decodificado. Som e extra: nunca derruba o alerta visual. */
function disparar(ctx: AudioContext, buffer: AudioBuffer) {
  try {
    if (ctx.state === "suspended") {
      const p = ctx.resume() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    const fonte = ctx.createBufferSource();
    const vol = ctx.createGain();
    vol.gain.value = 1;
    fonte.buffer = buffer;
    fonte.connect(vol).connect(ctx.destination);
    fonte.start(0);
  } catch {
    /* som e um extra */
  }
}

// Mesmo filtro de período de /vendas e /início, pro operador conseguir olhar
// "quanto vendi essa semana" sem sair do app de alertas.
const PERIODOS = [
  { chave: "dia", rotulo: "Dia", dias: 1 },
  { chave: "semana", rotulo: "Semana", dias: 7 },
  { chave: "mes", rotulo: "Mês", dias: 30 },
  { chave: "ano", rotulo: "Ano", dias: 365 },
] as const;

type ChavePeriodo = (typeof PERIODOS)[number]["chave"];

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [periodo, setPeriodo] = useState<ChavePeriodo>("dia");
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [ligado, setLigado] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [permissao, setPermissao] = useState<string>("default");
  const [piscar, setPiscar] = useState(false);
  const [instalavel, setInstalavel] = useState<Event | null>(null);
  // No iPhone o aviso na tela so existe para app adicionado a Tela de Inicio.
  // Dentro do Safari comum a Apple nao libera, entao o cliente precisa saber
  // disso - senao ele acha que o alerta esta quebrado.
  const [precisaInstalarNoIphone, setPrecisaInstalarNoIphone] = useState(false);
  // "inscrito" = o servidor consegue avisar mesmo com o app fechado.
  const [inscrito, setInscrito] = useState(false);
  const [avisoPush, setAvisoPush] = useState<string | null>(null);
  const [somLiberado, setSomLiberado] = useState(false);
  const vistos = useRef<Set<string>>(new Set());
  // IDs de venda que já dispararam som/notificação. Separado de "vistos"
  // porque "vistos" só controla o que já entrou na LISTA da tela — e uma
  // venda pode entrar na lista via evento UPDATE (por exemplo, se o registro
  // nasce "pendente" e é confirmado depois) sem nunca ter avisado ninguém.
  const avisados = useRef<Set<string>>(new Set());
  // Espelhos do estado. A escuta de vendas e montada uma vez so; sem eles ela
  // guardaria uma fotografia do estado de quando foi montada e decidiria com
  // base nela - foi o que fazia a pagina avisar junto com o servidor.
  const ligadoRef = useRef(false);
  const inscritoRef = useRef(false);
  const { liberar, tocar, rodando, estaRodando } = useSino();

  // Aviso de som, em vermelho e em destaque.
  //
  // Todo navegador exige um toque por abertura para liberar audio - nao ha como
  // fugir disso. Em vez de esconder a exigencia, a tela diz o que fazer, bem
  // visivel, e some sozinha no primeiro toque.
  //
  // "perdeuSom" e o caso mais grave: uma venda REAL ja chegou muda. Ai o texto
  // muda para dizer isso, porque deixou de ser aviso e virou prejuizo.
  const [perdeuSom, setPerdeuSom] = useState(false);
  useEffect(() => {
    if (rodando) setPerdeuSom(false);
  }, [rodando]);

  // Espera curta antes de acusar som travado quando ele JA tinha sido liberado:
  // ao voltar do segundo plano o iPhone interrompe o audio por um instante e
  // retoma sozinho - sem essa espera o aviso piscaria a toa.
  const [travouDepois, setTravouDepois] = useState(false);
  useEffect(() => {
    if (!somLiberado || rodando) {
      setTravouDepois(false);
      return;
    }
    const t = window.setTimeout(() => {
      if (document.visibilityState === "visible") setTravouDepois(true);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [somLiberado, rodando]);

  const avisarSom = ligado && (!somLiberado || travouDepois);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);

  // Volta ligado sozinho quando a pessoa ja ativou antes neste aparelho.
  useEffect(() => {
    if (!jaAtivouAntes()) return;
    const permitido = typeof Notification === "undefined" || Notification.permission === "granted";
    if (permitido) setLigado(true);
  }, []);

  useEffect(() => { ligadoRef.current = ligado; }, [ligado]);
  useEffect(() => { inscritoRef.current = inscrito; }, [inscrito]);

  // ---- carga inicial: o que ja vendeu no periodo escolhido ----------------
  const diasPeriodo = PERIODOS.find((p) => p.chave === periodo)!.dias;
  useEffect(() => {
    let vivo = true;
    Vendas.listar({ dias: diasPeriodo, limite: 200 })
      .then((lista) => {
        if (!vivo) return;
        lista.forEach((v) => vistos.current.add(v.id));
        setVendas(lista);
      })
      .catch(() => {
        /* sem historico a tela ainda serve para o que vier agora */
      });
    return () => {
      vivo = false;
    };
  }, [diasPeriodo]);

  // ---- tempo real ---------------------------------------------------------
  useEffect(() => {
    const parar = Vendas.assinar((venda) => {
      setConectado(true);
      if (!venda || !venda.id) return;

      // Atualiza a lista da tela sempre — venda nova entra, venda que já
      // existia (troca de status, por exemplo) atualiza no lugar.
      if (!vistos.current.has(venda.id)) {
        vistos.current.add(venda.id);
        setVendas((atual) => [venda, ...atual].slice(0, 100));
      } else {
        setVendas((atual) => atual.map((v) => (v.id === venda.id ? venda : v)));
      }

      // O aviso (som + notificação) dispara na PRIMEIRA vez que esta venda
      // aparece pra este aparelho — não importa se chegou como INSERT ou
      // UPDATE. Antes só disparava em INSERT: se o registro da venda nasce
      // "pendente" e é confirmado depois (UPDATE), o cliente via a venda na
      // lista mas nunca ouvia o som nem via o popup. Venda cancelada não avisa.
      if (!avisados.current.has(venda.id) && venda.status !== "cancelado") {
        avisados.current.add(venda.id);
        avisar(venda);
      }
    });
    const t = setTimeout(() => setConectado(true), 2500);
    return () => {
      clearTimeout(t);
      parar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avisar = useCallback(
    (venda: Venda) => {
      setPiscar(true);
      setTimeout(() => setPiscar(false), 1400);
      if (!ligadoRef.current) return;
      if (!estaRodando()) setPerdeuSom(true);
      tocar();
      try {
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      } catch {
        /* aparelho sem vibracao */
      }
      // O AVISO NA TELA.
      //
      // Antes a pagina so avisava quando o aparelho NAO estava inscrito no
      // push: estando inscrito, quem avisaria seria o servidor, e mostrar dos
      // dois lados daria aviso dobrado. A divisao so funciona enquanto o push
      // funciona - no dia em que ele falhou, a pagina ficou calada esperando um
      // aviso que nao veio e a venda passou em silencio, no meio de uma live.
      //
      // Agora a pagina sempre avisa, e o aviso dobrado se resolve pela
      // etiqueta: com a MESMA etiqueta que o servidor usa ("nito-venda"), o
      // navegador substitui o aviso em vez de empilhar. Os dois podem falar
      // que so aparece um.
      //
      // E o aviso sai pelo trabalhador de servico, nao por "new Notification":
      // dentro de um app na Tela de Inicio do iPhone o segundo simplesmente
      // nao existe, entao o caminho antigo nunca funcionou no aparelho que
      // mais importa aqui.
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          const valor = venda.valor_centavos ? Fmt.brl(venda.valor_centavos) : "venda registrada";
          const opcoes = {
            body: `${valor}${venda.produto ? " — " + venda.produto : ""}`,
            icon: "/alertas/icone-192.png",
            badge: "/alertas/icone-192.png",
            tag: "nito-venda",
          };
          if (typeof navigator !== "undefined" && navigator.serviceWorker) {
            navigator.serviceWorker
              .getRegistration()
              .then((reg) => {
                if (reg) return reg.showNotification("Venda na sua live", opcoes);
                new Notification("Venda na sua live", opcoes);
              })
              .catch(() => {
                /* aviso e extra: som e piscar da tela ja avisaram */
              });
          } else {
            new Notification("Venda na sua live", opcoes);
          }
        }
      } catch {
        /* notificacao bloqueada: som e tela ainda avisam */
      }
    },
    [tocar, estaRodando]
  );

  // ---- inscrever o aparelho para receber com o app fechado ----------------
  const inscreverParaPush = useCallback(async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setAvisoPush("Este navegador não recebe aviso com o app fechado.");
        return;
      }
      // Se o responsavel nao assumir, isto avisa em vez de esperar para sempre.
      const registro = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration>((_, rejeitar) =>
          setTimeout(() => rejeitar(new Error("o serviço de avisos não iniciou")), 8000)
        ),
      ]);

      let inscricao = await registro.pushManager.getSubscription();
      if (!inscricao) {
        inscricao = await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: chaveParaBytes(VAPID_PUBLICA) as BufferSource,
        });
      }

      const dados = inscricao.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!dados.endpoint || !dados.keys?.p256dh || !dados.keys?.auth) {
        setAvisoPush("Não consegui registrar este aparelho.");
        return;
      }

      const { data: sessao } = await sb.auth.getUser();
      const usuario = sessao?.user;
      if (!usuario) return;

      // Cada reinstalacao do app gera um endereco de entrega novo. Sem limpar o
      // anterior, o mesmo celular acumula cadastros e a pessoa recebe o mesmo
      // aviso varias vezes. Por isso apagamos os registros anteriores deste
      // mesmo tipo de aparelho antes de gravar o atual.
      //
      // Efeito colateral aceito: quem usar dois iPhones recebe no ultimo que
      // abriu o app. Basta abrir no outro para ele voltar a receber.
      const aparelho = nomeDoAparelho();
      await sb.from("push_inscricoes").delete().eq("user_id", usuario.id).eq("aparelho", aparelho);

      const { error } = await sb.from("push_inscricoes").insert({
        user_id: usuario.id,
        email: (usuario.email || "").toLowerCase(),
        endpoint: dados.endpoint,
        p256dh: dados.keys.p256dh,
        auth: dados.keys.auth,
        aparelho: aparelho,
      });

      if (error) {
        setAvisoPush("Não consegui salvar este aparelho: " + error.message);
        return;
      }
      setInscrito(true);
      setAvisoPush(null);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setAvisoPush("Aviso com o app fechado indisponível neste aparelho. " + m);
    }
  }, []);

  // Ao abrir, descobre se este aparelho ja esta inscrito.
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready
      .then((r) => r.pushManager.getSubscription())
      .then((i) => setInscrito(!!i))
      .catch(() => {
        /* sem suporte: o app segue funcionando com a tela aberta */
      });
  }, []);

  // Primeiro toque em qualquer lugar libera o som e segura a tela acesa.
  // Sem isto a pessoa teria que apertar um botao a cada abertura so por causa
  // da regra de audio dos navegadores.
  //
  // Tudo que a interface depende acontece ANTES de qualquer espera: o aviso
  // "toque na tela" some no mesmo instante do toque, e nunca mais fica preso
  // por causa de uma promessa de audio que o iPhone deixou pendurada.
  useEffect(() => {
    if (!ligado || somLiberado) return;
    let vivo = true;
    const janela = () => {
      EVENTOS_DE_TOQUE.forEach((e) => window.removeEventListener(e, aoTocar));
    };
    const aoTocar = () => {
      if (!vivo) return;
      vivo = false;
      liberar();
      setSomLiberado(true);
      janela();
      segurarTela();
      // Garante que a inscricao no push continua de pe nesta abertura.
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        inscreverParaPush();
      }
    };
    EVENTOS_DE_TOQUE.forEach((e) => window.addEventListener(e, aoTocar));
    return () => { vivo = false; janela(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligado, somLiberado]);

  // Rede de seguranca: se o navegador tiver deixado o audio suspenso mesmo
  // depois do primeiro toque, qualquer toque seguinte tenta de novo. E barato,
  // silencioso, e evita o caso "a tela diz que esta liberado mas nao sai som".
  useEffect(() => {
    if (!ligado) return;
    const tentarDeNovo = () => liberar();
    EVENTOS_DE_TOQUE.forEach((e) => window.addEventListener(e, tentarDeNovo));
    return () => EVENTOS_DE_TOQUE.forEach((e) => window.removeEventListener(e, tentarDeNovo));
  }, [ligado, liberar]);

  // ---- manter a tela acesa durante a live ---------------------------------
  const segurarTela = useCallback(async () => {
    try {
      const n = navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
      if (n.wakeLock) wakeRef.current = await n.wakeLock.request("screen");
    } catch {
      /* alguns aparelhos recusam: a tela apaga normalmente, sem quebrar nada */
    }
  }, []);

  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === "visible" && ligado) segurarTela();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [ligado, segurarTela]);

  // ---- convite de instalacao ----------------------------------------------
  useEffect(() => {
    const aoPoderInstalar = (e: Event) => {
      e.preventDefault();
      setInstalavel(e);
    };
    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    if ("serviceWorker" in navigator) {
      // O arquivo mora na RAIZ de proposito. Um trabalhador de servico so
      // governa a pasta dele para baixo: se estivesse em /alertas/, a propria
      // pagina /alertas ficaria de fora e o registro travaria calado.
      navigator.serviceWorker.register("/nito-alertas-sw.js", { scope: "/alertas" }).catch(() => {
        /* sem trabalhador de servico o app funciona, so nao avisa fechado */
      });
    }
    if (typeof Notification !== "undefined") setPermissao(Notification.permission);

    const ehIphone = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const naTelaDeInicio =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setPrecisaInstalarNoIphone(ehIphone && !naTelaDeInicio);

    return () => window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
  }, []);

  const ativar = useCallback(async () => {
    liberar();
    tocar();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        const p = await Notification.requestPermission();
        setPermissao(p);
      } else if (typeof Notification !== "undefined") {
        setPermissao(Notification.permission);
      }
    } catch {
      /* navegador sem suporte a notificacao */
    }
    segurarTela();
    setSomLiberado(true);
    guardarAtivado();
    setLigado(true);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      inscreverParaPush();
    }
  }, [liberar, tocar, segurarTela, inscreverParaPush]);

  const instalar = useCallback(async () => {
    const evento = instalavel as unknown as { prompt?: () => Promise<void> };
    if (evento && evento.prompt) {
      await evento.prompt();
      setInstalavel(null);
    }
  }, [instalavel]);

  // ---- numeros do periodo escolhido ----------------------------------------
  // Antes era sempre "hoje"; agora segue o filtro de período (dia/semana/mês/ano).
  const doDia = vendas.filter((v) => v.status !== "cancelado");
  const totalDia = doDia.reduce((s, v) => s + (v.valor_centavos || 0), 0);
  const primeiroNome = (perfil.nome || perfil.username || "").trim().split(/\s+/)[0];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: piscar ? "#0d2a1f" : COR.fundo,
        color: COR.texto,
        fontFamily: "system-ui, -apple-system, sans-serif",
        transition: "background .5s ease",
        padding:
          "calc(16px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(28px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left))",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/alertas/icone-192.png" alt="" width={34} height={34} style={{ borderRadius: 9 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>NITO Alertas</div>
            <div style={{ fontSize: 11.5, color: COR.fraco }}>
              {primeiroNome ? primeiroNome + " · " : ""}vendas da sua live
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: conectado ? COR.verde : COR.fraco,
            border: `1px solid ${conectado ? "rgba(52,211,153,.35)" : COR.linha}`,
            background: conectado ? "rgba(52,211,153,.1)" : "transparent",
            padding: "4px 9px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {conectado ? "ao vivo" : "conectando"}
        </span>
      </header>

      {!ligado && (
        <button
          type="button"
          onClick={ativar}
          style={{
            background: COR.verde,
            color: "#052e20",
            border: "none",
            borderRadius: 14,
            padding: "16px 18px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            textAlign: "left",
            lineHeight: 1.3,
          }}
        >
          Ativar alertas
          <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, opacity: 0.8, marginTop: 3 }}>
            Toque uma vez para liberar som, vibração e aviso na tela
          </span>
        </button>
      )}

      {precisaInstalarNoIphone && (
        <div
          style={{
            background: "rgba(56,189,248,.08)",
            border: `1px solid rgba(56,189,248,.3)`,
            borderRadius: 14,
            padding: "14px 15px",
            fontSize: 13,
            lineHeight: 1.55,
            color: COR.texto,
          }}
        >
          <b style={{ color: COR.ciano }}>Instale para receber os avisos</b>
          <div style={{ color: COR.fraco, marginTop: 5 }}>
            No iPhone, o aviso na tela só chega com o app na Tela de Início. Toque no botão de
            compartilhar do Safari <b style={{ color: COR.texto }}>↑</b>, escolha{" "}
            <b style={{ color: COR.texto }}>Adicionar à Tela de Início</b> e abra por lá.
          </div>
          <div style={{ color: COR.fraco, marginTop: 6, fontSize: 12 }}>
            Sem instalar, a tela e o som continuam funcionando — só o aviso por cima de outros
            aplicativos não aparece.
          </div>
        </div>
      )}

      {ligado && permissao === "denied" && (
        <div style={{ fontSize: 12.5, color: COR.fraco, background: COR.cartao, border: `1px solid ${COR.linha}`, borderRadius: 12, padding: "11px 13px" }}>
          As notificações estão bloqueadas nas configurações do navegador. O som e o aviso na tela continuam funcionando.
        </div>
      )}

      {avisarSom && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(239,68,68,.12)",
            border: `1.5px solid ${COR.vermelho}`,
            borderRadius: 14,
            padding: "13px 15px",
            color: COR.vermelho,
            fontSize: 13.5,
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>🔊</span>
          <span>
            {perdeuSom
              ? "Chegou venda com o som travado. Toque na tela para reativar o som."
              : "Toque em qualquer lugar da tela para liberar o som das vendas."}
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 11, background: "rgba(0,0,0,.35)", border: `1px solid ${COR.linha}` }}>
        {PERIODOS.map((p) => (
          <button
            key={p.chave}
            type="button"
            onClick={() => setPeriodo(p.chave)}
            style={{
              flex: 1,
              padding: "8px 6px",
              borderRadius: 8,
              border: 0,
              background: periodo === p.chave ? COR.verde : "transparent",
              color: periodo === p.chave ? "#052e20" : COR.fraco,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: ".02em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: COR.cartao, border: `1px solid ${COR.linha}`, borderRadius: 14, padding: "14px 15px" }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: COR.fraco, fontWeight: 700 }}>
            {PERIODOS.find((p) => p.chave === periodo)!.rotulo}
          </div>
          <div style={{ fontSize: 27, fontWeight: 800, color: COR.verde, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            {Fmt.brl(totalDia)}
          </div>
        </div>
        <div style={{ background: COR.cartao, border: `1px solid ${COR.linha}`, borderRadius: 14, padding: "14px 15px" }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: COR.fraco, fontWeight: 700 }}>Vendas</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{doDia.length}</div>
        </div>
      </div>

      {ligado && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: inscrito ? COR.verde : COR.fraco,
            background: COR.cartao,
            border: `1px solid ${COR.linha}`,
            borderRadius: 12,
            padding: "10px 13px",
            lineHeight: 1.45,
          }}
        >
          <span style={{ fontSize: 14 }}>{inscrito ? "✓" : "•"}</span>
          <span>
            {inscrito
              ? "Avisos chegam mesmo com o app fechado e a tela bloqueada."
              : "Avisos só enquanto esta tela estiver aberta."}
          </span>
        </div>
      )}

      {avisoPush && (
        <div style={{ fontSize: 12, color: COR.fraco, lineHeight: 1.5 }}>{avisoPush}</div>
      )}

      {instalavel && (
        <button
          type="button"
          onClick={instalar}
          style={{
            background: "transparent",
            color: COR.ciano,
            border: `1px solid rgba(56,189,248,.35)`,
            borderRadius: 12,
            padding: "11px 14px",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Instalar na tela de início
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: COR.fraco, fontWeight: 700 }}>
          Últimas vendas
        </div>

        {vendas.length === 0 && (
          <div style={{ background: COR.cartao, border: `1px dashed ${COR.linha}`, borderRadius: 14, padding: "26px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>Nenhuma venda ainda</div>
            <div style={{ fontSize: 12.5, color: COR.fraco, marginTop: 6, lineHeight: 1.5 }}>
              Deixe esta tela aberta durante a live. Cada venda capturada pela extensão aparece aqui na hora.
            </div>
          </div>
        )}

        {vendas.map((v) => (
          <div
            key={v.id}
            style={{
              background: COR.cartao,
              border: `1px solid ${COR.linha}`,
              borderRadius: 13,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              opacity: v.status === "cancelado" || v.status === "reembolsado" ? 0.5 : 1,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {v.produto || "Produto sem nome no feed"}
              </div>
              <div style={{ fontSize: 11.5, color: COR.fraco, marginTop: 2 }}>
                {Fmt.quando(v.ocorrido_em)}
                {v.status !== "aprovado" ? " · " + v.status : ""}
              </div>
            </div>
            <div
              style={{
                fontSize: 15.5,
                fontWeight: 800,
                color: v.valor_centavos ? COR.verde : COR.fraco,
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {v.valor_centavos ? Fmt.brl(v.valor_centavos) : "—"}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: COR.fraco, lineHeight: 1.5, margin: 0, textAlign: "center" }}>
        Deixe o celular ao lado durante a live. No iPhone não há vibração — o Safari não permite. <span style={{ opacity: .55 }}>v13</span>
      </p>
    </div>
  );
}

export default function PaginaAlertas() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}

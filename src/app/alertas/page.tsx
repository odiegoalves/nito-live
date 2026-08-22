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

function hojeInicio() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
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
  const bufferRef = useRef<AudioBuffer | null>(null);
  const baixandoRef = useRef<Promise<void> | null>(null);
  // "rodando" e a verdade do navegador, nao a nossa suposicao. Se ele continuar
  // segurando o som, a tela avisa em vez de ficar muda sem explicacao.
  const [rodando, setRodando] = useState(false);

  // O contexto pode nascer fora de toque: ele so vem "suspenso". Decodificar o
  // mp3 tambem funciona suspenso. Assim, quando a pessoa encostar na tela,
  // sobra apenas destravar - nada de rede, nada de espera.
  const contexto = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current;
    try {
      const C =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (C) {
        const ctx = new C();
        ctx.onstatechange = () => setRodando(ctx.state === "running");
        setRodando(ctx.state === "running");
        ctxRef.current = ctx;
      }
    } catch {
      /* aparelho sem Web Audio: o alerta visual continua */
    }
    return ctxRef.current;
  }, []);

  const preparar = useCallback((): Promise<void> => {
    if (bufferRef.current) return Promise.resolve();
    if (baixandoRef.current) return baixandoRef.current;
    const ctx = contexto();
    if (!ctx) return Promise.resolve();
    baixandoRef.current = (async () => {
      try {
        const resposta = await fetch("/alertas/venda.mp3", { cache: "force-cache" });
        const cru = await resposta.arrayBuffer();
        // Safari antigo so entende decodeAudioData com retorno por funcao.
        // Atender as duas formas evita ficar sem som em iPhone mais velho.
        const buffer = await new Promise<AudioBuffer>((pronto, falhou) => {
          let promessa: unknown;
          try {
            promessa = ctx.decodeAudioData(cru, pronto, falhou);
          } catch (e) {
            falhou(e);
            return;
          }
          const p = promessa as Promise<AudioBuffer> | undefined;
          if (p && typeof p.then === "function") p.then(pronto, falhou);
        });
        bufferRef.current = buffer;
      } catch {
        /* sem som: o aviso visual e a notificacao continuam de pe */
      } finally {
        baixandoRef.current = null;
      }
    })();
    return baixandoRef.current;
  }, [contexto]);

  /**
   * Roda DENTRO do toque da pessoa e e sincrona de proposito.
   *
   * Nada de "await" aqui. No iPhone a promessa de resume() as vezes simplesmente
   * nao se resolve, e quem esperava por ela ficava parado para sempre - foi o
   * que deixava o aviso "toque na tela" preso mesmo depois do toque.
   *
   * O toque mudo (um quadro de som de 1 amostra) e o jeito que o WebKit aceita
   * para considerar o audio destravado.
   */
  const liberar = useCallback(() => {
    const ctx = contexto();
    if (!ctx) return;
    if (ctx.state === "running") {
      preparar();
      return;
    }
    try {
      const p = ctx.resume() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* alguns navegadores nem tem resume: seguem tocando normalmente */
    }
    try {
      const mudo = ctx.createBufferSource();
      mudo.buffer = ctx.createBuffer(1, 1, 22050);
      mudo.connect(ctx.destination);
      mudo.start(0);
    } catch {
      /* destravar e uma tentativa, nunca um bloqueio */
    }
    preparar();
  }, [contexto, preparar]);

  const tocar = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const buffer = bufferRef.current;
    if (!buffer) {
      // Chegou venda antes do arquivo terminar de carregar: carrega agora e
      // toca em seguida, em vez de simplesmente ficar mudo.
      preparar().then(() => {
        const b = bufferRef.current;
        if (!b || !ctxRef.current) return;
        try {
          const f = ctxRef.current.createBufferSource();
          f.buffer = b;
          f.connect(ctxRef.current.destination);
          f.start(0);
        } catch {
          /* som e um extra, nunca pode derrubar o alerta visual */
        }
      });
      return;
    }
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
      /* som e um extra, nunca pode derrubar o alerta visual */
    }
  }, [preparar]);

  // Deixa o arquivo pronto assim que a tela abre.
  useEffect(() => {
    preparar();
  }, [preparar]);

  return { liberar, tocar, preparar, rodando };
}

function Conteudo({ perfil }: { perfil: Perfil }) {
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
  // Espelhos do estado. A escuta de vendas e montada uma vez so; sem eles ela
  // guardaria uma fotografia do estado de quando foi montada e decidiria com
  // base nela - foi o que fazia a pagina avisar junto com o servidor.
  const ligadoRef = useRef(false);
  const inscritoRef = useRef(false);
  const { liberar, tocar, rodando } = useSino();
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);

  // Volta ligado sozinho quando a pessoa ja ativou antes neste aparelho.
  useEffect(() => {
    if (!jaAtivouAntes()) return;
    const permitido = typeof Notification === "undefined" || Notification.permission === "granted";
    if (permitido) setLigado(true);
  }, []);

  useEffect(() => { ligadoRef.current = ligado; }, [ligado]);
  useEffect(() => { inscritoRef.current = inscrito; }, [inscrito]);

  // ---- carga inicial: o que ja vendeu hoje --------------------------------
  useEffect(() => {
    let vivo = true;
    Vendas.listar({ dias: 1, limite: 100 })
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
  }, []);

  // ---- tempo real ---------------------------------------------------------
  useEffect(() => {
    const parar = Vendas.assinar((venda, tipo) => {
      setConectado(true);
      if (!venda || !venda.id) return;
      if (tipo !== "INSERT") {
        setVendas((atual) => atual.map((v) => (v.id === venda.id ? venda : v)));
        return;
      }
      if (vistos.current.has(venda.id)) return;
      vistos.current.add(venda.id);
      setVendas((atual) => [venda, ...atual].slice(0, 100));
      avisar(venda);
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
      tocar();
      try {
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      } catch {
        /* aparelho sem vibracao */
      }
      // Quando este aparelho esta inscrito no push, quem mostra o aviso e o
      // servidor - se a pagina mostrasse tambem, a pessoa receberia dois avisos
      // da mesma venda. Aqui a pagina so avisa quando o push nao existe
      // (computador sem inscricao, navegador sem suporte).
      try {
        if (!inscritoRef.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
          const valor = venda.valor_centavos ? Fmt.brl(venda.valor_centavos) : "venda registrada";
          new Notification("Venda na sua live", {
            body: `${valor}${venda.produto ? " — " + venda.produto : ""}`,
            icon: "/alertas/icone-192.png",
            badge: "/alertas/icone-192.png",
            tag: venda.id,
          });
        }
      } catch {
        /* notificacao bloqueada: som e tela ainda avisam */
      }
    },
    [tocar]
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

  // ---- numeros do dia ------------------------------------------------------
  const inicio = hojeInicio();
  const doDia = vendas.filter((v) => new Date(v.ocorrido_em).getTime() >= inicio && v.status !== "cancelado");
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: COR.cartao, border: `1px solid ${COR.linha}`, borderRadius: 14, padding: "14px 15px" }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: COR.fraco, fontWeight: 700 }}>Hoje</div>
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
            {!somLiberado && (
              <span style={{ display: "block", color: COR.fraco, marginTop: 3 }}>
                Toque em qualquer lugar da tela para liberar o som.
              </span>
            )}
            {somLiberado && !rodando && (
              <span style={{ display: "block", color: COR.vermelho, marginTop: 3 }}>
                O navegador ainda está segurando o som — toque na tela mais uma vez.
              </span>
            )}
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
        Deixe o celular ao lado durante a live. No iPhone não há vibração — o Safari não permite. <span style={{ opacity: .55 }}>v10</span>
      </p>
    </div>
  );
}

export default function PaginaAlertas() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}

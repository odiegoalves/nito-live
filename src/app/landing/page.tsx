"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  ArrowRight, 
  Play, 
  Check, 
  ChevronDown, 
  Shield, 
  Clock, 
  Bot, 
  Tv, 
  MessageSquare, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Laptop,
  Radio,
  Volume2,
  Lock,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import styles from "./landing.module.css";

const FIRST_NAMES = [
  "João", "Pedro", "Lucas", "Matheus", "Gabriel", "Guilherme", "Enzo", "Arthur", "Gustavo", "Felipe",
  "Rafael", "Bruno", "Daniel", "Thiago", "Rodrigo", "Marcos", "André", "Diego", "Leonardo", "Vitor",
  "Eduardo", "Carlos", "Alexandre", "Fernando", "Ricardo", "Marcelo", "Fábio", "Otávio", "Samuel", "Henrique",
  "Murilo", "Douglas", "Igor", "Renan", "Caio", "Vinícius", "Alex", "Alan", "Júlio", "Renato",
  "César", "Augusto", "Luiz", "Francisco", "Antônio", "José", "Hugo", "Leandro", "Adriano", "Alan",
  "Maria", "Ana", "Julia", "Yasmin", "Beatriz", "Laura", "Sofia", "Alice", "Manuela", "Isabela",
  "Gabriela", "Luana", "Mariana", "Larissa", "Camila", "Amanda", "Carolina", "Letícia", "Bruna", "Jessica",
  "Vanessa", "Aline", "Patrícia", "Fernanda", "Juliana", "Bianca", "Clara", "Cecília", "Helena", "Valentina",
  "Lívia", "Giovanna", "Sarah", "Rafaela", "Rebeca", "Nicole", "Melissa", "Lorena", "Isadora", "Daniela",
  "Tatiane", "Priscila", "Renata", "Sabrina", "Monique", "Karina", "Letícia", "Caroline", "Evelyn", "Débora"
];

const LAST_INITIALS = [
  "A***", "B***", "C***", "D***", "E***", "F***", "G***", "H***", "I***", "J***", "L***", "M***",
  "N***", "O***", "P***", "Q***", "R***", "S***", "T***", "U***", "V***", "W***", "X***", "Y***", "Z***"
];

const PLANS = [
  { name: "Plano Starter", price: "R$ 67" },
  { name: "Plano Pro", price: "R$ 97" },
  { name: "Plano Infinity VIP", price: "R$ 147" }
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<number>(0);
  const [activePopup, setActivePopup] = useState<{
    name: string;
    plan: string;
    price: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const triggerPopup = () => {
      const randomFirstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const randomLastInitial = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
      const randomPlan = PLANS[Math.floor(Math.random() * PLANS.length)];
      const times = [
        "há 12 segundos", "há 30 segundos", "há 45 segundos", "há 58 segundos",
        "há 1 minuto", "há 2 minutos", "há 3 minutos", "há 4 minutos", "há 5 minutos"
      ];
      const randomTime = times[Math.floor(Math.random() * times.length)];

      setActivePopup({
        name: `${randomFirstName} ${randomLastInitial}`,
        plan: randomPlan.name,
        price: randomPlan.price,
        time: randomTime
      });

      // Tocar som de caixa registradora (Cha-ching!)
      try {
        const audio = new Audio('/som-caixa.mp3');
        audio.volume = 0.35;
        audio.play().catch(() => {
          // Autoplay bloqueado pelo navegador até o usuário interagir com a tela
        });
      } catch (err) {
        console.error('Erro de reprodução de áudio:', err);
      }

      // Esconder popup após 4.2 segundos
      setTimeout(() => {
        setActivePopup(null);
      }, 4200);

      // Agenda o próximo popup entre 5 e 7 segundos (5000ms a 7000ms) após o popup atual sumir
      const nextDelay = Math.floor(Math.random() * 2000) + 9200; // 4200ms de exibição + (5000ms a 7000ms) de intervalo em silêncio
      timeoutId = setTimeout(triggerPopup, nextDelay);
    };

    // Primeiro popup após 4 segundos
    timeoutId = setTimeout(triggerPopup, 4000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const liveScenarios = [
    { 
      gmv: "R$ 4.290,00", 
      items: "128", 
      viewers: "210", 
      duration: "8s", 
      clicks: "1.490", 
      conversion: "8,59%",
      orders: [
        { product: "1", price: "R$ 149,90" },
        { product: "4", price: "R$ 34,59" }
      ]
    },
    { 
      gmv: "R$ 8.940,00", 
      items: "264", 
      viewers: "380", 
      duration: "11s", 
      clicks: "3.120", 
      conversion: "9,12%",
      orders: [
        { product: "2", price: "R$ 289,00" },
        { product: "4", price: "R$ 34,59" }
      ]
    },
    { 
      gmv: "R$ 12.180,00", 
      items: "392", 
      viewers: "520", 
      duration: "14s", 
      clicks: "4.560", 
      conversion: "10,24%",
      orders: [
        { product: "3", price: "R$ 199,00" },
        { product: "1", price: "R$ 149,90" }
      ]
    },
    { 
      gmv: "R$ 15.650,00", 
      items: "512", 
      viewers: "710", 
      duration: "9s", 
      clicks: "5.980", 
      conversion: "8,97%",
      orders: [
        { product: "2", price: "R$ 289,00" },
        { product: "4", price: "R$ 34,59" }
      ]
    },
    { 
      gmv: "R$ 22.890,00", 
      items: "784", 
      viewers: "980", 
      duration: "17s", 
      clicks: "8.450", 
      conversion: "11,15%",
      orders: [
        { product: "1", price: "R$ 149,90" },
        { product: "3", price: "R$ 199,00" }
      ]
    },
    { 
      gmv: "R$ 28.450,00", 
      items: "926", 
      viewers: "1.150", 
      duration: "12s", 
      clicks: "10.120", 
      conversion: "9,84%",
      orders: [
        { product: "2", price: "R$ 289,00" },
        { product: "2", price: "R$ 289,00" }
      ]
    },
    { 
      gmv: "R$ 34.120,00", 
      items: "1.140", 
      viewers: "840", 
      duration: "15s", 
      clicks: "12.890", 
      conversion: "10,56%",
      orders: [
        { product: "1", price: "R$ 149,90" },
        { product: "4", price: "R$ 34,59" }
      ]
    },
    { 
      gmv: "R$ 41.980,00", 
      items: "1.390", 
      viewers: "1.320", 
      duration: "19s", 
      clicks: "15.420", 
      conversion: "11,82%",
      orders: [
        { product: "3", price: "R$ 199,00" },
        { product: "2", price: "R$ 289,00" }
      ]
    },
    { 
      gmv: "R$ 49.650,00", 
      items: "1.650", 
      viewers: "1.050", 
      duration: "13s", 
      clicks: "18.110", 
      conversion: "10,95%",
      orders: [
        { product: "1", price: "R$ 149,90" },
        { product: "1", price: "R$ 149,90" }
      ]
    },
    { 
      gmv: "R$ 57.890,00", 
      items: "1.920", 
      viewers: "1.480", 
      duration: "20s", 
      clicks: "21.980", 
      conversion: "11,40%",
      orders: [
        { product: "2", price: "R$ 289,00" },
        { product: "4", price: "R$ 34,59" }
      ]
    }
  ];

  useState(() => {
    if (typeof window !== "undefined") {
      const interval = setInterval(() => {
        setActiveScenario((prev) => (prev + 1) % 10);
      }, 3000);
      return () => clearInterval(interval);
    }
  });

  const faqData = [
    {
      q: "O que é o NITO LIVE?",
      a: "O NITO LIVE é uma extensão de alta performance que automatiza transmissões no TikTok Shop. Ele permite rodar vídeos pré-gravados como lives 24/7, simulando o comportamento humano de forma indetectável pelas diretrizes da plataforma."
    },
    {
      q: "Como funciona o sistema de proteção Anti-Ban?",
      a: "Nossa tecnologia exclusiva monitora a integridade da live em tempo real. Se o TikTok emitir um aviso oculto ou houver qualquer risco iminente de suspensão, o NITO LIVE encerra a transmissão de forma instantânea para salvar a sua conta e evitar bloqueios permanentes."
    },
    {
      q: "Quantas contas eu consigo gerenciar?",
      a: "Depende do seu plano. Com o Plano Starter, você recebe 1 chave de licença. Com o Plano Pro, você ganha 2 chaves de acesso. Com o Plano VIP, você tem CHAVES INFINITAS liberadas e suporte prioritário com direito a chamada de vídeo!"
    },
    {
      q: "A voz de IA interage de verdade com o chat?",
      a: "Sim. A nossa IA de engajamento lê as mensagens enviadas no chat em tempo real e responde utilizando vozes humanas naturais de alta fidelidade, estimulando a audiência a interagir e comprar os produtos fixados."
    },
    {
      q: "Os alertas de vendas chegam no celular?",
      a: "Sim! O NITO LIVE se integra ao Telegram para notificar você instantaneamente a cada venda gerada nas suas lives, com relatórios detalhados contendo o valor do produto e o volume de transações."
    }
  ];

  return (
    <div className={styles.container}>
      {/* Navbar Minimalista Premium */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <img src="/nito-logo.png" alt="NITO LIVE" className={styles.logoImg} />
          <div className={styles.logoSloganContainer}>
            <span className={styles.logoSloganLine1}>Automação Infinita.</span>
            <span className={styles.logoSloganLine2}>
              <span className={styles.logoSloganRed}>Lucro </span>
              <span className={styles.logoSloganGold}>Sem Limites.</span>
            </span>
          </div>
        </Link>
        <div className={styles.navActions}>
          <a href="#recursos" className={styles.loginBtn}>Recursos</a>
          <a href="#planos" className={styles.loginBtn}>Planos</a>
          <a href="#faq" className={styles.loginBtn}>Dúvidas</a>
          <a href="#planos" className={styles.ctaBtn}>Começar Agora</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <Zap size={14} fill="currentColor" /> Extensão Oficial para TikTok Shop
        </div>
        <h1 className={styles.title}>
          Automação Infinita.<br />
          <span className={styles.highlight}>Lucro Sem Limites.</span>
        </h1>
        <p className={styles.subtitle}>
          A única extensão profissional para TikTok Shop que transforma vídeos pré-gravados em lives de alta conversão rodando 24/7 com proteção anti-ban absoluta e escala ilimitada.
        </p>
        <div className={styles.heroBtns}>
          <a href="#planos" className={styles.mainCta}>
            Garantir meu acesso e escalar <ArrowRight size={18} />
          </a>
          <button 
            className={styles.secondaryBtn} 
            onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Play size={16} fill="currentColor" /> Ver como funciona
          </button>
        </div>
        <p className={styles.freeNotice}>
          🔒 Pagamento Seguro e Liberação Imediata das Licenças
        </p>

        {/* Mockup do Painel de Transmissão do TikTok Shop (GIF Simulado por Código) */}
        <div className={styles.mockupWrapper}>
          <div className={styles.tiktokPanel}>
            <div className={styles.tiktokPanelHeader}>
              <div className={styles.tiktokPanelTitle}>Análise de transmissões ao vivo</div>
              <a href="#planos" className={styles.tiktokPanelLink}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Painel de LIVE
              </a>
            </div>
            
            <div className={styles.tiktokGrid}>
              <div className={styles.tiktokCard}>
                <div className={styles.tiktokCardLabel}>GMV atribuído</div>
                <div className={styles.tiktokCardValue}>{liveScenarios[activeScenario].gmv}</div>
              </div>
              <div className={styles.tiktokCard}>
                <div className={styles.tiktokCardLabel}>Itens atribuídos vendidos</div>
                <div className={styles.tiktokCardValue}>{liveScenarios[activeScenario].items}</div>
              </div>
              <div className={styles.tiktokCard}>
                <div className={styles.tiktokCardLabel}>Espectadores atuais</div>
                <div className={`${styles.tiktokCardValue} ${styles.tiktokValueGreen}`}>
                  <span className={styles.tiktokLiveDot}></span>
                  {liveScenarios[activeScenario].viewers}
                </div>
              </div>
              <div className={styles.tiktokCard}>
                <div className={styles.tiktokCardLabel}>Duração média de visualização</div>
                <div className={styles.tiktokCardValue}>{liveScenarios[activeScenario].duration}</div>
              </div>
              <div className={styles.tiktokCard}>
                <div className={styles.tiktokCardLabel}>Cliques no produto</div>
                <div className={styles.tiktokCardValue}>{liveScenarios[activeScenario].clicks}</div>
              </div>
              <div className={styles.tiktokCard}>
                <div className={styles.tiktokCardLabel}>Porcentagem de cliques</div>
                <div className={styles.tiktokCardValue}>{liveScenarios[activeScenario].conversion}</div>
              </div>
            </div>

            <div className={styles.tiktokSuggestion}>
              <div className={styles.tiktokSuggestionHeader}>
                <span className={styles.tiktokSuggestionIcon}>✨</span>
                <span className={styles.tiktokSuggestionTitle}>Sugestão</span>
                <svg className={styles.tiktokArrow} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
              </div>
              <div className={styles.tiktokSuggestionBody}>
                Novas ideias aparecem aqui a cada 2 minutos.
              </div>
            </div>

            <div className={styles.tiktokActivity}>
              <div className={styles.tiktokActivityTitle}>Atividade</div>
              <div className={styles.tiktokActivityList}>
                {liveScenarios[activeScenario].orders.map((order, oIdx) => (
                  <div key={oIdx} className={styles.tiktokActivityRow}>
                    <div className={styles.tiktokActivityIcon}></div>
                    <div className={styles.tiktokActivityText}>
                      <span>1 cliente comprou o produto nº {order.product}</span>
                      <span className={styles.tiktokActivityDivider}>|</span>
                      <span className={styles.tiktokActivityPrice}>{order.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos e Funcionalidades (Grid de Abas) */}
      <section id="recursos" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.featuresBadge}>RECURSOS EXCLUSIVOS</div>
          <h2 className={styles.sectionTitle}>Tudo o Que Sua Operação Precisa Para Faturar 24/7</h2>
          <p className={styles.sectionSubtitle}>
            Tecnologia de ponta desenvolvida especificamente para maximizar conversões e proteger suas contas no TikTok Shop.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {/* Card 1: Fixação de Produtos */}
          <div className={`${styles.featureCard} ${styles.featureCardFeatured}`}>
            <span className={styles.featureCardBadge}>MAIS PROCURADO</span>
            <div className={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <h3>Fixação Preditiva & Inteligente</h3>
            <p>
              Troque, reordene e destaque ofertas na vitrine da live na hora exata em que o público aumenta. Maximize suas conversões no pico de engajamento, 100% no piloto automático.
            </p>
          </div>

          {/* Card 2: Lives Infinitas */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Radio size={20} />
            </div>
            <h3>Multiplicação de Lives (Escala)</h3>
            <p>
              Domine o TikTok Shop dominando a audiência. Transmita 24/7 em 10, 15 ou mais contas em paralelo a partir de um único painel e multiplique seus canais de vendas.
            </p>
          </div>

          {/* Card 3: Anti-Ban */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Shield size={20} />
            </div>
            <h3>Blindagem Contra Bloqueios</h3>
            <p>
              Nosso algoritmo monitora silenciosamente os alertas invisíveis da plataforma. Detectou ameaça de ban? A live é pausada em milissegundos para salvar a conta e a sua reputação.
            </p>
          </div>

          {/* Card 4: IA de Engajamento */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Bot size={20} />
            </div>
            <h3>Vendedor Virtual com IA Humana</h3>
            <p>
              Responda a dúvidas, quebre objeções no chat e comente automaticamente utilizando vozes humanas reais de IA que convertem espectadores curiosos em compradores.
            </p>
          </div>

          {/* Card 5: Áudio de Alta Fidelidade */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Volume2 size={20} />
            </div>
            <h3>Mimetização de Áudio Humano</h3>
            <p>
              Esqueça transmissões robóticas sem vida. Nossa tecnologia gera áudios de fundo hiper-realistas (digitação, respiração suave e ruídos de sala), tornando a live 100% humana.
            </p>
          </div>

          {/* Card 6: Moderação Blindada */}
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Lock size={20} />
            </div>
            <h3>Filtro Anti-Furtos de Clientes</h3>
            <p>
              Impeça que outros vendedores roubem seus compradores. Bloqueie termos de concorrentes, exclua spam automaticamente e oculte perguntas estratégicas em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* Seção de Monitoramento e Logs */}
      <section className={styles.monitoringSection}>
        <div className={styles.monitoringContainer}>
          <div className={styles.monitoringText}>
            <div className={styles.monitoringBadge}>GESTÃO & MONITORAMENTO</div>
            <h2 className={styles.monitoringTitle}>Monitore e Controle sua <span className={styles.highlight}>Máquina de Vendas</span></h2>
            <p className={styles.monitoringSubtitle}>
              Controle total da sua operação em um único painel. Acompanhe logs ao vivo das transmissões e receba notificações sonoras personalizadas no seu Telegram a cada pix ou cartão faturado. Sem abrir o app. Sem perder nada.
            </p>
            
            <ul className={styles.monitoringList}>
              <li>
                <div className={styles.monitoringListIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="4 17 10 11 14 15 20 9"></polyline><polyline points="14 9 20 9 20 15"></polyline></svg>
                </div>
                <div>
                  <strong>Logs Avançados em Tempo Real:</strong>
                  Visualize cada etapa do ciclo da live: do início do loop ao encerramento e bloqueio de palavras em milissegundos.
                </div>
              </li>
              <li>
                <div className={styles.monitoringListIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                </div>
                <div>
                  <strong>Notificações Telegram Instantâneas:</strong>
                  Receba sons personalizados direto no celular com o valor de cada venda confirmada no exato momento da transação.
                </div>
              </li>
              <li>
                <div className={styles.monitoringListIcon}>
                  <Bot size={18} />
                </div>
                <div>
                  <strong>Locução Dinâmica com IA de Voz:</strong>
                  Text-to-speech avançado com entonação humana reagindo aos compradores para gerar prova social instantânea na própria live.
                </div>
              </li>
            </ul>
          </div>

          <div className={styles.monitoringConsoleWrapper}>
            <div className={styles.consoleCard}>
              <div className={styles.consoleHeader}>
                <div className={styles.consoleStatusDot}></div>
                <span>Live · @minhaloja</span>
                <div className={styles.consoleLiveBadge}>AO VIVO</div>
              </div>
              <div className={styles.consoleBody}>
                <div className={styles.consoleLine}>
                  <span className={styles.consoleTime}>21:04:12</span>
                  <span className={styles.consoleMsg}>Live Iniciada - vídeo loop carregado</span>
                </div>
                <div className={styles.consoleLine}>
                  <span className={styles.consoleTime}>21:05:48</span>
                  <span className={`${styles.consoleMsg} ${styles.consoleMsgBlue}`}>Comentário IA enviado: "Promo só agora! 🔥"</span>
                </div>
                <div className={styles.consoleLine}>
                  <span className={styles.consoleTime}>21:06:21</span>
                  <span className={`${styles.consoleMsg} ${styles.consoleMsgRed}`}>Perfil @tiktok_shop_xx bloqueado por spam</span>
                </div>
                <div className={styles.consoleLine}>
                  <span className={styles.consoleTime}>21:07:03</span>
                  <span className={`${styles.consoleMsg} ${styles.consoleMsgGreen}`}>VENDA CONFIRMADA · R$ 149,90</span>
                </div>
                <div className={styles.consoleLine}>
                  <span className={styles.consoleTime}>21:08:55</span>
                  <span className={`${styles.consoleMsg} ${styles.consoleMsgPurple}`}>Palavra 'loja' detectada e bloqueada</span>
                </div>
                <div className={styles.consoleLine}>
                  <span className={styles.consoleTime}>21:10:17</span>
                  <span className={styles.consoleMsg}>Notificação Telegram enviada</span>
                </div>
                <div className={styles.consoleLine}>
                  <span className={styles.consoleTime}>21:12:40</span>
                  <span className={`${styles.consoleMsg} ${styles.consoleMsgGreen}`}>VENDA CONFIRMADA · R$ 34,59</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Fixar Produtos (Vitrine Virtual) */}
      <section className={styles.pinSection}>
        <div className={styles.pinContainer}>
          <div className={styles.pinVisualWrapper}>
            <div className={styles.pinCardPanel}>
              <div className={styles.pinCardHeader}>
                <span>Produtos fixados</span>
                <button className={styles.pinCardCloseBtn}>Encerrar live</button>
              </div>
              <div className={styles.pinCardList}>
                <div className={`${styles.pinCardItem} ${styles.pinCardItemActive}`}>
                  <div className={styles.pinCardImgPlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <div className={styles.pinCardInfo}>
                    <span className={styles.pinCardName}>Kit Skincare Premium</span>
                    <span className={styles.pinCardPrice}>R$ 149,90</span>
                  </div>
                  <button className={styles.pinCardBtnActive}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    Fixado
                  </button>
                </div>

                <div className={`${styles.pinCardItem} ${styles.pinCardItemActive}`}>
                  <div className={styles.pinCardImgPlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div className={styles.pinCardInfo}>
                    <span className={styles.pinCardName}>Tênis Runner X3</span>
                    <span className={styles.pinCardPrice}>R$ 289,00</span>
                  </div>
                  <button className={styles.pinCardBtnActive}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    Fixado
                  </button>
                </div>

                <div className={styles.pinCardItem}>
                  <div className={styles.pinCardImgPlaceholder}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                  </div>
                  <div className={styles.pinCardInfo}>
                    <span className={styles.pinCardName}>Fone Bluetooth Pro</span>
                    <span className={styles.pinCardPrice}>R$ 199,90</span>
                  </div>
                  <button className={styles.pinCardBtnInactive}>Fixar</button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.pinText}>
            <div className={styles.pinBadge}>🔥 RECURSO MAIS PROCURADO</div>
            <h2 className={styles.pinTitle}>Destaque a Oferta Certa no Pico de Atenção do Público</h2>
            <p className={styles.pinSubtitle}>
              Gatilhos de vitrine por engajamento: não deixe vendas na mesa. Destaque produtos na tela na hora exata em que o vídeo de demonstração estiver passando ou quando o chat estiver mais ativo, maximizando o ROI da live.
            </p>
            
            <ul className={styles.pinList}>
              <li>
                <span className={styles.pinListBullet}>⚡</span>
                <div>
                  <strong>Fixação e Rotação Automatizada:</strong>
                  Troque a vitrine da live na hora exata em 1 clique, sem precisar abrir a plataforma do TikTok Shop no celular.
                </div>
              </li>
              <li>
                <span className={styles.pinListBullet}>⚡</span>
                <div>
                  <strong>Reordenação por Engajamento:</strong>
                  Coloque as ofertas mais vendidas e atrativas no topo da lista dinamicamente conforme a demanda do chat.
                </div>
              </li>
              <li>
                <span className={styles.pinListBullet}>⚡</span>
                <div>
                  <strong>Programação e Encerramento Programado:</strong>
                  Defina horários exatos para cada produto subir de destaque automaticamente ou encerre a sessão sem complicações.
                </div>
              </li>
              <li>
                <span className={styles.pinListBullet}>⚡</span>
                <div>
                  <strong>Histórico Completo da Sessão:</strong>
                  Estude quais ofertas geraram mais cliques e vendas para replicar a receita exata nas próximas transmissões.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Planos e Preços */}
      <section id="planos" className={styles.pricingSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Escolha o Plano Ideal para a Sua Operação</h2>
          <p className={styles.sectionSubtitle} style={{ marginTop: '8px', color: 'var(--gold)', fontWeight: 700 }}>
            🎥 LIVECAM INFINITY INCLUSO EM TODOS OS PLANOS!
          </p>
        </div>
        <div className={styles.pricingGrid}>
          {/* Plano 1: R$ 67/mês (Plano Starter) */}
          <div className={`${styles.pricingCard} ${styles.pricingCardWhite}`}>
            <div className={styles.pricingHeader}>
              <h3>Plano Starter</h3>
              <p className={styles.pricingDesc}>Ideal para quem está começando e quer automatizar a primeira conta no TikTok Shop.</p>
            </div>
            <div className={styles.pricingPrice}>
              <span className={styles.priceCurrency}>R$</span>
              <span className={styles.priceValue}>67</span>
              <span className={styles.pricePeriod}>/mês</span>
            </div>
            <ul className={styles.pricingFeatures}>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🔑</span> <strong style={{ color: '#ffd000' }}>1 Chave de Licença</strong></li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🎥</span> LiveCam Infinity Incluso (HD 1080p)</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>⚡</span> Automação Completa TikTok Shop</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🔄</span> Looping & Retomada Automática F5</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🎙️</span> VB-Audio CABLE Suite & FX</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>💬</span> Suporte via WhatsApp</li>
            </ul>
            <a href="https://pay.cakto.com.br/xd4yj7y" target="_blank" rel="noopener noreferrer" className={`${styles.pricingBtn} ${styles.pricingBtnGold}`}>
              Assinar por R$ 67/mês
            </a>
          </div>

          {/* Plano 2: R$ 97/mês (Plano Pro) */}
          <div className={`${styles.pricingCard} ${styles.pricingCardWhite}`}>
            <div className={styles.pricingHeader}>
              <h3>Plano Pro</h3>
              <p className={styles.pricingDesc}>Perfeito para quem opera 2 contas em simultâneo com alta produtividade.</p>
            </div>
            <div className={styles.pricingPrice}>
              <span className={styles.priceCurrency}>R$</span>
              <span className={styles.priceValue}>97</span>
              <span className={styles.pricePeriod}>/mês</span>
            </div>
            <ul className={styles.pricingFeatures}>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🔑</span> <strong style={{ color: '#ffd000' }}>2 Chaves de Licença</strong></li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🎥</span> LiveCam Infinity Incluso (HD 1080p)</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>⚡</span> Automação Completa TikTok Shop</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🔄</span> Looping & Retomada Automática F5</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🎙️</span> VB-Audio CABLE Suite & FX</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>💬</span> Suporte via WhatsApp</li>
            </ul>
            <a href="https://pay.cakto.com.br/3477jz3_976117" target="_blank" rel="noopener noreferrer" className={`${styles.pricingBtn} ${styles.pricingBtnGold}`}>
              Assinar por R$ 97/mês
            </a>
          </div>

          {/* Plano 3: R$ 147/mês (Plano Infinity VIP) */}
          <div className={`${styles.pricingCard} ${styles.pricingCardGold}`}>
            <div className={`${styles.pricingBadge} ${styles.pricingBadgeGold}`}>🔥 MAIS POPULAR · RECOMENDADO</div>
            <div className={styles.pricingHeader}>
              <h3>Plano Infinity VIP</h3>
              <p className={styles.pricingDesc}>Para operação profissional de grande escala sem limites de contas ou chaves.</p>
            </div>
            <div className={styles.pricingPrice}>
              <span className={styles.priceCurrency}>R$</span>
              <span className={styles.priceValue}>147</span>
              <span className={styles.pricePeriod}>/mês</span>
            </div>
            <ul className={styles.pricingFeatures}>
              <li><span style={{ fontSize: '18px', width: '24px' }}>♾️</span> <strong style={{ color: '#00ff88' }}>CHAVES INFINITAS LIBERADAS</strong></li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🎥</span> LiveCam Infinity Incluso (HD 1080p)</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>⚡</span> Automação Completa TikTok Shop</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🔄</span> Looping & Retomada Automática F5</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>🎙️</span> VB-Audio CABLE Suite & FX</li>
              <li><span style={{ fontSize: '18px', width: '24px' }}>⭐</span> <strong style={{ color: '#ff3366' }}>Suporte Prioritário c/ Chamada de Vídeo</strong></li>
            </ul>
            <a href="https://pay.cakto.com.br/mdz39dg" target="_blank" rel="noopener noreferrer" className={`${styles.pricingBtn} ${styles.pricingBtnGold}`}>
              Quero Chaves Infinitas (R$ 147)
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Perguntas Frequentes</h2>
          <p className={styles.sectionSubtitle}>Tire todas as suas dúvidas sobre o funcionamento do NITO LIVE.</p>
        </div>

        <div className={styles.faqGrid}>
          {faqData.map((item, idx) => (
            <div key={idx} className={styles.faqItem}>
              <button className={styles.faqQuestion} onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                <ChevronDown 
                  size={18} 
                  style={{ 
                    transform: activeFaq === idx ? "rotate(180deg)" : "rotate(0deg)", 
                    transition: "transform 0.3s" 
                  }} 
                />
              </button>
              {activeFaq === idx && (
                <div className={styles.faqAnswer}>
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Card */}
      <section className={styles.finalCta}>
        <div className={styles.finalCard}>
          <Zap size={48} className={styles.zapIcon} />
          <h2>Preparado para lucrar de forma infinita?</h2>
          <p>
            Suba suas campanhas de lives no TikTok Shop de forma automatizada hoje mesmo. Não perca tempo operando manualmente o que a inteligência artificial pode fazer por você.
          </p>
          <a href="#planos" className={styles.mainCta} style={{ margin: "0 auto" }}>
            Quero Começar Agora
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Link href="/" className={styles.logo}>
          <img src="/nito-logo.png" alt="NITO LIVE" className={styles.logoImg} />
        </Link>
        <p>© 2026 NITO LIVE. Todos os direitos reservados. Automação Infinita. Lucro Sem Limites.</p>
      </footer>

      {/* Popups de Venda em Tempo Real (Prova Social) */}
      {activePopup && (
        <div className={styles.salesPopup}>
          <div className={styles.salesPopupIcon}>
            <ShoppingBag size={20} />
          </div>
          <div className={styles.salesPopupContent}>
            <p className={styles.salesPopupTitle}>
              <strong>{activePopup.name}</strong> assinou o <span>{activePopup.plan}</span>
            </p>
            <p className={styles.salesPopupSubtitle}>
              Garantido por {activePopup.price} • {activePopup.time}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

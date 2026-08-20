"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  DollarSign, 
  Zap, 
  Rocket, 
  Megaphone, 
  Headphones, 
  Target, 
  CreditCard,
  ArrowRight,
  Flame,
  Video,
  GraduationCap
} from "lucide-react";
import styles from "./afiliados.module.css";

export default function AfiliadosPage() {
  const LIVE_INFINITY_LINK = "https://app.cakto.com.br/affiliate/invite/e5505d59-fb55-492b-b877-4d675df3e3a5";
  const LIVECAM_LINK = "https://app.cakto.com.br/affiliate/invite/f6467a03-fe9d-4cab-ae7a-01034717dbec";
  const LIVES_AUTOMATICAS_LINK = "https://app.cakto.com.br/affiliate/invite/6bbdc0c1-5f68-4fba-810f-4f768f12f9fc";

  const benefits = [
    {
      icon: <DollarSign size={24} />,
      title: "Comissões Recorrentes & Vendas Diretas",
      desc: "Receba comissões contínuas nas assinaturas e comissão direta nas vendas do treinamento."
    },
    {
      icon: <Rocket size={24} />,
      title: "Produtos em Forte Expansão",
      desc: "Promova as soluções líderes do mercado para TikTok Shop com alta demanda e ROI acelerado."
    },
    {
      icon: <Megaphone size={24} />,
      title: "Material Pronto para Divulgação",
      desc: "Acesse vídeos de alta conversão, banners, mockups e scripts prontos para impulsionar suas vendas."
    },
    {
      icon: <Headphones size={24} />,
      title: "Suporte Rápido aos Afiliados",
      desc: "Conte com uma equipe dedicada para ajudar você com estratégias de tráfego, dúvidas e otimização."
    },
    {
      icon: <Target size={24} />,
      title: "Cookie de Rastreamento Seguro",
      desc: "Rastreamento avançado de indicações garantindo que sua comissão seja atribuída corretamente."
    },
    {
      icon: <CreditCard size={24} />,
      title: "Pagamentos Automáticos pela Cakto",
      desc: "Receba seus ganhos com total transparência e pontualidade diretamente na sua conta Cakto."
    }
  ];

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <Link href="/landing" className={styles.logo}>
          <img src="/nito-logo.png" alt="NITO LIVE" className={styles.logoImg} />
        </Link>
        <Link href="/landing" className={styles.backBtn}>
          <ArrowLeft size={16} /> Voltar ao Site
        </Link>
      </nav>

      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.badge}>
          <Zap size={14} fill="currentColor" /> Programa Oficial de Afiliados
        </div>
        <h1 className={styles.title}>
          Recomende Soluções de Elite e Fature <span className={styles.highlightGold}>Comissões Altas e Recorrentes</span>
        </h1>
        <p className={styles.subtitle}>
          Promova o ecossistema NITO LIVE e o Treinamento Lives Automáticas. Renda contínua e alta conversão.
        </p>
        <p className={styles.copyStrength}>
          Construa uma renda mensal promovendo as principais automações e treinamentos para TikTok Shop do Brasil.
        </p>
      </header>

      {/* Seção dos Produtos de Afiliação (3 Ofertas Independentes) */}
      <section className={styles.productsSection}>
        
        <div className={styles.highlightBanner}>
          <h3 className={styles.bannerTitle}>
            <Flame size={24} style={{ color: "#ffcf00" }} /> 🔥 OPORTUNIDADES EXCLUSIVAS DE AFILIAÇÃO
          </h3>
          <p className={styles.bannerDesc}>
            Escolha o produto ideal para a sua audiência e receba pagamentos diretos via Cakto.
          </p>
        </div>

        <div className={styles.grid}>
          
          {/* OFERTA 1: NITO LIVE (Extensão Automação) */}
          <div className={`${styles.card} ${styles.cardWhite}`}>
            <div className={`${styles.cardBadge} ${styles.badgeWhite}`}>AUTOMAÇÃO TIKTOK</div>
            <div className={`${styles.cardIcon} ${styles.iconWhite}`}>
              <ShoppingBag size={24} />
            </div>
            <h2 className={styles.cardTitle}>NITO LIVE</h2>
            <p className={styles.cardDesc}>
              Sistema de automação inteligente NITO LIVE para TikTok Shop com GMV em tempo real, refixação de produtos, prova social e autoproteção.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Tipo de Produto:</span>
                <span className={`${styles.metaValue} ${styles.valueWhite}`}>Extensão / SaaS</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueWhite}`}>50% Recorrente</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor dos Planos:</span>
                <span className={styles.metaValue}>R$ 67 a R$ 147</span>
              </div>
            </div>

            <a 
              href={LIVE_INFINITY_LINK} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnWhite}`}
            >
              <span>Quero me afiliar ao NITO LIVE</span>
              <ArrowRight size={18} />
            </a>
          </div>

          {/* OFERTA 2: LIVECAM INFINITY (Câmera Virtual) */}
          <div className={`${styles.card} ${styles.cardRed}`}>
            <div className={`${styles.cardBadge} ${styles.badgeRed}`}>CÂMERA VIRTUAL HD</div>
            <div className={`${styles.cardIcon} ${styles.iconRed}`}>
              <Video size={24} />
            </div>
            <h2 className={styles.cardTitle}>LiveCam Infinity</h2>
            <p className={styles.cardDesc}>
              Câmera virtual HD para TikTok Shop com vídeo vertical, áudio de estúdio, playlist, overlays interativos e perfis de qualidade.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Tipo de Produto:</span>
                <span className={`${styles.metaValue} ${styles.valueRed}`}>Câmera Virtual</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueRed}`}>50% Recorrente</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Modelo:</span>
                <span className={styles.metaValue}>Licença / Assinatura</span>
              </div>
            </div>

            <a 
              href={LIVECAM_LINK} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnRed}`}
            >
              <span>Quero me afiliar ao LiveCam Infinity</span>
              <ArrowRight size={18} />
            </a>
          </div>

          {/* OFERTA 3: LIVES AUTOMÁTICAS (Treinamento - NOVO PRODUTO) */}
          <div className={`${styles.card} ${styles.cardGold}`}>
            <div className={`${styles.cardBadge} ${styles.badgeGoldPulsing}`}>NOVO TREINAMENTO</div>
            <div className={`${styles.cardIcon} ${styles.iconGold}`}>
              <GraduationCap size={24} />
            </div>
            <h2 className={styles.cardTitle}>Treinamento Lives Automáticas</h2>
            <p className={styles.cardDesc}>
              Treinamento passo a passo para criar, configurar e operar lives automáticas no TikTok Shop com mais segurança, estratégia e potencial de vendas.
            </p>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Tipo de Produto:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>Treinamento</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Valor do Produto:</span>
                <span className={styles.metaValue}>R$ 67,00</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Comissão:</span>
                <span className={`${styles.metaValue} ${styles.valueGold}`}>Consultar na Cakto</span>
              </div>
            </div>

            <a 
              href={LIVES_AUTOMATICAS_LINK} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${styles.cardBtn} ${styles.btnGold}`}
            >
              <span>Quero me afiliar ao Lives Automáticas</span>
              <ArrowRight size={18} />
            </a>
          </div>

        </div>
      </section>

      {/* Seção por que promover */}
      <section className={styles.whySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Por que promover nossas soluções?</h2>
          <p className={styles.sectionSubtitle}>
            Um ecossistema completo desenvolvido para garantir máxima conversão de vendas e receita contínua no seu tráfego.
          </p>
        </div>

        <div className={styles.benefitsGrid}>
          {benefits.map((benefit, idx) => (
            <div key={idx} className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                {benefit.icon}
              </div>
              <h3 className={styles.benefitTitle}>{benefit.title}</h3>
              <p className={styles.benefitDesc}>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Resultados */}
      <section className={styles.resultsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>3</div>
            <div className={styles.statLabel}>Ofertas de Alta Conversão</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>50%</div>
            <div className={styles.statLabel}>Comissão Recorrente nos SaaS</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>Cakto</div>
            <div className={styles.statLabel}>Pagamentos Rápidos e Garantidos</div>
          </div>
        </div>
      </section>

      {/* CTA GIGANTE */}
      <section className={styles.bigCtaSection}>
        <div className={styles.bigCtaCard}>
          <h2 className={styles.bigCtaTitle}>Comece agora mesmo a construir sua receita como afiliado.</h2>
          <p className={styles.bigCtaSubtitle}>
            Escolha seu produto preferido, cadastre-se gratuitamente na Cakto e obtenha seu link exclusivo.
          </p>
          <a 
            href={LIVES_AUTOMATICAS_LINK} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.bigCtaBtn}
          >
            <span>AFILIAR-SE AO LIVES AUTOMÁTICAS</span>
            <ArrowRight size={22} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <img src="/nito-logo.png" alt="NITO LIVE" className={styles.logoImg} style={{ height: "30px" }} />
        <p>© 2026 NITO LIVE. Todos os direitos reservados. Automação Infinita. Lucro Sem Limites.</p>
      </footer>
    </div>
  );
}

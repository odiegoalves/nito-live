import { Check, Star, Zap, Crown } from "lucide-react";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "0",
    period: "/mês",
    desc: "Para quem está começando a organizar seus custos e aprender a precificar.",
    icon: <Star size={22} color="var(--secondary-foreground)" />,
    color: "var(--secondary-foreground)",
    badge: null,
    btnLabel: "Plano Atual",
    btnClass: "btnDisabled",
    features: [
      "Até 5 materiais cadastrados",
      "Até 5 clientes",
      "Até 5 orçamentos gerados",
      "Cálculo automático de custo",
      "1 serviço cadastrado",
      "Suporte por e-mail",
    ],
    locked: [
      "Envio de orçamento por WhatsApp",
      "PDF do orçamento",
      "Agenda de serviços",
      "Relatórios financeiros",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "49,90",
    period: "/mês",
    desc: "Para profissionais autônomos que querem profissionalizar suas vendas e aumentar conversões.",
    icon: <Zap size={22} color="var(--primary)" />,
    color: "var(--primary)",
    badge: "MAIS ESCOLHIDO",
    btnLabel: "Fazer upgrade para PRO",
    btnClass: "btnPrimary",
    features: [
      "Materiais ilimitados",
      "Clientes ilimitados",
      "Orçamentos ilimitados",
      "Serviços ilimitados",
      "Envio de orçamento por WhatsApp",
      "Agenda de serviços",
      "Relatório financeiro básico",
      "Suporte prioritário",
    ],
    locked: [
      "PDF com marca personalizada",
      "Múltiplos usuários",
      "Relatórios avançados",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "69,90",
    period: "/mês",
    desc: "Para pequenas empresas que precisam de controle total, relatórios avançados e múltiplos usuários.",
    icon: <Crown size={22} color="#f59e0b" />,
    color: "#f59e0b",
    badge: null,
    btnLabel: "Fazer upgrade para PREMIUM",
    btnClass: "btnPremium",
    features: [
      "Tudo do plano Pro",
      "PDF do orçamento com sua logomarca",
      "Até 3 usuários (equipe)",
      "Relatórios financeiros avançados",
      "Histórico completo de clientes",
      "Controle de estoque automático",
      "Alerta de estoque baixo",
      "Suporte via WhatsApp",
      "Onboarding personalizado",
    ],
    locked: [],
  },
];

export default async function PlanosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Escolha o plano ideal para o seu negócio</h1>
        <p className={styles.subtitle}>
          Profissionalize suas vendas, calcule seus custos com precisão e conquiste mais clientes.
          Cancele quando quiser.
        </p>
      </header>

      <div className={styles.pricingGrid}>
        {plans.map((plan) => (
          <div key={plan.id} className={`${styles.planCard} ${plan.badge ? styles.planCardPro : ""}`}>
            {plan.badge && <div className={styles.badge}>{plan.badge}</div>}
            <div className={styles.planHeader}>
              <h3 className={styles.planName}>{plan.name}</h3>
              {plan.icon}
            </div>
            <div className={styles.planPrice}>
              {plan.price === "0" ? "Grátis" : `R$ ${plan.price}`}
              {plan.price !== "0" && <span className={styles.planPeriod}>{plan.period}</span>}
            </div>
            <p className={styles.planDesc}>{plan.desc}</p>

            <div className={styles.features}>
              {plan.features.map((f) => (
                <div key={f} className={styles.feature}>
                  <Check size={16} className={styles.featureIcon} />
                  {f}
                </div>
              ))}
              {plan.locked.map((f) => (
                <div key={f} className={styles.feature} style={{ opacity: 0.4 }}>
                  <span style={{ width: 16, height: 16, display: "inline-flex", flexShrink: 0 }}>🔒</span>
                  <span style={{ textDecoration: "line-through", fontSize: "0.8rem" }}>{f}</span>
                </div>
              ))}
            </div>

            <a
              href={plan.id === "free" ? "#" : "https://pay.cakto.com.br/xd4yj7y"}
              className={`${styles.planBtn} ${styles[plan.btnClass as keyof typeof styles]} ${plan.id === "free" ? styles.btnDisabled : ""}`}
              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {plan.btnLabel}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

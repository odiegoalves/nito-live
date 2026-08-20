import { Crown, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./bloqueado.module.css";

export default function BloqueadoPage() {
  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.iconBox}>
          <AlertTriangle size={48} color="#ef4444" />
        </div>
        
        <h1 className={styles.title}>Acesso Suspenso</h1>
        <p className={styles.desc}>
          Identificamos que o seu plano <strong>Premium/Pro</strong> expirou ou o pagamento ainda não foi processado. 
          Suas informações continuam salvas, mas o acesso às ferramentas está bloqueado até a regularização.
        </p>

        <div className={styles.benefits}>
          <div className={styles.benefit}>
            <Crown size={16} color="var(--primary)" />
            <span>Libere a geração de orçamentos e PDFs</span>
          </div>
          <div className={styles.benefit}>
            <Crown size={16} color="var(--primary)" />
            <span>Mantenha sua agenda e clientes ativos</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/planos" className="premium-button" style={{ width: "100%", justifyContent: "center", height: "55px" }}>
            Regularizar Pagamento <ArrowRight size={18} />
          </Link>
          <Link href="/" className={styles.backLink}>Já paguei, atualizar sistema</Link>
        </div>

        <p className={styles.footer}>
          Dúvidas? Entre em contato com nosso suporte via WhatsApp.
        </p>
      </div>
    </div>
  );
}

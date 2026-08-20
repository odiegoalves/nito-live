"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Users, Wrench,
  Package, Calendar, DollarSign, CreditCard, Settings, LogOut,
  Sun, Moon
} from "lucide-react";
import styles from "./Navbar.module.css";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orçamentos", href: "/orcamentos", icon: FileText },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Serviços", href: "/servicos", icon: Wrench },
  { name: "Materiais", href: "/materiais", icon: Package },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Planos", href: "/planos", icon: CreditCard },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>V</div>
        <span className={styles.logoText}>VALORA</span>
      </div>

      <div className={styles.navLinks}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <Icon size={16} className={styles.icon} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.userSection}>
        <button onClick={toggleTheme} className={styles.iconButton} title="Mudar Tema">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link href="/configuracoes" className={styles.iconButton} title="Configurações">
          <Settings size={18} />
        </Link>
        <Link href="/onboarding" className={styles.iconButton} title="Alterar nicho">
          <LogOut size={18} />
        </Link>
      </div>
    </nav>
  );
}

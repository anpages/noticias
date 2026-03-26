"use client";

import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, Menu, Rss } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  showMenuButton: boolean;
  onMenuClick: () => void;
}

export function Header({ showMenuButton, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 20 }}
      className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        )}
        <Rss size={20} className="text-blue-500" />
        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
          Noticias RSS
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <ThemeToggle />
        {session?.user?.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || ""}
            width={28}
            height={28}
            style={{ borderRadius: "50%", margin: "0 4px" }}
          />
        )}
        {session?.user && (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}

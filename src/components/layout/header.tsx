"use client";

import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, Menu, Rss } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      style={{ height: 56, flexShrink: 0, zIndex: 20 }}
      className="flex items-center justify-between px-3 sm:px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <Rss size={20} className="text-blue-500" />
        <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm sm:text-base">
          RSS Reader
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {session?.user && (
          <>
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || ""}
                width={28}
                height={28}
                className="rounded-full mx-1"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

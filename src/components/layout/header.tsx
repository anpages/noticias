"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, Rss } from "lucide-react";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-neutral-950">
      <div className="flex items-center gap-2">
        <Rss size={20} className="text-blue-500" />
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">RSS Reader</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-2">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={28}
                height={28}
                className="rounded-full"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

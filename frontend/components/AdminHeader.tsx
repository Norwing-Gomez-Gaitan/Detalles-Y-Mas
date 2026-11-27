"use client";

import { useEffect, useState } from "react";
import { User, Bell, Clock, Moon, Sun } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

export function AdminHeader({ title }: { title: string }) {
  const [userName, setUserName] = useState<string>("Administrador");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    apiFetch("/api/admin/auth/me")
      .then((user) => {
        if (user?.nombre) setUserName(user.nombre);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-marfil dark:bg-artesanoDark-surface border-b border-kraft/60 dark:border-artesanoDark-border px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs transition-colors duration-200">
      <div>
        <h1 className="font-serif text-2xl font-bold text-chocolate dark:text-artesanoDark-text">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Selector / Botón de Modo Oscuro y Claro */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          aria-label="Alternar modo de color"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-crema dark:bg-artesanoDark-card hover:bg-kraft/40 dark:hover:bg-artesanoDark-hover border border-kraft/50 dark:border-artesanoDark-border text-chocolate dark:text-artesanoDark-text transition-all duration-200 cursor-pointer shadow-2xs"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-dorado animate-spin-slow" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-borgona" />
              <span className="hidden sm:inline">Modo Oscuro</span>
            </>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-cacao dark:text-artesanoDark-muted bg-crema dark:bg-artesanoDark-card px-3 py-1.5 rounded-full border border-kraft/40 dark:border-artesanoDark-border">
          <Clock className="w-3.5 h-3.5 text-dorado" />
          <span>Nicaragua (GMT-6)</span>
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-kraft/60 dark:border-artesanoDark-border">
          <div className="w-8 h-8 rounded-full bg-rosa-soft dark:bg-borgona/30 text-borgona dark:text-dorado flex items-center justify-center font-bold text-sm border border-rosa-pastel dark:border-borgona/50">
            <User className="w-4 h-4 text-borgona dark:text-dorado" />
          </div>
          <span className="text-sm font-semibold text-chocolate dark:text-artesanoDark-text hidden md:inline">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}


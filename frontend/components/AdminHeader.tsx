"use client";

import { useEffect, useState } from "react";
import { User, Bell, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function AdminHeader({ title }: { title: string }) {
  const [userName, setUserName] = useState<string>("Administrador");

  useEffect(() => {
    apiFetch("/api/admin/auth/me")
      .then((user) => {
        if (user?.nombre) setUserName(user.nombre);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-marfil border-b border-kraft/60 px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      <div>
        <h1 className="font-serif text-2xl font-bold text-chocolate">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-cacao bg-crema px-3 py-1.5 rounded-full border border-kraft/40">
          <Clock className="w-3.5 h-3.5 text-dorado" />
          <span>Nicaragua (GMT-6)</span>
        </div>
        <div className="flex items-center gap-2.5 pl-3 border-l border-kraft/60">
          <div className="w-8 h-8 rounded-full bg-rosa-soft text-borgona flex items-center justify-center font-bold text-sm border border-rosa-pastel">
            <User className="w-4 h-4 text-borgona" />
          </div>
          <span className="text-sm font-semibold text-chocolate hidden md:inline">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}


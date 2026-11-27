"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { apiFetch } from "@/lib/api";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    let isMounted = true;

    const checkAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

      if (!token) {
        if (isMounted) {
          setAuthorized(false);
          setChecking(false);
          router.replace("/admin/login");
        }
        return;
      }

      try {
        // Verificar que el token sea válido en el backend
        await apiFetch("/api/admin/auth/me");
        if (isMounted) {
          setAuthorized(true);
          setChecking(false);
        }
      } catch (err) {
        console.warn("Sesión administrativa inválida o expirada:", err);
        if (isMounted) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("admin_token");
          }
          setAuthorized(false);
          setChecking(false);
          router.replace("/admin/login");
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <ThemeProvider>
        <main className="min-h-screen bg-crema dark:bg-artesanoDark-bg text-chocolate dark:text-artesanoDark-text">{children}</main>
      </ThemeProvider>
    );
  }

  // Pantalla de carga mientras se verifica la autenticación
  if (checking) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-crema dark:bg-artesanoDark-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="relative w-16 h-16 rounded-full bg-rosa-soft dark:bg-borgona/30 flex items-center justify-center border border-rosa-pastel dark:border-borgona/50 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-borgona dark:text-rosa-pastel" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-bold text-chocolate dark:text-artesanoDark-text">
              Verificando Acceso Seguro
            </h2>
            <p className="text-xs text-cacao dark:text-artesanoDark-muted">
              Comprobando credenciales de administrador...
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Si no está autorizado, no renderizar nada mientras redirige a login
  if (!authorized) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-crema dark:bg-artesanoDark-bg text-chocolate dark:text-artesanoDark-text transition-colors duration-200">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}

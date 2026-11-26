"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
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
    return <main className="min-h-screen bg-crema">{children}</main>;
  }

  // Pantalla de carga mientras se verifica la autenticación
  if (checking) {
    return (
      <div className="min-h-screen bg-crema flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="relative w-16 h-16 rounded-full bg-rosa-soft flex items-center justify-center border border-rosa-pastel shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-borgona" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-lg font-bold text-chocolate">
            Verificando Acceso Seguro
          </h2>
          <p className="text-xs text-cacao">
            Comprobando credenciales de administrador...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autorizado, no renderizar nada mientras redirige a login
  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-crema">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

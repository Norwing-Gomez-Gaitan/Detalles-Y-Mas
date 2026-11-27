"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Layers,
  Boxes,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Layers },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/compras", label: "Compras y Prov.", icon: Truck },
  { href: "/admin/gastos", label: "Gastos", icon: Receipt },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Ignorar
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
      }
      router.push("/admin/login");
    }
  };

  return (
    <aside className="w-64 bg-marfil dark:bg-artesanoDark-surface border-r border-kraft/70 dark:border-artesanoDark-border flex flex-col shrink-0 h-screen sticky top-0 shadow-sm z-30 transition-colors duration-200">
      {/* Encabezado del Admin */}
      <div className="p-5 border-b border-kraft/60 dark:border-artesanoDark-border flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-dorado shrink-0">
          <Image src="/logo.png" alt="Detalles y Más Logo" fill sizes="40px" className="object-cover" />
        </div>
        <div className="overflow-hidden">
          <h2 className="font-serif font-bold text-lg text-borgona dark:text-rosa-pastel leading-tight truncate">
            Detalles y Más
          </h2>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-dorado bg-crema dark:bg-artesanoDark-card px-2 py-0.5 rounded-full border border-kraft/50 dark:border-artesanoDark-border">
            Administración
          </span>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-artesanal text-sm font-medium transition-all ${
                isActive
                  ? "bg-borgona text-white shadow-sm font-semibold"
                  : "text-chocolate dark:text-artesanoDark-text hover:bg-crema dark:hover:bg-artesanoDark-hover hover:text-borgona dark:hover:text-dorado"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-dorado" : "text-cacao dark:text-artesanoDark-muted"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pie de navegación: Ver catálogo y Salir */}
      <div className="p-3 border-t border-kraft/60 dark:border-artesanoDark-border space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3.5 py-2 rounded-artesanal text-xs font-semibold text-cacao dark:text-artesanoDark-muted hover:bg-crema dark:hover:bg-artesanoDark-hover hover:text-borgona dark:hover:text-dorado transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-dorado" />
            Ver Sitio Público
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2 rounded-artesanal text-xs font-semibold text-estado-error hover:bg-rosa-soft dark:hover:bg-estado-error/20 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}


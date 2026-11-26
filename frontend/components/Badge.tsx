import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "cotizacion" | "confirmado" | "en_produccion" | "listo" | "entregado" | "cancelado" | "success" | "warning" | "danger" | "default";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variantStyles = {
    // Estados de Pedido requeridos en la especificación:
    // cotización rosa, confirmado borgoña, en producción aviso, listo dorado, entregado éxito, cancelado error
    cotizacion: "bg-rosa-pastel text-borgona-dark border-rosa-pastel",
    confirmado: "bg-borgona text-white border-borgona",
    en_produccion: "bg-[#FDF0D5] text-estado-aviso border-estado-aviso/30",
    listo: "bg-[#FFF8E7] text-dorado-dark border-dorado/50",
    entregado: "bg-[#EAF3E6] text-estado-exito border-estado-exito/30",
    cancelado: "bg-[#FBEBEA] text-estado-error border-estado-error/30",

    // Variantes genéricas
    success: "bg-[#EAF3E6] text-estado-exito border-estado-exito/30",
    warning: "bg-[#FDF0D5] text-estado-aviso border-estado-aviso/30",
    danger: "bg-[#FBEBEA] text-estado-error border-estado-error/30",
    default: "bg-crema text-chocolate border-kraft",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize tracking-wide shadow-2xs",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}


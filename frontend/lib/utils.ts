import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un monto numérico a formato de Córdobas de Nicaragua (C$ #,##0.00)
 */
export function formatCordoba(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "C$ 0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "C$ 0.00";
  return `C$ ${num.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea una fecha ISO a dd/mm/aaaa
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

/**
 * Formatea un número de teléfono nicaragüense a formato visible '####-####' (ej. 8485-6722)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "8485-6722";
  const digits = phone.replace(/[^0-9]/g, "");
  const localDigits = digits.startsWith("505") && digits.length >= 11 ? digits.slice(3) : digits;
  if (localDigits.length === 8) {
    return `${localDigits.slice(0, 4)}-${localDigits.slice(4)}`;
  }
  return phone;
}

/**
 * Genera el enlace de WhatsApp con mensaje prellenado, asegurando el prefijo 505 de Nicaragua
 */
export function getWhatsAppUrl(phone: string = "8485-6722", message: string = ""): string {
  const cleanPhone = (phone || "8485-6722").replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.length === 8 ? `505${cleanPhone}` : cleanPhone;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${formattedPhone}${query}`;
}


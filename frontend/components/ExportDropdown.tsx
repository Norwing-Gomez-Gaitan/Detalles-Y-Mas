"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, FileCode, ChevronDown } from "lucide-react";

interface ExportDropdownProps {
  tipo: string;
  label?: string;
  className?: string;
}

export function ExportDropdown({
  tipo,
  label = "Exportar",
  className = "",
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDescargar = (formato: "xlsx" | "pdf" | "csv") => {
    setOpen(false);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    const url = `${backendUrl}/api/admin/reportes/exportar?tipo=${tipo}&formato=${formato}${
      token ? `&token=${encodeURIComponent(token)}` : ""
    }`;
    window.open(url, "_blank");
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-marfil dark:bg-artesanoDark-card hover:bg-crema dark:hover:bg-artesanoDark-hover border border-kraft dark:border-artesanoDark-border text-chocolate dark:text-artesanoDark-text font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-2xs"
        title="Exportar datos en Excel, PDF o CSV"
      >
        <Download className="w-3.5 h-3.5 text-dorado" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-cacao dark:text-artesanoDark-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-marfil dark:bg-artesanoDark-surface border border-kraft dark:border-artesanoDark-border shadow-lg py-1.5 z-50 animate-fadeIn text-xs">
          <button
            type="button"
            onClick={() => handleDescargar("xlsx")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left font-medium text-chocolate dark:text-artesanoDark-text hover:bg-crema dark:hover:bg-artesanoDark-hover transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#107C41]" />
            <div>
              <span className="block font-semibold">Excel (.xlsx)</span>
              <span className="text-[10px] text-cacao dark:text-artesanoDark-muted">Formato y estilos oficiales</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDescargar("pdf")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left font-medium text-chocolate dark:text-artesanoDark-text hover:bg-crema dark:hover:bg-artesanoDark-hover transition-colors"
          >
            <FileText className="w-4 h-4 text-borgona dark:text-rosa-pastel" />
            <div>
              <span className="block font-semibold">PDF (.pdf)</span>
              <span className="text-[10px] text-cacao dark:text-artesanoDark-muted">Documento para imprimir</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDescargar("csv")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left font-medium text-chocolate dark:text-artesanoDark-text hover:bg-crema dark:hover:bg-artesanoDark-hover transition-colors"
          >
            <FileCode className="w-4 h-4 text-dorado" />
            <div>
              <span className="block font-semibold">CSV (.csv)</span>
              <span className="text-[10px] text-cacao dark:text-artesanoDark-muted">Compatible UTF-8 con BOM</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

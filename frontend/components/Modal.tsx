"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`bg-marfil dark:bg-artesanoDark-surface w-full ${maxWidth} rounded-artesanal shadow-2xl border border-kraft dark:border-artesanoDark-border overflow-hidden flex flex-col max-h-[90vh] transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-kraft/60 dark:border-artesanoDark-border flex items-center justify-between bg-crema/60 dark:bg-artesanoDark-card/90">
          <h3 className="font-serif text-lg font-bold text-chocolate dark:text-artesanoDark-text">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-cacao dark:text-artesanoDark-muted hover:text-borgona dark:hover:text-dorado hover:bg-rosa-soft dark:hover:bg-artesanoDark-hover transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto flex-1 text-chocolate dark:text-artesanoDark-text">{children}</div>
      </div>
    </div>
  );
}


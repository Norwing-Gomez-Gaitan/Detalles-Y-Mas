"use client";

import { Badge } from "./Badge";
import { formatCordoba, formatDate } from "@/lib/utils";
import { Calendar, User, ArrowRight, Printer, AlertCircle } from "lucide-react";

interface PedidoKanban {
  id: number;
  estado: string;
  fecha_pedido: string;
  fecha_entrega?: string | null;
  total: number;
  total_pagado: number;
  saldo_pendiente: number;
  cliente: {
    nombre: string;
    whatsapp?: string | null;
  };
  detalles: Array<{
    descripcion: string;
    cantidad: number;
  }>;
}

interface KanbanBoardProps {
  pedidos: PedidoKanban[];
  onCambiarEstado: (id: number, nuevoEstado: string) => void;
  onImprimir: (id: number) => void;
  onVerDetalle: (pedido: PedidoKanban) => void;
}

const COLUMNAS = [
  { id: "cotizacion", label: "Cotización", variant: "cotizacion" as const },
  { id: "confirmado", label: "Confirmado", variant: "confirmado" as const },
  { id: "en_produccion", label: "En Producción", variant: "en_produccion" as const },
  { id: "listo", label: "Listo para Entrega", variant: "listo" as const },
  { id: "entregado", label: "Entregado", variant: "entregado" as const },
];

const SIGUIENTE_ESTADO: Record<string, string> = {
  cotizacion: "confirmado",
  confirmado: "en_produccion",
  en_produccion: "listo",
  listo: "entregado",
};

export function KanbanBoard({
  pedidos,
  onCambiarEstado,
  onImprimir,
  onVerDetalle,
}: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-6">
      {COLUMNAS.map((col) => {
        const pedidosColumna = pedidos.filter((p) => p.estado === col.id);

        return (
          <div
            key={col.id}
            className="bg-crema/70 rounded-artesanal border border-kraft/60 p-3 flex flex-col min-w-[250px] shadow-2xs"
          >
            {/* Encabezado de columna */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-serif font-bold text-sm text-chocolate flex items-center gap-2">
                <Badge variant={col.variant}>{col.label}</Badge>
              </span>
              <span className="text-xs font-bold text-cacao bg-marfil px-2 py-0.5 rounded-full border border-kraft/50">
                {pedidosColumna.length}
              </span>
            </div>

            {/* Lista de tarjetas */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              {pedidosColumna.map((ped) => {
                const tieneSaldo = ped.saldo_pendiente > 0;
                const siguiente = SIGUIENTE_ESTADO[ped.estado];

                return (
                  <div
                    key={ped.id}
                    className="bg-marfil p-3.5 rounded-lg border border-kraft/70 shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-2.5"
                    onClick={() => onVerDetalle(ped)}
                  >
                    {/* ID y Total */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-borgona">
                        #{ped.id}
                      </span>
                      <span className="font-bold text-sm text-chocolate">
                        {formatCordoba(ped.total)}
                      </span>
                    </div>

                    {/* Cliente */}
                    <div className="flex items-center gap-1.5 text-xs text-chocolate font-medium truncate">
                      <User className="w-3.5 h-3.5 text-dorado shrink-0" />
                      <span className="truncate">{ped.cliente.nombre}</span>
                    </div>

                    {/* Fecha de entrega */}
                    <div className="flex items-center gap-1.5 text-xs text-cacao">
                      <Calendar className="w-3.5 h-3.5 text-kraft shrink-0" />
                      <span>Entrega: {formatDate(ped.fecha_entrega)}</span>
                    </div>

                    {/* Líneas resumidas */}
                    <div className="text-[11px] text-cacao/90 bg-crema/50 p-1.5 rounded border border-kraft/30 line-clamp-2">
                      {ped.detalles.map((d) => `${d.cantidad}x ${d.descripcion}`).join(", ")}
                    </div>

                    {/* Saldo aviso */}
                    {tieneSaldo && (
                      <div className="flex items-center justify-between text-[11px] text-estado-error font-semibold bg-rosa-soft/40 px-2 py-1 rounded">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Saldo:
                        </span>
                        <span>{formatCordoba(ped.saldo_pendiente)}</span>
                      </div>
                    )}

                    {/* Acciones de la tarjeta */}
                    <div
                      className="flex items-center justify-between pt-2 border-t border-kraft/40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onImprimir(ped.id)}
                        className="p-1.5 rounded text-cacao hover:text-borgona hover:bg-crema transition-colors"
                        title="Imprimir Comprobante"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {siguiente && (
                        <button
                          onClick={() => onCambiarEstado(ped.id, siguiente)}
                          className="flex items-center gap-1 text-[11px] font-bold text-borgona hover:text-borgona-dark bg-rosa-pastel/50 hover:bg-rosa-pastel px-2 py-1 rounded transition-colors"
                        >
                          Avanzar
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {pedidosColumna.length === 0 && (
                <div className="text-center py-8 text-xs text-cacao/60 italic border-2 border-dashed border-kraft/40 rounded-lg">
                  Sin pedidos
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


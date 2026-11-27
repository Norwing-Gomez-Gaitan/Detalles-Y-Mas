"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { formatCordoba, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  ShoppingBag,
  Plus,
  Search,
  LayoutGrid,
  List,
  Printer,
  DollarSign,
  ArrowRight,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  Truck,
  Download,
} from "lucide-react";

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Vista: lista o kanban
  const [vista, setVista] = useState<"lista" | "kanban">("lista");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [buscar, setBuscar] = useState("");

  // Modal nuevo pedido
  const [modalPedidoOpen, setModalPedidoOpen] = useState(false);
  const [submittingPedido, setSubmittingPedido] = useState(false);
  const [formPedido, setFormPedido] = useState({
    cliente_id: 1,
    fecha_entrega: "",
    estado: "cotizacion",
    tipo_entrega: "retiro_local",
    direccion_entrega: "",
    costo_envio: 0,
    descuento: 0,
    notas: "",
    detalles: [] as Array<{
      producto_id: number | null;
      descripcion: string;
      cantidad: number;
      precio_unitario: number;
      costo_estimado: number;
      personalizacion: string;
      imagen_referencia_url: string;
    }>,
  });

  // Modal registrar pago
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [pedidoParaPago, setPedidoParaPago] = useState<any>(null);
  const [formPago, setFormPago] = useState({
    monto: 0,
    metodo: "transferencia",
    es_anticipo: true,
    referencia: "",
    notas: "",
  });

  // Modal ver detalle pedido
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedsRes, clientesRes, prodsRes] = await Promise.all([
        apiFetch("/api/admin/pedidos"),
        apiFetch("/api/admin/clientes"),
        apiFetch("/api/admin/productos"),
      ]);
      setPedidos(pedsRes);
      setClientes(clientesRes);
      setProductos(prodsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalCrearPedido = () => {
    setFormPedido({
      cliente_id: clientes[0]?.id || 1,
      fecha_entrega: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      estado: "confirmado",
      tipo_entrega: "retiro_local",
      direccion_entrega: "",
      costo_envio: 0,
      descuento: 0,
      notas: "",
      detalles: [
        {
          producto_id: productos[0]?.id || null,
          descripcion: productos[0]?.nombre || "Pieza personalizada a medida",
          cantidad: 1,
          precio_unitario: Number(productos[0]?.precio_venta) || 500,
          costo_estimado: Number(productos[0]?.costo_materiales) || 200,
          personalizacion: "Colores: borgoña y dorado. Nombre personalizado.",
          imagen_referencia_url: "",
        },
      ],
    });
    setModalPedidoOpen(true);
  };

  const agregarLineaDetalle = () => {
    setFormPedido((prev) => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          producto_id: null,
          descripcion: "Pieza artesanal personalizada a medida",
          cantidad: 1,
          precio_unitario: 350,
          costo_estimado: 150,
          personalizacion: "",
          imagen_referencia_url: "",
        },
      ],
    }));
  };

  const quitarLineaDetalle = (idx: number) => {
    setFormPedido((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== idx),
    }));
  };

  const actualizarLinea = (idx: number, campo: string, valor: any) => {
    setFormPedido((prev) => {
      const copy = [...prev.detalles];
      copy[idx] = { ...copy[idx], [campo]: valor };
      if (campo === "producto_id") {
        const prod = productos.find((p) => p.id === Number(valor));
        if (prod) {
          copy[idx].descripcion = prod.nombre;
          copy[idx].precio_unitario = Number(prod.precio_venta);
          copy[idx].costo_estimado = Number(prod.costo_materiales) || 0;
        }
      }
      return { ...prev, detalles: copy };
    });
  };

  // Cálculo del total del pedido en vivo
  const subtotalLineas = formPedido.detalles.reduce(
    (sum, d) => sum + (d.cantidad * d.precio_unitario),
    0
  );
  const totalPedidoCalculado = Math.max(
    0,
    subtotalLineas + formPedido.costo_envio - formPedido.descuento
  );

  const handleGuardarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formPedido.detalles.length === 0) {
      alert("Validación: Debe agregar al menos un producto o ítem personalizado al pedido.");
      return;
    }

    for (const d of formPedido.detalles) {
      if (!d.descripcion || d.descripcion.trim().length === 0) {
        alert("Validación: Cada ítem del pedido debe tener una descripción.");
        return;
      }
      if (d.cantidad <= 0) {
        alert(`Validación: La cantidad de "${d.descripcion}" debe ser al menos 1.`);
        return;
      }
      if (d.precio_unitario < 0) {
        alert(`Validación: El precio unitario de "${d.descripcion}" no puede ser negativo.`);
        return;
      }
    }

    if (formPedido.tipo_entrega === "envio_domicilio" && !formPedido.direccion_entrega.trim()) {
      alert("Validación: Ingrese la dirección exacta para entregas a domicilio.");
      return;
    }

    if (formPedido.descuento > subtotalLineas + formPedido.costo_envio) {
      alert(`Validación: El descuento (C$ ${formPedido.descuento}) no puede exceder el total antes de descuento (C$ ${(subtotalLineas + formPedido.costo_envio).toFixed(2)}).`);
      return;
    }

    try {
      setSubmittingPedido(true);
      await apiFetch("/api/admin/pedidos", {
        method: "POST",
        body: JSON.stringify(formPedido),
      });
      setModalPedidoOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al crear pedido");
    } finally {
      setSubmittingPedido(false);
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await apiFetch(`/api/admin/pedidos/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado");
    }
  };

  const abrirModalPago = (ped: any) => {
    setPedidoParaPago(ped);
    setFormPago({
      monto: ped.saldo_pendiente > 0 ? ped.saldo_pendiente : 0,
      metodo: "transferencia",
      es_anticipo: ped.total_pagado === 0,
      referencia: `TR-${Math.floor(100000 + Math.random() * 900000)}`,
      notas: "",
    });
    setModalPagoOpen(true);
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoParaPago) return;

    if (formPago.monto <= 0) {
      alert("Validación: El monto del pago debe ser mayor a C$ 0.00.");
      return;
    }

    if (pedidoParaPago.saldo_pendiente <= 0.009) {
      alert("Validación: Este pedido ya se encuentra completamente pagado (Saldo C$ 0.00).");
      return;
    }

    if (formPago.monto > pedidoParaPago.saldo_pendiente + 0.01) {
      alert(`Validación: El monto ingresado (C$ ${formPago.monto.toFixed(2)}) supera el saldo pendiente (C$ ${pedidoParaPago.saldo_pendiente.toFixed(2)}). Por favor corrija el monto.`);
      return;
    }

    try {
      await apiFetch("/api/admin/pedidos/pagos", {
        method: "POST",
        body: JSON.stringify({
          pedido_id: pedidoParaPago.id,
          ...formPago,
        }),
      });
      setModalPagoOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al registrar pago");
    }
  };

  const handleImprimir = (id: number) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    window.open(`${backendUrl}/api/admin/pedidos/${id}/imprimir`, "_blank");
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const matchEstado = filtroEstado ? p.estado === filtroEstado : true;
    const matchBuscar =
      p.cliente?.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      p.id.toString().includes(buscar);
    return matchEstado && matchBuscar;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <AdminHeader title="Gestión de Pedidos y Cotizaciones" />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* Barra de Filtros, Vistas y Nuevo Pedido */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-cacao absolute left-3 top-3.5" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por cliente o # pedido..."
                className="w-full pl-9 pr-3 py-2 bg-marfil border border-kraft rounded-lg text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Filtro por Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-marfil border border-kraft rounded-lg py-2 px-3 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            >
              <option value="">Todos los Estados</option>
              <option value="cotizacion">Cotización</option>
              <option value="confirmado">Confirmado</option>
              <option value="en_produccion">En Producción</option>
              <option value="listo">Listo</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            {/* Selector de Vista: Lista vs Kanban */}
            <div className="flex items-center bg-marfil border border-kraft rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setVista("lista")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  vista === "lista"
                    ? "bg-borgona text-white"
                    : "text-cacao hover:text-chocolate"
                }`}
                title="Vista de Lista"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setVista("kanban")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  vista === "kanban"
                    ? "bg-borgona text-white"
                    : "text-cacao hover:text-chocolate"
                }`}
                title="Vista Tablero Kanban"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
                window.open(`${backendUrl}/api/admin/reportes/exportar-csv?tipo=pedidos${token ? `&token=${encodeURIComponent(token)}` : ""}`, "_blank");
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-marfil hover:bg-crema border border-kraft text-chocolate font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-2xs"
              title="Descargar listado completo de pedidos en formato CSV estructurado para Excel"
            >
              <Download className="w-4 h-4 text-dorado" />
              <span>Exportar Pedidos (CSV)</span>
            </button>

            <button
              onClick={abrirModalCrearPedido}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-borgona hover:bg-borgona-dark text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Pedido</span>
            </button>
          </div>
        </div>

        {/* Vista Kanban o Vista Tabla */}
        {vista === "kanban" ? (
          <KanbanBoard
            pedidos={pedidosFiltrados}
            onCambiarEstado={handleCambiarEstado}
            onImprimir={handleImprimir}
            onVerDetalle={(ped) => {
              setPedidoSeleccionado(ped);
              setModalDetalleOpen(true);
            }}
          />
        ) : (
          <div className="bg-marfil rounded-artesanal border border-kraft/70 shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-crema/70 border-b border-kraft/60 text-cacao font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4"># Pedido</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha Entrega</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Total (C$)</th>
                  <th className="py-3 px-4 text-right">Pagado</th>
                  <th className="py-3 px-4 text-right">Saldo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kraft/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-cacao">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-borgona" />
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : pedidosFiltrados.length > 0 ? (
                  pedidosFiltrados.map((p) => {
                    const tieneSaldo = p.saldo_pendiente > 0;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-crema/30 cursor-pointer"
                        onClick={() => {
                          setPedidoSeleccionado(p);
                          setModalDetalleOpen(true);
                        }}
                      >
                        <td className="py-3 px-4 font-bold text-borgona">#{p.id}</td>
                        <td className="py-3 px-4 font-semibold text-chocolate">
                          {p.cliente?.nombre}
                        </td>
                        <td className="py-3 px-4 text-xs text-cacao">
                          {formatDate(p.fecha_entrega)}
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.estado}
                            onChange={(e) => handleCambiarEstado(p.id, e.target.value)}
                            className="text-xs font-bold rounded-full px-2.5 py-1 border border-kraft bg-marfil cursor-pointer outline-none capitalize"
                          >
                            <option value="cotizacion">Cotización</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="en_produccion">En Producción</option>
                            <option value="listo">Listo</option>
                            <option value="entregado">Entregado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right font-serif font-bold text-chocolate">
                          {formatCordoba(p.total)}
                        </td>
                        <td className="py-3 px-4 text-right text-estado-exito font-medium">
                          {formatCordoba(p.total_pagado)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-estado-error">
                          {tieneSaldo ? formatCordoba(p.saldo_pendiente) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => abrirModalPago(p)}
                              className="p-1.5 text-estado-exito hover:bg-crema rounded-lg"
                              title="Registrar Pago / Abono"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleImprimir(p.id)}
                              className="p-1.5 text-cacao hover:text-borgona hover:bg-crema rounded-lg"
                              title="Imprimir Comprobante PDF"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-cacao italic">
                      No hay pedidos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Pedido */}
      <Modal
        isOpen={modalPedidoOpen}
        onClose={() => setModalPedidoOpen(false)}
        title="Crear Nuevo Pedido / Cotización"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleGuardarPedido} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cliente */}
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Cliente *
              </label>
              <select
                required
                value={formPedido.cliente_id}
                onChange={(e) =>
                  setFormPedido({ ...formPedido, cliente_id: Number(e.target.value) })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.whatsapp || c.telefono || "Sin teléfono"})
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de Entrega */}
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Fecha Prometida de Entrega
              </label>
              <input
                type="date"
                value={formPedido.fecha_entrega}
                onChange={(e) =>
                  setFormPedido({ ...formPedido, fecha_entrega: e.target.value })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>

            {/* Tipo de Entrega */}
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Tipo de Entrega
              </label>
              <select
                value={formPedido.tipo_entrega}
                onChange={(e) =>
                  setFormPedido({ ...formPedido, tipo_entrega: e.target.value })
                }
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                <option value="retiro_local">Retiro en Taller (Local)</option>
                <option value="domicilio">Delivery Managua</option>
                <option value="envio">Envío a Departamentos</option>
              </select>
            </div>

            {/* Dirección de Entrega */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Dirección o Punto de Referencia
              </label>
              <input
                type="text"
                value={formPedido.direccion_entrega}
                onChange={(e) =>
                  setFormPedido({ ...formPedido, direccion_entrega: e.target.value })
                }
                placeholder="Barrio, número de casa, referencias para el motorizado..."
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
          </div>

          {/* Líneas del Pedido */}
          <div className="bg-crema/40 p-4 rounded-artesanal border border-kraft/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-chocolate">
                Productos y Piezas a Medida
              </span>
              <button
                type="button"
                onClick={agregarLineaDetalle}
                className="text-xs font-bold text-borgona hover:text-borgona-dark bg-rosa-pastel/60 px-3 py-1 rounded-lg"
              >
                + Agregar Línea
              </button>
            </div>

            <div className="space-y-3">
              {formPedido.detalles.map((d, idx) => (
                <div
                  key={idx}
                  className="bg-marfil p-3 rounded-lg border border-kraft/60 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={d.producto_id || ""}
                      onChange={(e) =>
                        actualizarLinea(
                          idx,
                          "producto_id",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="flex-1 bg-crema/40 border border-kraft rounded px-2 py-1.5 font-medium text-chocolate outline-none"
                    >
                      <option value="">Pieza 100% a medida (Personalizada)</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({formatCordoba(p.precio_venta)})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={d.cantidad}
                      onChange={(e) =>
                        actualizarLinea(idx, "cantidad", parseInt(e.target.value, 10) || 1)
                      }
                      placeholder="Cant"
                      className="w-16 bg-crema/40 border border-kraft rounded px-2 py-1.5 text-right text-chocolate"
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={d.precio_unitario}
                      onChange={(e) =>
                        actualizarLinea(
                          idx,
                          "precio_unitario",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Precio C$"
                      className="w-24 bg-crema/40 border border-kraft rounded px-2 py-1.5 text-right text-chocolate"
                    />

                    <span className="w-24 text-right font-bold text-borgona">
                      {formatCordoba(d.cantidad * d.precio_unitario)}
                    </span>

                    <button
                      type="button"
                      onClick={() => quitarLineaDetalle(idx)}
                      className="text-estado-error p-1 hover:bg-rosa-soft rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={d.descripcion}
                      onChange={(e) => actualizarLinea(idx, "descripcion", e.target.value)}
                      placeholder="Descripción de la pieza..."
                      className="bg-crema/20 border border-kraft/60 rounded px-2 py-1 text-chocolate"
                    />
                    <input
                      type="text"
                      value={d.personalizacion}
                      onChange={(e) =>
                        actualizarLinea(idx, "personalizacion", e.target.value)
                      }
                      placeholder="Personalización: Colores, nombre, dedicatoria..."
                      className="bg-crema/20 border border-kraft/60 rounded px-2 py-1 text-chocolate"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Costos de envío y descuento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-kraft/40 text-xs">
              <div>
                <label className="text-cacao block mb-1">Costo de Envío (C$):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPedido.costo_envio}
                  onChange={(e) =>
                    setFormPedido({
                      ...formPedido,
                      costo_envio: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-marfil border border-kraft rounded px-2 py-1 text-chocolate"
                />
              </div>

              <div>
                <label className="text-cacao block mb-1">Descuento (C$):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPedido.descuento}
                  onChange={(e) =>
                    setFormPedido({
                      ...formPedido,
                      descuento: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-marfil border border-kraft rounded px-2 py-1 text-chocolate"
                />
              </div>

              <div className="col-span-2 flex flex-col justify-end text-right">
                <span className="text-cacao text-xs">TOTAL DEL PEDIDO:</span>
                <strong className="text-xl font-serif text-borgona">
                  {formatCordoba(totalPedidoCalculado)}
                </strong>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Notas Adicionales
            </label>
            <textarea
              rows={2}
              value={formPedido.notas}
              onChange={(e) => setFormPedido({ ...formPedido, notas: e.target.value })}
              placeholder="Instrucciones especiales de elaboración o empaque..."
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalPedidoOpen(false)}
              className="px-4 py-2 border border-kraft rounded-lg text-sm font-semibold text-chocolate hover:bg-crema"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingPedido}
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-6 py-2 rounded-lg text-sm shadow-sm"
            >
              {submittingPedido ? "Creando..." : "Crear Pedido"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Registrar Pago / Abono */}
      <Modal
        isOpen={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        title={`Registrar Pago: Pedido #${pedidoParaPago?.id}`}
      >
        <form onSubmit={handleRegistrarPago} className="space-y-4">
          <div className="bg-crema/50 p-3 rounded-lg border border-kraft/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-cacao block">Cliente:</span>
              <strong className="text-chocolate">{pedidoParaPago?.cliente?.nombre}</strong>
            </div>
            <div className="text-right">
              <span className="text-cacao block">Saldo Pendiente:</span>
              <strong className="text-estado-error font-serif text-sm">
                {formatCordoba(pedidoParaPago?.saldo_pendiente)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate uppercase mb-1">
              Monto del Pago (C$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={formPago.monto}
              onChange={(e) =>
                setFormPago({ ...formPago, monto: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Método de Pago
              </label>
              <select
                value={formPago.metodo}
                onChange={(e) => setFormPago({ ...formPago, metodo: e.target.value })}
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria (BAC, Banpro, Lafise)</option>
                <option value="billetera_movil">Billetera Móvil</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase mb-1">
                Nº Referencia
              </label>
              <input
                type="text"
                value={formPago.referencia}
                onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
                placeholder="Nº de transferencia o recibo..."
                className="w-full bg-crema/40 border border-kraft rounded-lg px-3 py-2 text-sm text-chocolate focus:ring-2 focus:ring-borgona outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-chocolate">
            <input
              type="checkbox"
              checked={formPago.es_anticipo}
              onChange={(e) => setFormPago({ ...formPago, es_anticipo: e.target.checked })}
              className="rounded text-borgona focus:ring-borgona"
            />
            <span>Marcar como anticipo para iniciar producción</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-kraft/60">
            <button
              type="button"
              onClick={() => setModalPagoOpen(false)}
              className="px-4 py-2 border border-kraft rounded-lg text-sm font-semibold text-chocolate hover:bg-crema"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-borgona hover:bg-borgona-dark text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm"
            >
              Guardar Pago
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalle de Pedido */}
      <Modal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        title={`Detalle de Pedido #${pedidoSeleccionado?.id}`}
        maxWidth="max-w-3xl"
      >
        {pedidoSeleccionado && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-crema/50 p-4 rounded-lg border border-kraft/60 text-xs">
              <div>
                <span className="text-cacao block">Cliente:</span>
                <strong className="text-chocolate text-sm">
                  {pedidoSeleccionado.cliente?.nombre}
                </strong>
                {pedidoSeleccionado.cliente?.whatsapp && (
                  <p className="text-cacao mt-1">WhatsApp: {pedidoSeleccionado.cliente.whatsapp}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-cacao block">Estado:</span>
                <Badge variant={pedidoSeleccionado.estado as any}>
                  {pedidoSeleccionado.estado}
                </Badge>
                <p className="text-cacao mt-1">
                  Entrega: {formatDate(pedidoSeleccionado.fecha_entrega)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-chocolate text-xs uppercase mb-2">
                Productos / Líneas del Pedido
              </h4>
              <div className="divide-y divide-kraft/40 border border-kraft/60 rounded-lg overflow-hidden">
                {pedidoSeleccionado.detalles?.map((d: any, idx: number) => (
                  <div key={idx} className="p-3 bg-marfil flex justify-between items-start text-xs">
                    <div>
                      <strong className="text-chocolate block">{d.cantidad}x {d.descripcion}</strong>
                      {d.personalizacion && (
                        <p className="text-cacao italic mt-0.5">
                          Personalización: {d.personalizacion}
                        </p>
                      )}
                    </div>
                    <div className="font-bold text-borgona">
                      {formatCordoba(d.cantidad * d.precio_unitario)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-kraft/60">
              <button
                onClick={() => handleImprimir(pedidoSeleccionado.id)}
                className="flex items-center gap-2 bg-kraft hover:bg-kraft/80 text-chocolate font-semibold px-4 py-2 rounded-lg text-xs"
              >
                <Printer className="w-4 h-4" />
                Imprimir Comprobante PDF
              </button>
              <div className="text-right space-y-1">
                <div>
                  <span className="text-cacao text-xs mr-2">Total:</span>
                  <strong className="font-serif text-borgona text-base">
                    {formatCordoba(pedidoSeleccionado.total)}
                  </strong>
                </div>
                <div className="text-xs text-estado-error font-semibold">
                  Saldo: {formatCordoba(pedidoSeleccionado.saldo_pendiente)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


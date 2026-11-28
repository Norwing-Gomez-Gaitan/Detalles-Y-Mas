/**
 * ExportService — Detalles y Más
 * Genera archivos Excel (.xlsx), PDF descargables y CSV con BOM UTF-8
 * para todos los módulos del sistema de Detalles y Más (Nicaragua).
 */
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

// ─── Paleta artesanal ──────────────────────────────────────────────────────
const COLORS = {
  borgona:       '8E2A45',
  dorado:        'C9A24D',
  chocolate:     '4A2C2A',
  crema:         'FBF4E8',
  kraft:         'D9C3A0',
  blanco:        'FFFFFF',
  grisClaro:     'F5F5F5',
  grisLinea:     'E0D5C5',
  verdeEstado:   '5F7A4F',
  rojoEstado:    'B3261E',
  naranjaEstado: 'D4912F',
};

// ─── Helpers de fecha / moneda ─────────────────────────────────────────────
function fmtFecha(val: any): string {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtMoneda(n: number): string {
  return `C$ ${Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Mapa legible de estados ───────────────────────────────────────────────
const ESTADO_PEDIDO: Record<string, string> = {
  cotizacion: 'Cotización', confirmado: 'Confirmado',
  en_produccion: 'En Producción', listo: 'Listo', entregado: 'Entregado', cancelado: 'Cancelado',
};
const TIPO_ENTREGA: Record<string, string> = {
  retiro_local: 'Retiro en Taller', domicilio: 'Envío a Domicilio', envio: 'Envío',
};
const TIPO_GASTO: Record<string, string> = {
  transporte: 'Transporte', empaque: 'Empaque', publicidad: 'Publicidad',
  servicios: 'Servicios', herramientas: 'Herramientas', otro: 'Otro',
};

// ─── Configurar libro y hoja base Excel ───────────────────────────────────
function crearLibro(titulo: string, subtitulo?: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Detalles y Más';
  wb.created = new Date();
  wb.properties.date1904 = false;

  const ws = wb.addWorksheet(titulo.substring(0, 31), {
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' },
  });

  // Fila 1 — Nombre del negocio
  ws.mergeCells('A1:L1');
  const r1 = ws.getRow(1);
  r1.getCell(1).value = 'DETALLES Y MÁS — Taller Artesanal | Nicaragua';
  r1.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.blanco } };
  r1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.borgona } };
  r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r1.height = 28;

  // Fila 2 — Título del reporte
  ws.mergeCells('A2:L2');
  const r2 = ws.getRow(2);
  r2.getCell(1).value = titulo.toUpperCase();
  r2.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.chocolate } };
  r2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.crema } };
  r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r2.height = 22;

  // Fila 3 — Fecha/hora + subtítulo opcional
  ws.mergeCells('A3:L3');
  const r3 = ws.getRow(3);
  const ahora = new Date();
  r3.getCell(1).value = `Generado: ${fmtFecha(ahora)} ${ahora.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}${subtitulo ? ' — ' + subtitulo : ''}`;
  r3.getCell(1).font = { italic: true, size: 9, color: { argb: '888888' } };
  r3.getCell(1).alignment = { horizontal: 'center' };
  r3.height = 16;

  // Fila 4 — espaciado
  ws.getRow(4).height = 6;

  return { wb, ws };
}

function aplicarEncabezado(ws: ExcelJS.Worksheet, fila: number, columnas: string[]) {
  const row = ws.getRow(fila);
  columnas.forEach((col, i) => {
    const cell = row.getCell(i + 1);
    cell.value = col;
    cell.font = { bold: true, size: 10, color: { argb: COLORS.blanco } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.chocolate } };
    cell.border = {
      bottom: { style: 'medium', color: { argb: COLORS.dorado } },
      right: { style: 'thin', color: { argb: COLORS.kraft } },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
  });
  row.height = 20;
  ws.autoFilter = { from: { row: fila, column: 1 }, to: { row: fila, column: columnas.length } };
  ws.views = [{ state: 'frozen', ySplit: fila }];
}

function estiloFila(row: ExcelJS.Row, numCols: number, esImpar: boolean) {
  for (let i = 1; i <= numCols; i++) {
    const cell = row.getCell(i);
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: esImpar ? COLORS.blanco : 'FAF3E8' },
    };
    cell.border = {
      bottom: { style: 'hair', color: { argb: COLORS.grisLinea } },
      right: { style: 'hair', color: { argb: COLORS.grisLinea } },
    };
    if (!cell.alignment) cell.alignment = { vertical: 'middle' };
  }
  row.height = 17;
}

function agregarFilaTotales(ws: ExcelJS.Worksheet, numCols: number, valores: (string | number | null)[]) {
  ws.addRow([]);
  const row = ws.addRow(valores);
  row.height = 18;
  for (let i = 1; i <= numCols; i++) {
    const cell = row.getCell(i);
    cell.font = { bold: true, size: 10, color: { argb: COLORS.blanco } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.borgona } };
    cell.border = { top: { style: 'medium', color: { argb: COLORS.dorado } } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
}

function ajustarColumnas(ws: ExcelJS.Worksheet, anchos: number[]) {
  anchos.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

async function enviarExcel(wb: ExcelJS.Workbook, res: Response, filename: string) {
  const fecha = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}_${fecha}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

function enviarCsv(res: Response, csv: string, filename: string) {
  const fecha = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}_${fecha}.csv"`);
  res.send('\uFEFF' + csv);
}

// ─── Generador PDF Universal con PDFKit ────────────────────────────────────
export function generarPdfTable(options: {
  titulo: string;
  subtitulo?: string;
  columnas: { header: string; width: number; align?: 'left' | 'center' | 'right' }[];
  filas: (string | number)[][];
  totales?: (string | number | null)[];
  filename: string;
  res: Response;
}) {
  const { titulo, subtitulo, columnas, filas, totales, filename, res } = options;
  const fecha = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}_${fecha}.pdf"`);

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 30,
    bufferPages: true,
  });

  doc.pipe(res);

  const totalWidth = columnas.reduce((sum, c) => sum + c.width, 0);
  const startX = 30;
  let currentY = 30;

  const renderHeader = () => {
    // Banner superior Borgoña
    doc.rect(startX, currentY, totalWidth, 26).fill('#8E2A45');
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold');
    doc.text('DETALLES Y MÁS — TALLER ARTESANAL | NICARAGUA', startX, currentY + 7, {
      width: totalWidth,
      align: 'center',
    });
    currentY += 28;

    // Sub-banner Título del Reporte
    doc.rect(startX, currentY, totalWidth, 20).fill('#FBF4E8');
    doc.fillColor('#4A2C2A').fontSize(10).font('Helvetica-Bold');
    doc.text(titulo.toUpperCase(), startX, currentY + 5, {
      width: totalWidth,
      align: 'center',
    });
    currentY += 22;

    // Metadatos
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = ahora.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
    doc.fillColor('#6B544C').fontSize(8).font('Helvetica-Oblique');
    doc.text(`Fecha de emisión: ${fechaStr} a las ${horaStr} | Moneda: Córdobas (C$)${subtitulo ? ` | ${subtitulo}` : ''}`, startX, currentY, {
      width: totalWidth,
      align: 'center',
    });
    currentY += 14;

    // Encabezado de columnas
    doc.rect(startX, currentY, totalWidth, 18).fill('#4A2C2A');
    let colX = startX;
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    columnas.forEach(col => {
      doc.text(col.header, colX + 3, currentY + 5, {
        width: col.width - 6,
        align: col.align || 'left',
        ellipsis: true,
      });
      colX += col.width;
    });
    // Acento dorado
    doc.rect(startX, currentY + 18, totalWidth, 2).fill('#C9A24D');
    currentY += 20;
  };

  renderHeader();

  // Renderizar filas
  filas.forEach((fila, rowIdx) => {
    if (currentY > 525) {
      doc.addPage();
      currentY = 30;
      renderHeader();
    }

    const rowHeight = 16;
    const bgColorFila = rowIdx % 2 === 0 ? '#FFFFFF' : '#FAF3E8';
    doc.rect(startX, currentY, totalWidth, rowHeight).fill(bgColorFila);

    doc.strokeColor('#EADDC7').lineWidth(0.5);
    doc.moveTo(startX, currentY + rowHeight).lineTo(startX + totalWidth, currentY + rowHeight).stroke();

    let colX = startX;
    doc.fillColor('#331E1D').fontSize(7.5).font('Helvetica');
    fila.forEach((val, colIdx) => {
      const col = columnas[colIdx];
      const strVal = String(val ?? '');
      doc.text(strVal, colX + 3, currentY + 4, {
        width: col.width - 6,
        align: col.align || 'left',
        ellipsis: true,
      });
      colX += col.width;
    });

    currentY += rowHeight;
  });

  // Fila de totales
  if (totales && totales.length > 0) {
    if (currentY > 520) {
      doc.addPage();
      currentY = 30;
      renderHeader();
    }
    const totHeight = 20;
    doc.rect(startX, currentY, totalWidth, totHeight).fill('#8E2A45');
    doc.rect(startX, currentY, totalWidth, 1.5).fill('#C9A24D');

    let colX = startX;
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    totales.forEach((totVal, colIdx) => {
      const col = columnas[colIdx];
      if (totVal !== null && totVal !== undefined && totVal !== '') {
        doc.text(String(totVal), colX + 3, currentY + 6, {
          width: col.width - 6,
          align: col.align || 'center',
          ellipsis: true,
        });
      }
      colX += col.width;
    });
    currentY += totHeight;
  }

  // Numeración de páginas
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#888888').fontSize(7.5).font('Helvetica');
    doc.text(
      `Página ${i + 1} de ${pages.count} — Documento Oficial generado por Sistema Detalles y Más`,
      startX,
      565,
      { width: totalWidth, align: 'center' }
    );
  }

  doc.end();
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTADORES POR MÓDULO (XLSX, CSV, PDF)
// ════════════════════════════════════════════════════════════════════════════

// ─── 1. PEDIDOS ────────────────────────────────────────────────────────────
export async function exportarPedidosXlsx(pedidos: any[], res: Response) {
  const { wb, ws } = crearLibro('Reporte de Pedidos', `Total: ${pedidos.length} registros`);
  const COLS = ['N° Pedido', 'Cliente', 'WhatsApp', 'Fecha Pedido', 'Fecha Entrega', 'Tipo Entrega', 'Dirección', 'Estado', 'Estado Pago', 'Subtotal (C$)', 'Envío (C$)', 'Descuento (C$)', 'Total (C$)', 'Pagado (C$)', 'Saldo (C$)', 'Artículos', 'Notas'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [10, 22, 16, 13, 13, 18, 22, 14, 14, 13, 10, 12, 13, 13, 13, 30, 25]);

  let acumTotal = 0, acumPagado = 0;
  pedidos.forEach((p, idx) => {
    const total = Number(p.total);
    const pagado = (p.pagos || []).reduce((s: number, pg: any) => s + Number(pg.monto), 0);
    const saldo = Math.max(0, total - pagado);
    const subtotal = (p.detalles || []).reduce((s: number, d: any) => s + (Number(d.subtotal) || Number(d.cantidad) * Number(d.precio_unitario)), 0);
    acumTotal += total; acumPagado += pagado;
    const estadoPago = saldo <= 0.01 ? 'PAGADO' : pagado > 0 ? 'ABONO PARCIAL' : 'PENDIENTE';
    const articulos = (p.detalles || []).map((d: any) => `${d.cantidad}x ${d.producto?.nombre || d.descripcion || 'Personalizado'}`).join('; ');
    const row = ws.addRow([
      `#${String(p.id).padStart(4, '0')}`, p.cliente?.nombre || '—', p.cliente?.whatsapp || '—',
      fmtFecha(p.fecha_pedido), fmtFecha(p.fecha_entrega),
      TIPO_ENTREGA[p.tipo_entrega] || p.tipo_entrega, p.direccion_entrega || '—',
      ESTADO_PEDIDO[p.estado] || p.estado, estadoPago,
      subtotal, Number(p.costo_envio), Number(p.descuento), total, pagado, saldo,
      articulos, p.notas || '',
    ]);
    estiloFila(row, COLS.length, idx % 2 === 0);
    for (let c = 10; c <= 15; c++) row.getCell(c).numFmt = '"C$"#,##0.00';
    if (saldo > 0.01) row.getCell(15).font = { color: { argb: COLORS.rojoEstado }, bold: true };
  });
  agregarFilaTotales(ws, COLS.length, ['', 'TOTALES', '', '', '', '', '', '', '', '', '', '', fmtMoneda(acumTotal), fmtMoneda(acumPagado), fmtMoneda(acumTotal - acumPagado), '', '']);
  await enviarExcel(wb, res, 'Pedidos_DetallesYMas');
}

export function exportarPedidosCsv(pedidos: any[], res: Response) {
  const H = ['N° Pedido', 'Cliente', 'WhatsApp', 'Fecha Pedido', 'Fecha Entrega', 'Tipo Entrega', 'Estado', 'Estado Pago', 'Total (C$)', 'Pagado (C$)', 'Saldo (C$)', 'Artículos', 'Notas'];
  const filas = pedidos.map(p => {
    const total = Number(p.total);
    const pagado = (p.pagos || []).reduce((s: number, pg: any) => s + Number(pg.monto), 0);
    const saldo = Math.max(0, total - pagado);
    const estadoPago = saldo <= 0.01 ? 'PAGADO' : pagado > 0 ? 'ABONO PARCIAL' : 'PENDIENTE';
    const articulos = (p.detalles || []).map((d: any) => `${d.cantidad}x ${d.descripcion || d.producto?.nombre}`).join('; ');
    return [`#${String(p.id).padStart(4, '0')}`, p.cliente?.nombre, p.cliente?.whatsapp || '', fmtFecha(p.fecha_pedido), fmtFecha(p.fecha_entrega), TIPO_ENTREGA[p.tipo_entrega] || p.tipo_entrega, ESTADO_PEDIDO[p.estado] || p.estado, estadoPago, total.toFixed(2), pagado.toFixed(2), saldo.toFixed(2), articulos, p.notas || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  });
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Pedidos_DetallesYMas');
}

export function exportarPedidosPdf(pedidos: any[], res: Response) {
  const columnas = [
    { header: 'N° Pedido', width: 55, align: 'center' as const },
    { header: 'Cliente', width: 120, align: 'left' as const },
    { header: 'WhatsApp', width: 75, align: 'center' as const },
    { header: 'Fecha Ped.', width: 65, align: 'center' as const },
    { header: 'Entrega', width: 65, align: 'center' as const },
    { header: 'Estado', width: 75, align: 'center' as const },
    { header: 'Estado Pago', width: 75, align: 'center' as const },
    { header: 'Total (C$)', width: 80, align: 'right' as const },
    { header: 'Pagado (C$)', width: 80, align: 'right' as const },
    { header: 'Saldo (C$)', width: 85, align: 'right' as const },
  ];
  let acumTotal = 0, acumPagado = 0;
  const filas = pedidos.map(p => {
    const total = Number(p.total);
    const pagado = (p.pagos || []).reduce((s: number, pg: any) => s + Number(pg.monto), 0);
    const saldo = Math.max(0, total - pagado);
    acumTotal += total; acumPagado += pagado;
    const estadoPago = saldo <= 0.01 ? 'PAGADO' : pagado > 0 ? 'ABONO PARCIAL' : 'PENDIENTE';
    return [
      `#${String(p.id).padStart(4, '0')}`,
      p.cliente?.nombre || '—',
      p.cliente?.whatsapp || p.cliente?.telefono || '—',
      fmtFecha(p.fecha_pedido),
      fmtFecha(p.fecha_entrega),
      ESTADO_PEDIDO[p.estado] || p.estado,
      estadoPago,
      fmtMoneda(total),
      fmtMoneda(pagado),
      fmtMoneda(saldo),
    ];
  });
  const totales = ['', 'TOTALES', '', '', '', '', '', fmtMoneda(acumTotal), fmtMoneda(acumPagado), fmtMoneda(acumTotal - acumPagado)];
  generarPdfTable({
    titulo: 'Reporte Oficial de Pedidos',
    subtitulo: `Total: ${pedidos.length} registros`,
    columnas,
    filas,
    totales,
    filename: 'Pedidos_DetallesYMas',
    res,
  });
}

// ─── 2. CLIENTES ───────────────────────────────────────────────────────────
export async function exportarClientesXlsx(clientes: any[], res: Response) {
  const { wb, ws } = crearLibro('Directorio de Clientes', `Total: ${clientes.length} clientes`);
  const COLS = ['ID', 'Nombre Completo', 'Teléfono', 'WhatsApp', 'Email', 'Dirección', 'Red Social', 'Fecha Especial', 'N° Pedidos', 'Total Comprado (C$)', 'Notas'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 25, 15, 15, 24, 25, 18, 14, 10, 16, 28]);
  let acumTotal = 0;
  clientes.forEach((c, idx) => {
    const totalComprado = (c.pedidos || []).reduce((s: number, p: any) => s + Number(p.total), 0);
    acumTotal += totalComprado;
    const row = ws.addRow([c.id, c.nombre, c.telefono || '—', c.whatsapp || '—', c.email || '—', c.direccion || '—', c.red_social || '—', fmtFecha(c.fecha_especial), c._count?.pedidos ?? 0, totalComprado, c.notas || '']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    row.getCell(10).numFmt = '"C$"#,##0.00';
  });
  agregarFilaTotales(ws, COLS.length, ['', 'TOTALES', '', '', '', '', '', '', clientes.length, fmtMoneda(acumTotal), '']);
  await enviarExcel(wb, res, 'Clientes_DetallesYMas');
}

export function exportarClientesCsv(clientes: any[], res: Response) {
  const H = ['ID', 'Nombre', 'Teléfono', 'WhatsApp', 'Email', 'Dirección', 'N° Pedidos', 'Total Comprado (C$)', 'Fecha Especial', 'Notas'];
  const filas = clientes.map(c => {
    const total = (c.pedidos || []).reduce((s: number, p: any) => s + Number(p.total), 0);
    return [c.id, c.nombre, c.telefono || '', c.whatsapp || '', c.email || '', c.direccion || '', c._count?.pedidos ?? 0, total.toFixed(2), fmtFecha(c.fecha_especial), c.notas || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  });
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Clientes_DetallesYMas');
}

export function exportarClientesPdf(clientes: any[], res: Response) {
  const columnas = [
    { header: 'ID', width: 35, align: 'center' as const },
    { header: 'Nombre Completo', width: 170, align: 'left' as const },
    { header: 'Teléfono', width: 85, align: 'center' as const },
    { header: 'WhatsApp', width: 85, align: 'center' as const },
    { header: 'Dirección', width: 155, align: 'left' as const },
    { header: 'Pedidos', width: 55, align: 'center' as const },
    { header: 'Total Comprado (C$)', width: 105, align: 'right' as const },
    { header: 'Fecha Especial', width: 85, align: 'center' as const },
  ];
  let acumTotal = 0;
  const filas = clientes.map(c => {
    const total = (c.pedidos || []).reduce((s: number, p: any) => s + Number(p.total), 0);
    acumTotal += total;
    return [
      `#${c.id}`,
      c.nombre,
      c.telefono || '—',
      c.whatsapp || '—',
      c.direccion || '—',
      c._count?.pedidos ?? 0,
      fmtMoneda(total),
      fmtFecha(c.fecha_especial),
    ];
  });
  generarPdfTable({
    titulo: 'Directorio de Clientes',
    subtitulo: `Total: ${clientes.length} clientes registrados`,
    columnas,
    filas,
    totales: ['', 'TOTALES', '', '', '', clientes.length, fmtMoneda(acumTotal), ''],
    filename: 'Clientes_DetallesYMas',
    res,
  });
}

// ─── 3. PRODUCTOS ──────────────────────────────────────────────────────────
export async function exportarProductosXlsx(productos: any[], res: Response) {
  const { wb, ws } = crearLibro('Catálogo de Productos', `Total: ${productos.length} productos`);
  const COLS = ['ID', 'Código', 'Nombre', 'Categoría', 'Precio Venta (C$)', 'Costo Mat. (C$)', 'Ganancia Est. (C$)', 'Margen %', 'Stock', 'Personalizable', 'Visible Catálogo', 'Destacado', 'Activo'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 12, 28, 18, 14, 14, 15, 10, 8, 13, 14, 10, 8]);
  productos.forEach((p, idx) => {
    const row = ws.addRow([p.id, p.codigo, p.nombre, p.categoria?.nombre || '—', Number(p.precio_venta), Number(p.costo_materiales || 0), Number(p.ganancia_estimada || 0), Number(p.margen_pct || 0), Number(p.stock_terminado), p.es_personalizable ? 'Sí' : 'No', p.visible_catalogo ? 'Sí' : 'No', p.destacado ? 'Sí' : 'No', p.activo ? 'Activo' : 'Inactivo']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    [5, 6, 7].forEach(c => { row.getCell(c).numFmt = '"C$"#,##0.00'; });
    row.getCell(8).numFmt = '0.0"%"';
    if (Number(p.ganancia_estimada) < 0) row.getCell(7).font = { color: { argb: COLORS.rojoEstado }, bold: true };
    if (!p.activo) row.getCell(13).font = { color: { argb: COLORS.rojoEstado } };
  });
  await enviarExcel(wb, res, 'Productos_DetallesYMas');
}

export function exportarProductosCsv(productos: any[], res: Response) {
  const H = ['ID', 'Código', 'Nombre', 'Categoría', 'Precio Venta (C$)', 'Costo Material (C$)', 'Ganancia Est. (C$)', 'Margen %', 'Stock', 'Personalizable', 'Activo'];
  const filas = productos.map(p => [p.id, p.codigo, p.nombre, p.categoria?.nombre || '', Number(p.precio_venta).toFixed(2), Number(p.costo_materiales || 0).toFixed(2), Number(p.ganancia_estimada || 0).toFixed(2), Number(p.margen_pct || 0).toFixed(1), p.stock_terminado, p.es_personalizable ? 'Sí' : 'No', p.activo ? 'Activo' : 'Inactivo'].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Productos_DetallesYMas');
}

export function exportarProductosPdf(productos: any[], res: Response) {
  const columnas = [
    { header: 'ID', width: 35, align: 'center' as const },
    { header: 'Código', width: 65, align: 'center' as const },
    { header: 'Nombre del Producto', width: 200, align: 'left' as const },
    { header: 'Categoría', width: 105, align: 'left' as const },
    { header: 'Precio (C$)', width: 85, align: 'right' as const },
    { header: 'Costo Mat. (C$)', width: 90, align: 'right' as const },
    { header: 'Margen %', width: 65, align: 'center' as const },
    { header: 'Stock', width: 55, align: 'center' as const },
    { header: 'Estado', width: 75, align: 'center' as const },
  ];
  const filas = productos.map(p => [
    `#${p.id}`,
    p.codigo,
    p.nombre,
    p.categoria?.nombre || '—',
    fmtMoneda(Number(p.precio_venta)),
    fmtMoneda(Number(p.costo_materiales || 0)),
    `${Number(p.margen_pct || 0).toFixed(1)}%`,
    p.stock_terminado,
    p.activo ? 'Activo' : 'Inactivo',
  ]);
  generarPdfTable({
    titulo: 'Catálogo de Productos y Precios',
    subtitulo: `Total: ${productos.length} productos`,
    columnas,
    filas,
    filename: 'Productos_DetallesYMas',
    res,
  });
}

// ─── 4. CATEGORÍAS ─────────────────────────────────────────────────────────
export async function exportarCategoriasXlsx(categorias: any[], res: Response) {
  const { wb, ws } = crearLibro('Categorías de Productos', `Total: ${categorias.length} categorías`);
  const COLS = ['ID', 'Nombre', 'Descripción', 'N° Productos', 'Estado'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 25, 40, 12, 12]);
  categorias.forEach((cat, idx) => {
    const row = ws.addRow([cat.id, cat.nombre, cat.descripcion || '—', cat._count?.productos ?? 0, cat.activa ? 'Activa' : 'Inactiva']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    if (!cat.activa) row.getCell(5).font = { color: { argb: COLORS.rojoEstado } };
  });
  await enviarExcel(wb, res, 'Categorias_DetallesYMas');
}

export function exportarCategoriasCsv(categorias: any[], res: Response) {
  const H = ['ID', 'Nombre', 'Descripción', 'N° Productos', 'Estado'];
  const filas = categorias.map(cat => [cat.id, cat.nombre, cat.descripcion || '', cat._count?.productos ?? 0, cat.activa ? 'Activa' : 'Inactiva'].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Categorias_DetallesYMas');
}

export function exportarCategoriasPdf(categorias: any[], res: Response) {
  const columnas = [
    { header: 'ID', width: 45, align: 'center' as const },
    { header: 'Nombre de Categoría', width: 190, align: 'left' as const },
    { header: 'Descripción', width: 340, align: 'left' as const },
    { header: 'N° Productos', width: 100, align: 'center' as const },
    { header: 'Estado', width: 90, align: 'center' as const },
  ];
  const filas = categorias.map(c => [
    `#${c.id}`,
    c.nombre,
    c.descripcion || '—',
    c._count?.productos ?? 0,
    c.activa ? 'Activa' : 'Inactiva',
  ]);
  generarPdfTable({
    titulo: 'Listado de Categorías',
    subtitulo: `Total: ${categorias.length} categorías`,
    columnas,
    filas,
    filename: 'Categorias_DetallesYMas',
    res,
  });
}

// ─── 5. INVENTARIO / MATERIALES ────────────────────────────────────────────
export async function exportarMaterialesXlsx(materiales: any[], res: Response) {
  const { wb, ws } = crearLibro('Inventario y Materiales', `Total: ${materiales.length} materiales`);
  const COLS = ['ID', 'Material', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Faltante', 'Costo Unit. (C$)', 'Valor en Stock (C$)', 'Proveedor', 'Estado Stock', 'Sistema'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 28, 10, 12, 12, 10, 14, 16, 25, 18, 10]);
  let valorTotal = 0;
  materiales.forEach((m, idx) => {
    const actual = Number(m.stock_actual), min = Number(m.stock_minimo), costo = Number(m.costo_unitario);
    const valor = actual * costo;
    valorTotal += valor;
    const esBajo = actual <= min;
    const row = ws.addRow([m.id, m.nombre, m.unidad_medida, actual, min, Math.max(0, min - actual), costo, valor, m.proveedor?.nombre || '—', esBajo ? 'REPONER' : 'NORMAL', m.activo ? 'Activo' : 'Inactivo']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    [7, 8].forEach(c => { row.getCell(c).numFmt = '"C$"#,##0.00'; });
    if (esBajo) {
      row.getCell(4).font = { color: { argb: COLORS.rojoEstado }, bold: true };
      row.getCell(10).font = { color: { argb: COLORS.rojoEstado }, bold: true };
    }
  });
  agregarFilaTotales(ws, COLS.length, ['', 'VALOR TOTAL INVENTARIO', '', '', '', '', '', fmtMoneda(valorTotal), '', '', '']);
  await enviarExcel(wb, res, 'Inventario_DetallesYMas');
}

export function exportarMaterialesCsv(materiales: any[], res: Response) {
  const H = ['ID', 'Material', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Faltante', 'Costo Unit. (C$)', 'Valor en Stock (C$)', 'Proveedor', 'Estado', 'Sistema'];
  const filas = materiales.map(m => {
    const actual = Number(m.stock_actual), min = Number(m.stock_minimo), costo = Number(m.costo_unitario);
    return [m.id, m.nombre, m.unidad_medida, actual, min, Math.max(0, min - actual), costo.toFixed(2), (actual * costo).toFixed(2), m.proveedor?.nombre || '', actual <= min ? 'REPONER' : 'NORMAL', m.activo ? 'Activo' : 'Inactivo'].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  });
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Inventario_DetallesYMas');
}

export function exportarMaterialesPdf(materiales: any[], res: Response) {
  const columnas = [
    { header: 'ID', width: 35, align: 'center' as const },
    { header: 'Material / Insumo', width: 175, align: 'left' as const },
    { header: 'Unidad', width: 55, align: 'center' as const },
    { header: 'Stock Actual', width: 70, align: 'center' as const },
    { header: 'Mínimo', width: 65, align: 'center' as const },
    { header: 'Faltante', width: 65, align: 'center' as const },
    { header: 'Costo Unit. (C$)', width: 85, align: 'right' as const },
    { header: 'Valor Total (C$)', width: 95, align: 'right' as const },
    { header: 'Proveedor Principal', width: 125, align: 'left' as const },
  ];
  let valorTotal = 0;
  const filas = materiales.map(m => {
    const actual = Number(m.stock_actual), min = Number(m.stock_minimo), costo = Number(m.costo_unitario);
    const valor = actual * costo;
    valorTotal += valor;
    const esBajo = actual <= min;
    return [
      `#${m.id}`,
      m.nombre,
      m.unidad_medida,
      `${actual} ${m.unidad_medida}`,
      `${min} ${m.unidad_medida}`,
      esBajo ? `-${min - actual}` : '0',
      fmtMoneda(costo),
      fmtMoneda(valor),
      m.proveedor?.nombre || '—',
    ];
  });
  generarPdfTable({
    titulo: 'Reporte de Inventario y Existencias',
    subtitulo: `Total: ${materiales.length} materiales valorizados`,
    columnas,
    filas,
    totales: ['', 'TOTAL VALORIZADO', '', '', '', '', '', fmtMoneda(valorTotal), ''],
    filename: 'Inventario_DetallesYMas',
    res,
  });
}

// ─── 6. MOVIMIENTOS DE INVENTARIO (KARDEX) ─────────────────────────────────
export async function exportarMovimientosXlsx(movimientos: any[], res: Response) {
  const { wb, ws } = crearLibro('Movimientos de Inventario (Kardex)', `Total: ${movimientos.length} movimientos`);
  const COLS = ['ID', 'Fecha', 'Material', 'Unidad', 'Tipo Movimiento', 'Cantidad', 'Referencia', 'Notas'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 13, 28, 10, 20, 10, 20, 30]);
  const tipoMov: Record<string, string> = { ajuste: 'Ajuste Manual', merma: 'Merma / Pérdida', consumo_produccion: 'Consumo Producción', devolucion: 'Devolución a Stock', compra: 'Entrada por Compra' };
  movimientos.forEach((mov, idx) => {
    const row = ws.addRow([mov.id, fmtFecha(mov.fecha || mov.creado_en), mov.material?.nombre || '—', mov.material?.unidad_medida || '', tipoMov[mov.tipo] || mov.tipo, Number(mov.cantidad), mov.referencia || '—', mov.notas || '']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    const cant = Number(mov.cantidad);
    if (cant < 0) row.getCell(6).font = { color: { argb: COLORS.rojoEstado }, bold: true };
    if (cant > 0) row.getCell(6).font = { color: { argb: COLORS.verdeEstado }, bold: true };
  });
  await enviarExcel(wb, res, 'Movimientos_Inventario_DetallesYMas');
}

export function exportarMovimientosCsv(movimientos: any[], res: Response) {
  const H = ['ID', 'Fecha', 'Material', 'Tipo', 'Cantidad', 'Referencia', 'Notas'];
  const filas = movimientos.map(mov => [mov.id, fmtFecha(mov.fecha || mov.creado_en), mov.material?.nombre || '', mov.tipo, Number(mov.cantidad), mov.referencia || '', mov.notas || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Movimientos_Inventario_DetallesYMas');
}

export function exportarMovimientosPdf(movimientos: any[], res: Response) {
  const tipoMov: Record<string, string> = { ajuste: 'Ajuste Manual', merma: 'Merma', consumo_produccion: 'Consumo', devolucion: 'Devolución', compra: 'Compra' };
  const columnas = [
    { header: 'ID', width: 40, align: 'center' as const },
    { header: 'Fecha', width: 80, align: 'center' as const },
    { header: 'Material', width: 210, align: 'left' as const },
    { header: 'Tipo Movimiento', width: 110, align: 'center' as const },
    { header: 'Cantidad', width: 75, align: 'center' as const },
    { header: 'Referencia', width: 115, align: 'left' as const },
    { header: 'Notas', width: 140, align: 'left' as const },
  ];
  const filas = movimientos.map(mov => [
    `#${mov.id}`,
    fmtFecha(mov.fecha || mov.creado_en),
    mov.material?.nombre || '—',
    tipoMov[mov.tipo] || mov.tipo,
    `${Number(mov.cantidad) > 0 ? '+' : ''}${mov.cantidad}`,
    mov.referencia || '—',
    mov.notas || '—',
  ]);
  generarPdfTable({
    titulo: 'Kardex de Movimientos de Inventario',
    subtitulo: `Total: ${movimientos.length} movimientos`,
    columnas,
    filas,
    filename: 'Movimientos_Inventario_DetallesYMas',
    res,
  });
}

// ─── 7. PROVEEDORES ────────────────────────────────────────────────────────
export async function exportarProveedoresXlsx(proveedores: any[], res: Response) {
  const { wb, ws } = crearLibro('Directorio de Proveedores', `Total: ${proveedores.length} proveedores`);
  const COLS = ['ID', 'Nombre', 'Contacto', 'Teléfono', 'Email', 'Dirección', 'N° Materiales', 'N° Compras', 'Estado', 'Notas'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 25, 20, 15, 25, 25, 12, 10, 10, 30]);
  proveedores.forEach((prov, idx) => {
    const row = ws.addRow([prov.id, prov.nombre, prov.contacto || '—', prov.telefono || '—', prov.email || '—', prov.direccion || '—', prov._count?.materiales ?? 0, prov._count?.compras ?? 0, prov.activo ? 'Activo' : 'Inactivo', prov.notas || '']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    if (!prov.activo) row.getCell(9).font = { color: { argb: COLORS.rojoEstado } };
  });
  await enviarExcel(wb, res, 'Proveedores_DetallesYMas');
}

export function exportarProveedoresCsv(proveedores: any[], res: Response) {
  const H = ['ID', 'Nombre', 'Contacto', 'Teléfono', 'Email', 'Dirección', 'N° Materiales', 'N° Compras', 'Estado', 'Notas'];
  const filas = proveedores.map(prov => [prov.id, prov.nombre, prov.contacto || '', prov.telefono || '', prov.email || '', prov.direccion || '', prov._count?.materiales ?? 0, prov._count?.compras ?? 0, prov.activo ? 'Activo' : 'Inactivo', prov.notas || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Proveedores_DetallesYMas');
}

export function exportarProveedoresPdf(proveedores: any[], res: Response) {
  const columnas = [
    { header: 'ID', width: 40, align: 'center' as const },
    { header: 'Nombre del Proveedor', width: 170, align: 'left' as const },
    { header: 'Contacto', width: 120, align: 'left' as const },
    { header: 'Teléfono', width: 90, align: 'center' as const },
    { header: 'Email', width: 140, align: 'left' as const },
    { header: 'Dirección', width: 140, align: 'left' as const },
    { header: 'Estado', width: 70, align: 'center' as const },
  ];
  const filas = proveedores.map(p => [
    `#${p.id}`,
    p.nombre,
    p.contacto || '—',
    p.telefono || '—',
    p.email || '—',
    p.direccion || '—',
    p.activo ? 'Activo' : 'Inactivo',
  ]);
  generarPdfTable({
    titulo: 'Directorio de Proveedores',
    subtitulo: `Total: ${proveedores.length} proveedores`,
    columnas,
    filas,
    filename: 'Proveedores_DetallesYMas',
    res,
  });
}

// ─── 8. COMPRAS ────────────────────────────────────────────────────────────
export async function exportarComprasXlsx(compras: any[], res: Response) {
  const { wb, ws } = crearLibro('Registro de Compras a Proveedores', `Total: ${compras.length} compras`);
  const COLS = ['ID', 'Fecha', 'Proveedor', 'N° Factura', 'Materiales Comprados', 'Total (C$)', 'Notas'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 13, 25, 15, 40, 14, 25]);
  let acumTotal = 0;
  compras.forEach((c, idx) => {
    const total = (c.detalles || []).reduce((s: number, d: any) => s + (Number(d.cantidad) * Number(d.costo_unitario)), 0);
    acumTotal += total;
    const materiales = (c.detalles || []).map((d: any) => `${d.cantidad}x ${d.material?.nombre || 'Material'}`).join('; ');
    const row = ws.addRow([c.id, fmtFecha(c.fecha), c.proveedor?.nombre || '—', c.numero_factura || '—', materiales, total, c.notas || '']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    row.getCell(6).numFmt = '"C$"#,##0.00';
  });
  agregarFilaTotales(ws, COLS.length, ['', 'TOTAL COMPRAS', '', '', '', fmtMoneda(acumTotal), '']);
  await enviarExcel(wb, res, 'Compras_DetallesYMas');
}

export function exportarComprasCsv(compras: any[], res: Response) {
  const H = ['ID', 'Fecha', 'Proveedor', 'N° Factura', 'Materiales', 'Total (C$)', 'Notas'];
  const filas = compras.map(c => {
    const total = (c.detalles || []).reduce((s: number, d: any) => s + (Number(d.cantidad) * Number(d.costo_unitario)), 0);
    const materiales = (c.detalles || []).map((d: any) => `${d.cantidad}x ${d.material?.nombre}`).join('; ');
    return [c.id, fmtFecha(c.fecha), c.proveedor?.nombre || '', c.numero_factura || '', materiales, total.toFixed(2), c.notas || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  });
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Compras_DetallesYMas');
}

export function exportarComprasPdf(compras: any[], res: Response) {
  const columnas = [
    { header: 'ID', width: 45, align: 'center' as const },
    { header: 'Fecha', width: 85, align: 'center' as const },
    { header: 'Proveedor', width: 170, align: 'left' as const },
    { header: 'N° Factura', width: 95, align: 'center' as const },
    { header: 'Materiales Adquiridos', width: 275, align: 'left' as const },
    { header: 'Total (C$)', width: 100, align: 'right' as const },
  ];
  let acumTotal = 0;
  const filas = compras.map(c => {
    const total = (c.detalles || []).reduce((s: number, d: any) => s + (Number(d.cantidad) * Number(d.costo_unitario)), 0);
    acumTotal += total;
    const materiales = (c.detalles || []).map((d: any) => `${d.cantidad}x ${d.material?.nombre}`).join('; ');
    return [
      `#${c.id}`,
      fmtFecha(c.fecha),
      c.proveedor?.nombre || '—',
      c.numero_factura || '—',
      materiales || '—',
      fmtMoneda(total),
    ];
  });
  generarPdfTable({
    titulo: 'Historial de Compras de Insumos',
    subtitulo: `Total: ${compras.length} compras registradas`,
    columnas,
    filas,
    totales: ['', 'TOTAL COMPRAS', '', '', '', fmtMoneda(acumTotal)],
    filename: 'Compras_DetallesYMas',
    res,
  });
}

// ─── 9. GASTOS ─────────────────────────────────────────────────────────────
export async function exportarGastosXlsx(gastos: any[], res: Response) {
  const { wb, ws } = crearLibro('Registro de Gastos Operativos', `Total: ${gastos.length} gastos`);
  const COLS = ['ID', 'Fecha', 'Tipo Gasto', 'Descripción', 'Monto (C$)', 'Pedido Relacionado', 'Cliente Pedido'];
  aplicarEncabezado(ws, 5, COLS);
  ajustarColumnas(ws, [6, 13, 15, 35, 13, 16, 22]);
  let acumMonto = 0;
  gastos.forEach((g, idx) => {
    const monto = Number(g.monto);
    acumMonto += monto;
    const row = ws.addRow([g.id, fmtFecha(g.fecha), TIPO_GASTO[g.tipo] || g.tipo, g.descripcion, monto, g.pedido ? `#${g.pedido.id}` : '—', g.pedido?.cliente?.nombre || '—']);
    estiloFila(row, COLS.length, idx % 2 === 0);
    row.getCell(5).numFmt = '"C$"#,##0.00';
  });
  agregarFilaTotales(ws, COLS.length, ['', 'TOTAL GASTOS', '', '', fmtMoneda(acumMonto), '', '']);
  await enviarExcel(wb, res, 'Gastos_DetallesYMas');
}

export function exportarGastosCsv(gastos: any[], res: Response) {
  const H = ['ID', 'Fecha', 'Tipo', 'Descripción', 'Monto (C$)', 'Pedido', 'Cliente'];
  const filas = gastos.map(g => [g.id, fmtFecha(g.fecha), TIPO_GASTO[g.tipo] || g.tipo, g.descripcion, Number(g.monto).toFixed(2), g.pedido ? `#${g.pedido.id}` : '', g.pedido?.cliente?.nombre || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  enviarCsv(res, [H.map(h => `"${h}"`).join(','), ...filas].join('\n'), 'Gastos_DetallesYMas');
}

export function exportarGastosPdf(gastos: any[], res: Response) {
  const columnas = [
    { header: 'ID', width: 45, align: 'center' as const },
    { header: 'Fecha', width: 85, align: 'center' as const },
    { header: 'Tipo de Gasto', width: 110, align: 'center' as const },
    { header: 'Descripción del Gasto', width: 285, align: 'left' as const },
    { header: 'Monto (C$)', width: 105, align: 'right' as const },
    { header: 'Pedido Rel.', width: 65, align: 'center' as const },
    { header: 'Cliente', width: 75, align: 'left' as const },
  ];
  let acumMonto = 0;
  const filas = gastos.map(g => {
    const monto = Number(g.monto);
    acumMonto += monto;
    return [
      `#${g.id}`,
      fmtFecha(g.fecha),
      TIPO_GASTO[g.tipo] || g.tipo,
      g.descripcion,
      fmtMoneda(monto),
      g.pedido ? `#${g.pedido.id}` : '—',
      g.pedido?.cliente?.nombre || '—',
    ];
  });
  generarPdfTable({
    titulo: 'Registro de Gastos Operativos',
    subtitulo: `Total: ${gastos.length} gastos registrados`,
    columnas,
    filas,
    totales: ['', 'TOTAL GASTOS', '', '', fmtMoneda(acumMonto), '', ''],
    filename: 'Gastos_DetallesYMas',
    res,
  });
}

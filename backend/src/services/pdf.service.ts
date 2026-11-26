export interface OrderPrintData {
  id: number;
  fecha_pedido: string;
  fecha_entrega?: string | null;
  estado: string;
  tipo_entrega: string;
  direccion_entrega?: string | null;
  costo_envio: number;
  descuento: number;
  total: number;
  notas?: string | null;
  cliente: {
    nombre: string;
    telefono?: string | null;
    whatsapp?: string | null;
    direccion?: string | null;
  };
  detalles: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    personalizacion?: string | null;
  }>;
  pagos: Array<{
    fecha: string;
    monto: number;
    metodo: string;
    es_anticipo: boolean;
    referencia?: string | null;
  }>;
  totalPagado: number;
  saldoPendiente: number;
  negocio: {
    nombre: string;
    lema: string;
    telefono?: string | null;
    whatsapp?: string | null;
    direccion?: string | null;
  };
}

export class PdfService {
  /**
   * Genera el HTML enriquecido con CSS de impresión optimizado para PDF (A4/Carta)
   */
  static generateOrderHtml(data: OrderPrintData): string {
    const formatCordoba = (num: number) => `C$ ${num.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const itemsHtml = data.detalles
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #D9C3A0;">
            <strong style="color: #4A2C2A;">${item.descripcion}</strong>
            ${item.personalizacion ? `<div style="font-size: 12px; color: #6B544C; margin-top: 4px;"><em>Personalización: ${item.personalizacion}</em></div>` : ''}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #D9C3A0; text-align: center; color: #4A2C2A;">${item.cantidad}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #D9C3A0; text-align: right; color: #4A2C2A;">${formatCordoba(item.precio_unitario)}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #D9C3A0; text-align: right; font-weight: bold; color: #8E2A45;">${formatCordoba(item.subtotal)}</td>
        </tr>`
      )
      .join('');

    const pagosHtml = data.pagos.length > 0
      ? data.pagos
          .map(
            (p) => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; color: #6B544C;">
            <span>${p.es_anticipo ? 'Anticipo' : 'Abono'} (${p.metodo}${p.referencia ? ` - Ref: ${p.referencia}` : ''}):</span>
            <strong style="color: #5F7A4F;">${formatCordoba(p.monto)}</strong>
          </div>`
          )
          .join('')
      : '<p style="font-size: 12px; color: #6B544C; margin: 0;">Sin pagos registrados.</p>';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Pedido #${data.id} - ${data.negocio.nombre}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@400;700&display=swap');
    body {
      font-family: 'Lato', sans-serif;
      margin: 0;
      padding: 30px;
      color: #4A2C2A;
      background: #FFFFFF;
      font-size: 14px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #C9A24D;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      color: #8E2A45;
      margin: 0;
    }
    .brand-slogan {
      font-size: 13px;
      color: #C9A24D;
      font-weight: bold;
      margin-top: 2px;
    }
    .receipt-info {
      text-align: right;
    }
    .receipt-number {
      font-size: 20px;
      font-weight: bold;
      color: #8E2A45;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
      background: #FBF4E8;
      padding: 16px;
      border-radius: 10px;
      border: 1px solid #D9C3A0;
    }
    .info-block h3 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8E2A45;
      margin: 0 0 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    th {
      background: #8E2A45;
      color: #FFFFFF;
      font-weight: 700;
      padding: 10px 8px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
    }
    .totals-container {
      display: flex;
      justify-content: space-between;
      gap: 30px;
    }
    .payments-box {
      flex: 1;
      background: #FFFCF7;
      padding: 15px;
      border: 1px solid #D9C3A0;
      border-radius: 8px;
    }
    .totals-box {
      width: 280px;
      background: #FFFCF7;
      padding: 15px;
      border: 1px solid #D9C3A0;
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .final-total {
      font-size: 17px;
      font-weight: bold;
      color: #8E2A45;
      border-top: 1px solid #D9C3A0;
      padding-top: 8px;
      margin-top: 8px;
    }
    .balance-due {
      font-size: 16px;
      font-weight: bold;
      color: #B3261E;
      border-top: 1px dashed #D9C3A0;
      padding-top: 8px;
      margin-top: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      border-top: 1px solid #D9C3A0;
      padding-top: 15px;
      font-size: 12px;
      color: #6B544C;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">${data.negocio.nombre}</h1>
      <div class="brand-slogan">${data.negocio.lema}</div>
      <div style="font-size: 12px; color: #6B544C; margin-top: 4px;">
        WhatsApp: ${data.negocio.whatsapp || '8485-6722'} | Managua, Nicaragua
      </div>
    </div>
    <div class="receipt-info">
      <div class="receipt-number">PEDIDO #${data.id}</div>
      <div style="font-size: 12px; color: #6B544C; margin-top: 4px;">Fecha: ${data.fecha_pedido}</div>
      <div style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; background: #E9B9BE; color: #6F1F36; margin-top: 6px;">
        Estado: ${data.estado.replace('_', ' ')}
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <h3>Datos del Cliente</h3>
      <div><strong>Nombre:</strong> ${data.cliente.nombre}</div>
      ${data.cliente.whatsapp ? `<div><strong>WhatsApp:</strong> ${data.cliente.whatsapp}</div>` : ''}
      ${data.cliente.telefono ? `<div><strong>Teléfono:</strong> ${data.cliente.telefono}</div>` : ''}
    </div>
    <div class="info-block">
      <h3>Detalles de Entrega</h3>
      <div><strong>Tipo:</strong> ${data.tipo_entrega === 'domicilio' ? 'Envío a Domicilio' : data.tipo_entrega === 'envio' ? 'Envío Nacional' : 'Retiro en Taller'}</div>
      ${data.fecha_entrega ? `<div><strong>Fecha Prometida:</strong> ${data.fecha_entrega}</div>` : ''}
      ${data.direccion_entrega ? `<div><strong>Dirección:</strong> ${data.direccion_entrega}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Descripción y Personalización</th>
        <th style="text-align: center; width: 10%;">Cant.</th>
        <th style="text-align: right; width: 20%;">Precio Unit.</th>
        <th style="text-align: right; width: 20%;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals-container">
    <div class="payments-box">
      <h3 style="font-size: 13px; text-transform: uppercase; color: #8E2A45; margin: 0 0 10px 0;">Historial de Pagos</h3>
      ${pagosHtml}
      ${data.notas ? `<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #D9C3A0; font-size: 12px; color: #6B544C;"><strong>Notas:</strong> ${data.notas}</div>` : ''}
    </div>

    <div class="totals-box">
      <div class="total-row">
        <span>Costo de Envío:</span>
        <span>${formatCordoba(data.costo_envio)}</span>
      </div>
      <div class="total-row">
        <span>Descuento:</span>
        <span style="color: #5F7A4F;">-${formatCordoba(data.descuento)}</span>
      </div>
      <div class="total-row final-total">
        <span>TOTAL:</span>
        <span>${formatCordoba(data.total)}</span>
      </div>
      <div class="total-row" style="color: #5F7A4F; font-size: 14px; margin-top: 6px;">
        <span>Total Pagado:</span>
        <span>${formatCordoba(data.totalPagado)}</span>
      </div>
      <div class="total-row balance-due">
        <span>SALDO PENDIENTE:</span>
        <span>${formatCordoba(data.saldoPendiente)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p style="margin: 0 0 4px 0;">¡Gracias por confiar en <strong>${data.negocio.nombre}</strong>!</p>
    <p style="margin: 0;">"Hecho con amor para cada ocasión" • Para cualquier consulta contáctanos al WhatsApp ${data.negocio.whatsapp || '8485-6722'}</p>
  </div>
</body>
</html>`;
  }
}


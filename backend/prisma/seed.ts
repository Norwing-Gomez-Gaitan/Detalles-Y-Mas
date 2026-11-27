import { PrismaClient, MetodoPago, EstadoPedido, TipoEntrega, TipoGasto } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos de prueba para Detalles y Más...');

  // 1. Configuración del negocio
  await prisma.configuracionNegocio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: 'Detalles y Más',
      lema: 'Hecho con amor para cada ocasión',
      telefono: '8485-6722',
      whatsapp: '8485-6722',
      instagram: '@detallesymas.ni',
      facebook: 'https://www.facebook.com/Aracelly82',
      direccion_cobertura: 'Km8 carretera norte entrada Rocargo 4c al Norte 2 abajo media al sur',
      horario: 'Lunes a Sábado: 8:00 AM - 6:00 PM',
      sobre_nosotros: 'Somos un emprendimiento nicaragüense apasionado por convertir momentos especiales en recuerdos inolvidables. Diseñamos arreglos florales, detalles personalizados para cumpleaños, quinceaños (Sweet 15), bodas, graduaciones y festividades navideñas. Cada pieza es elaborada a mano con materiales de la más alta calidad y un acabado impecable.'
    }
  });

  // 2. Administradores
  const userRequestedHash = await bcrypt.hash('Hola1212', 10);
  await prisma.usuarioAdmin.upsert({
    where: { email: 'left4deadchele@gmail.com' },
    update: {
      password_hash: userRequestedHash,
      activo: true,
    },
    create: {
      nombre: 'Administrador Principal',
      email: 'left4deadchele@gmail.com',
      password_hash: userRequestedHash,
      activo: true,
    },
  });

  const adminPasswordHash = await bcrypt.hash('admin12345', 10);
  await prisma.usuarioAdmin.upsert({
    where: { email: 'admin@detallesymas.ni' },
    update: {},
    create: {
      nombre: 'Dueña y Administradora',
      email: 'admin@detallesymas.ni',
      password_hash: adminPasswordHash,
      activo: true
    }
  });

  // 3. Categorías
  const catFlores = await prisma.categoria.upsert({
    where: { nombre: 'Arreglos florales' },
    update: {},
    create: { nombre: 'Arreglos florales', descripcion: 'Rosas eternas, girasoles y flores finas combinadas.' }
  });

  const catNavidad = await prisma.categoria.upsert({
    where: { nombre: 'Adornos navideños' },
    update: {},
    create: { nombre: 'Adornos navideños', descripcion: 'Coronas, esferas personalizadas y detalles para el hogar.' }
  });

  const catPersonalizados = await prisma.categoria.upsert({
    where: { nombre: 'Regalos personalizados' },
    update: {},
    create: { nombre: 'Regalos personalizados', descripcion: 'Cajas sorpresa, tazas, cuadros y recuerdos con nombres y dedicatorias.' }
  });

  const catEventos = await prisma.categoria.upsert({
    where: { nombre: 'Sweet 15 y Cumpleaños' },
    update: {},
    create: { nombre: 'Sweet 15 y Cumpleaños', descripcion: 'Centros de mesa, globos burbuja y detalles temáticos.' }
  });

  // 4. Proveedores
  const provPapeleria = await prisma.proveedor.create({
    data: {
      nombre: 'Papelería y Manualidades Central Managua',
      contacto: 'Doña Marta Rodríguez',
      telefono: '8888-1234',
      email: 'marta.central@gmail.com',
      direccion: 'Mercado Oriental, Ciudad Jardín, Managua',
      notas: 'Venta de foami, silicón, cintas y cartulinas especiales.'
    }
  });

  const provFlores = await prisma.proveedor.create({
    data: {
      nombre: 'Distribuidora de Flores y Accesorios El Artesano',
      contacto: 'Carlos Mendoza',
      telefono: '8777-5678',
      email: 'carlos.artesano@gmail.com',
      direccion: 'Bello Horizonte, Managua',
      notas: 'Flores de tela, follaje artificial y bases de cerámica.'
    }
  });

  const provLuces = await prisma.proveedor.create({
    data: {
      nombre: 'Importaciones y Novedades Express',
      contacto: 'Ingrid Morales',
      telefono: '8666-9900',
      email: 'ingrid.novedades@gmail.com',
      direccion: 'Plaza España, Managua',
      notas: 'Luces LED micro-alambre, cajas de acetato y lazos.'
    }
  });

  // 5. Materiales
  const matCinta = await prisma.material.create({
    data: {
      nombre: 'Cinta satinada 2.5cm (dorado y borgoña)',
      unidad_medida: 'metro',
      stock_actual: 85.0,
      stock_minimo: 20.0,
      costo_unitario: 12.00, // C$ por metro
      proveedor_id: provPapeleria.id
    }
  });

  const matFoami = await prisma.material.create({
    data: {
      nombre: 'Foami escarchado surtido',
      unidad_medida: 'pliego',
      stock_actual: 40.0,
      stock_minimo: 10.0,
      costo_unitario: 25.00,
      proveedor_id: provPapeleria.id
    }
  });

  const matFloresArt = await prisma.material.create({
    data: {
      nombre: 'Rosas artificiales aterciopeladas',
      unidad_medida: 'unidad',
      stock_actual: 120.0,
      stock_minimo: 30.0,
      costo_unitario: 35.00,
      proveedor_id: provFlores.id
    }
  });

  const matBaseCeramica = await prisma.material.create({
    data: {
      nombre: 'Base de cerámica blanca artesanal',
      unidad_medida: 'unidad',
      stock_actual: 18.0,
      stock_minimo: 5.0,
      costo_unitario: 120.00,
      proveedor_id: provFlores.id
    }
  });

  const matLucesLed = await prisma.material.create({
    data: {
      nombre: 'Serie micro-luces LED cálidas 2m a batería',
      unidad_medida: 'unidad',
      stock_actual: 25.0,
      stock_minimo: 8.0,
      costo_unitario: 65.00,
      proveedor_id: provLuces.id
    }
  });

  const matCajaMadera = await prisma.material.create({
    data: {
      nombre: 'Caja de madera pino 20x20cm',
      unidad_medida: 'unidad',
      stock_actual: 12.0,
      stock_minimo: 4.0,
      costo_unitario: 160.00,
      proveedor_id: provPapeleria.id
    }
  });

  const matGloboBurbuja = await prisma.material.create({
    data: {
      nombre: 'Globo burbuja transparente 24 pulgadas',
      unidad_medida: 'unidad',
      stock_actual: 30.0,
      stock_minimo: 10.0,
      costo_unitario: 45.00,
      proveedor_id: provLuces.id
    }
  });

  const matEsferasAcrilico = await prisma.material.create({
    data: {
      nombre: 'Esferas acrílicas transparentes 8cm',
      unidad_medida: 'unidad',
      stock_actual: 6.0, // Stock bajo para probar alerta
      stock_minimo: 15.0,
      costo_unitario: 28.00,
      proveedor_id: provLuces.id
    }
  });

  // 6. Productos con recetas
  const prod1 = await prisma.producto.create({
    data: {
      categoria_id: catFlores.id,
      codigo: 'ARR-001',
      slug: 'arreglo-floral-romantico-rosa-eterna',
      nombre: 'Arreglo Floral Romántico Rosa Eterna',
      descripcion: 'Elegante base de cerámica con rosas aterciopeladas, follaje fino, lazo en cinta satinada borgoña y tarjeta personalizada.',
      precio_venta: 650.00,
      tiempo_elaboracion_min: 60,
      es_personalizable: true,
      stock_terminado: 3,
      imagen_url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      visible_catalogo: true,
      destacado: true,
      activo: true,
      imagenes: {
        create: [
          { url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80', orden: 1 },
          { url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80', orden: 2 }
        ]
      },
      materiales: {
        create: [
          { material_id: matBaseCeramica.id, cantidad: 1 },
          { material_id: matFloresArt.id, cantidad: 8 },
          { material_id: matCinta.id, cantidad: 2.0 }
        ]
      }
    }
  });

  const prod2 = await prisma.producto.create({
    data: {
      categoria_id: catEventos.id,
      codigo: 'SWT-002',
      slug: 'caja-sorpresa-sweet-15-con-luces-led',
      nombre: 'Caja Sorpresa Sweet 15 con Luces LED',
      descripcion: 'Caja de madera con acabado kraft y toques dorados, mini rosas, luces LED de hadas y mensaje de felicitación con nombre de la quinceañera.',
      precio_venta: 850.00,
      tiempo_elaboracion_min: 90,
      es_personalizable: true,
      stock_terminado: 2,
      imagen_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
      visible_catalogo: true,
      destacado: true,
      activo: true,
      imagenes: {
        create: [
          { url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', orden: 1 }
        ]
      },
      materiales: {
        create: [
          { material_id: matCajaMadera.id, cantidad: 1 },
          { material_id: matLucesLed.id, cantidad: 1 },
          { material_id: matFloresArt.id, cantidad: 4 },
          { material_id: matCinta.id, cantidad: 1.5 }
        ]
      }
    }
  });

  const prod3 = await prisma.producto.create({
    data: {
      categoria_id: catNavidad.id,
      codigo: 'NAV-003',
      slug: 'esfera-navidena-personalizada-con-nieve',
      nombre: 'Esfera Navideña Personalizada con Nieve',
      descripcion: 'Esfera acrílica transparente con nieve artificial, nombre caligrafiado en dorado o borgoña y lazo decorativo para el árbol.',
      precio_venta: 180.00,
      tiempo_elaboracion_min: 30,
      es_personalizable: true,
      stock_terminado: 10,
      imagen_url: 'https://images.unsplash.com/photo-1512474932049-78ac69ede12c?auto=format&fit=crop&w=800&q=80',
      visible_catalogo: true,
      destacado: true,
      activo: true,
      imagenes: {
        create: [
          { url: 'https://images.unsplash.com/photo-1512474932049-78ac69ede12c?auto=format&fit=crop&w=800&q=80', orden: 1 }
        ]
      },
      materiales: {
        create: [
          { material_id: matEsferasAcrilico.id, cantidad: 1 },
          { material_id: matCinta.id, cantidad: 0.8 },
          { material_id: matFoami.id, cantidad: 0.2 }
        ]
      }
    }
  });

  const prod4 = await prisma.producto.create({
    data: {
      categoria_id: catEventos.id,
      codigo: 'GLO-004',
      slug: 'arreglo-de-globos-burbuja-con-chocolates',
      nombre: 'Arreglo de Globos Burbuja con Dulces',
      descripcion: 'Globo burbuja cristal inflado con helio y confeti dorado, frase personalizada en vinil, base de dulces surtidos y lazo borgoña.',
      precio_venta: 750.00,
      tiempo_elaboracion_min: 45,
      es_personalizable: true,
      stock_terminado: 0,
      imagen_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
      visible_catalogo: true,
      destacado: true,
      activo: true,
      imagenes: {
        create: [
          { url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80', orden: 1 }
        ]
      },
      materiales: {
        create: [
          { material_id: matGloboBurbuja.id, cantidad: 1 },
          { material_id: matCinta.id, cantidad: 3.0 },
          { material_id: matLucesLed.id, cantidad: 1 }
        ]
      }
    }
  });

  const prod5 = await prisma.producto.create({
    data: {
      categoria_id: catPersonalizados.id,
      codigo: 'REG-005',
      slug: 'cuadro-personalizado-recuerdo-con-luces',
      nombre: 'Cuadro Personalizado con Foto y Luces',
      descripcion: 'Marco profundo tipo caja con fotografía impresa en alta resolución, dedicatoria caligrafiada a mano y micro-luces LED cálidas.',
      precio_venta: 550.00,
      tiempo_elaboracion_min: 75,
      es_personalizable: true,
      stock_terminado: 4,
      imagen_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
      visible_catalogo: true,
      destacado: false,
      activo: true,
      imagenes: {
        create: [
          { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', orden: 1 }
        ]
      },
      materiales: {
        create: [
          { material_id: matLucesLed.id, cantidad: 1 },
          { material_id: matCinta.id, cantidad: 1.0 }
        ]
      }
    }
  });

  // 7. Clientes
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: 'Valeria Chamorro',
      telefono: '8855-2233',
      whatsapp: '50588552233',
      email: 'valeria.chamorro@gmail.com',
      direccion: 'Colonia Los Robles, Managua',
      red_social: '@valeriach',
      fecha_especial: new Date('1998-12-05'),
      notas: 'Prefiere tonos pastel y flores en tonos rosados.'
    }
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: 'Mauricio Estrada',
      telefono: '8911-4455',
      whatsapp: '50589114455',
      email: 'mauricio.estrada@outlook.com',
      direccion: 'Reparto San Juan, Managua',
      red_social: '@mau_estrada',
      fecha_especial: new Date('1990-11-28'), // Fecha cercana para prueba de alertas
      notas: 'Cliente corporativo para detalles de fin de año.'
    }
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      nombre: 'Sofía Gutiérrez',
      telefono: '8744-9988',
      whatsapp: '50587449988',
      email: 'sofia.guti@gmail.com',
      direccion: 'Villa Fontana, Managua',
      red_social: '@sofiag',
      fecha_especial: new Date('2008-11-30'), // Quinceaños próximo
      notas: 'Quinceañera. Colores favoritos: borgoña y dorado.'
    }
  });

  // 8. Pedidos de prueba
  // Pedido 1: Confirmado con anticipo
  const pedido1 = await prisma.pedido.create({
    data: {
      cliente_id: cliente1.id,
      estado: EstadoPedido.confirmado,
      tipo_entrega: TipoEntrega.domicilio,
      direccion_entrega: 'Colonia Los Robles, casa #45, Managua',
      costo_envio: 100.00,
      descuento: 0.00,
      total: 750.00,
      fecha_entrega: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // En 2 días
      notas: 'Llevar en la mañana antes de las 11:00 AM.',
      detalles: {
        create: [
          {
            producto_id: prod1.id,
            descripcion: 'Arreglo Floral Romántico Rosa Eterna',
            cantidad: 1,
            precio_unitario: 650.00,
            costo_estimado: 410.00,
            personalizacion: 'Tarjeta con mensaje: "Feliz Aniversario mi amor. De: Carlos". Lazo color borgoña.'
          }
        ]
      },
      pagos: {
        create: [
          {
            monto: 400.00,
            metodo: MetodoPago.transferencia,
            es_anticipo: true,
            referencia: 'BAC-TR-994821',
            notas: 'Anticipo del 50%+ recibido por BAC Credomatic.'
          }
        ]
      }
    }
  });

  // Pedido 2: En producción
  const pedido2 = await prisma.pedido.create({
    data: {
      cliente_id: cliente3.id,
      estado: EstadoPedido.en_produccion,
      tipo_entrega: TipoEntrega.retiro_local,
      costo_envio: 0.00,
      descuento: 50.00,
      total: 800.00,
      fecha_entrega: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notas: 'Cliente retira en taller personal.',
      detalles: {
        create: [
          {
            producto_id: prod2.id,
            descripcion: 'Caja Sorpresa Sweet 15 con Luces LED',
            cantidad: 1,
            precio_unitario: 850.00,
            costo_estimado: 380.00,
            personalizacion: 'Nombre en la tapa: "Mis Dulces 15 Sofía". Toques dorado y kraft.'
          }
        ]
      },
      pagos: {
        create: [
          {
            monto: 500.00,
            metodo: MetodoPago.billetera_movil,
            es_anticipo: true,
            referencia: 'LAFISE-Q-88219',
            notas: 'Pago vía Billetera Móvil Lafise'
          }
        ]
      }
    }
  });

  // Pedido 3: Entregado (completado con ganancia para vista mensual)
  const pedido3 = await prisma.pedido.create({
    data: {
      cliente_id: cliente2.id,
      estado: EstadoPedido.entregado,
      tipo_entrega: TipoEntrega.domicilio,
      direccion_entrega: 'Oficinas Reparto San Juan',
      costo_envio: 80.00,
      descuento: 0.00,
      total: 1580.00,
      fecha_entrega: new Date(),
      notas: 'Entregado con éxito a satisfacción.',
      detalles: {
        create: [
          {
            producto_id: prod4.id,
            descripcion: 'Arreglo de Globos Burbuja con Dulces',
            cantidad: 2,
            precio_unitario: 750.00,
            costo_estimado: 450.00,
            personalizacion: 'Frase corporativa: "Felices Fiestas equipo 2026"'
          }
        ]
      },
      pagos: {
        create: [
          {
            monto: 1580.00,
            metodo: MetodoPago.transferencia,
            es_anticipo: false,
            referencia: 'BANPRO-998811',
            notas: 'Cancelación total anticipada vía Banpro'
          }
        ]
      }
    }
  });

  // 9. Gastos operativos
  await prisma.gasto.create({
    data: {
      tipo: TipoGasto.publicidad,
      descripcion: 'Campaña de Instagram Ads para temporada navideña',
      monto: 700.00,
      fecha: new Date()
    }
  });

  await prisma.gasto.create({
    data: {
      tipo: TipoGasto.empaque,
      descripcion: 'Bolsas de papel kraft con logo y papel de seda',
      monto: 450.00,
      fecha: new Date()
    }
  });

  console.log('✅ Seed completado con éxito!');
  console.log('👑 Admin por defecto: admin@detallesymas.ni | Contraseña: admin12345');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


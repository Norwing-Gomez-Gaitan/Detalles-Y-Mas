import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'src/data');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

export interface BusinessConfig {
  id: number;
  nombre: string;
  lema: string;
  telefono?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  direccion_cobertura?: string | null;
  horario?: string | null;
  sobre_nosotros?: string | null;
}

const DEFAULT_CONFIG: BusinessConfig = {
  id: 1,
  nombre: 'Detalles y Más',
  lema: 'Hecho con amor para cada ocasión',
  telefono: '8485-6722',
  whatsapp: '8485-6722',
  instagram: '@detallesymas.ni',
  facebook: 'https://www.facebook.com/Aracelly82',
  direccion_cobertura: 'Km8 carretera norte entrada Rocargo 4c al Norte 2 abajo media al sur',
  horario: 'Lunes a Sábado: 8:00 AM - 6:00 PM',
  sobre_nosotros: 'Somos un taller de manualidades y detalles personalizados en Nicaragua. Elaboramos arreglos, adornos y recuerdos únicos hechos a mano con pasión y amor para cada ocasión especial.'
};

const DEFAULT_CATEGORIES = [
  { id: 1, nombre: 'Arreglos florales', descripcion: 'Rosas eternas, girasoles y flores finas combinadas.', activa: true },
  { id: 2, nombre: 'Adornos navideños', descripcion: 'Coronas, esferas personalizadas y detalles para el hogar.', activa: true },
  { id: 3, nombre: 'Regalos personalizados', descripcion: 'Cajas sorpresa, tazas, cuadros y recuerdos con nombres.', activa: true },
  { id: 4, nombre: 'Sweet 15 y Cumpleaños', descripcion: 'Centros de mesa, globos burbuja y detalles temáticos.', activa: true }
];

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    categoria_id: 1,
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
    categoria: { id: 1, nombre: 'Arreglos florales' },
    imagenes: [
      { id: 1, url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80', orden: 1 },
      { id: 2, url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80', orden: 2 }
    ],
    materiales: []
  },
  {
    id: 2,
    categoria_id: 4,
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
    categoria: { id: 4, nombre: 'Sweet 15 y Cumpleaños' },
    imagenes: [
      { id: 3, url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', orden: 1 }
    ],
    materiales: []
  },
  {
    id: 3,
    categoria_id: 2,
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
    categoria: { id: 2, nombre: 'Adornos navideños' },
    imagenes: [
      { id: 4, url: 'https://images.unsplash.com/photo-1512474932049-78ac69ede12c?auto=format&fit=crop&w=800&q=80', orden: 1 }
    ],
    materiales: []
  },
  {
    id: 4,
    categoria_id: 4,
    codigo: 'GLO-004',
    slug: 'arreglo-de-globos-burbuja-con-chocolates',
    nombre: 'Arreglo de Globos Burbuja con Dulces',
    descripcion: 'Globo burbuja cristal inflado con frases en vinil, base de dulces y chocolates surtidos con lazo borgoña artesanal.',
    precio_venta: 750.00,
    tiempo_elaboracion_min: 45,
    es_personalizable: true,
    stock_terminado: 1,
    imagen_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    visible_catalogo: true,
    destacado: true,
    activo: true,
    categoria: { id: 4, nombre: 'Sweet 15 y Cumpleaños' },
    imagenes: [
      { id: 5, url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80', orden: 1 }
    ],
    materiales: []
  }
];

class StoreService {
  private config: BusinessConfig = { ...DEFAULT_CONFIG };
  private categories: any[] = [...DEFAULT_CATEGORIES];
  private products: any[] = [...DEFAULT_PRODUCTS];

  constructor() {
    this.loadFromDisk();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        // Ignorar si ya existe
      }
    }
  }

  private loadFromDisk() {
    this.ensureDirectory();
    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.config) this.config = { ...DEFAULT_CONFIG, ...data.config };
        if (data.categories?.length) this.categories = data.categories;
        if (data.products?.length) this.products = data.products;
      } catch (err) {
        console.warn('⚠️ No se pudo leer store.json, usando valores predeterminados:', err);
      }
    } else {
      this.saveToDisk();
    }
  }

  private saveToDisk() {
    this.ensureDirectory();
    try {
      const data = {
        config: this.config,
        categories: this.categories,
        products: this.products
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('⚠️ No se pudo escribir en store.json:', err);
    }
  }

  // --- CONFIGURACIÓN ---
  getConfig(): BusinessConfig {
    return { ...this.config };
  }

  updateConfig(newData: Partial<BusinessConfig>): BusinessConfig {
    this.config = {
      ...this.config,
      ...newData,
      id: 1
    };
    this.saveToDisk();
    return { ...this.config };
  }

  // --- CATEGORÍAS ---
  getCategories(): any[] {
    return this.categories.filter(c => c.activa !== false);
  }

  // --- PRODUCTOS ---
  getProducts(filter?: { categoria?: string; buscar?: string; orden?: string }): any[] {
    let result = this.products.filter(p => p.activo !== false && p.visible_catalogo !== false);

    if (filter?.categoria) {
      const catId = parseInt(filter.categoria, 10);
      if (!isNaN(catId)) {
        result = result.filter(p => p.categoria_id === catId);
      }
    }

    if (filter?.buscar) {
      const q = filter.buscar.toLowerCase().trim();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }

    if (filter?.orden === 'precio_asc') {
      result.sort((a, b) => a.precio_venta - b.precio_venta);
    } else if (filter?.orden === 'precio_desc') {
      result.sort((a, b) => b.precio_venta - a.precio_venta);
    } else if (filter?.orden === 'nombre_asc') {
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }

  getProductBySlug(slug: string): any | null {
    return this.products.find(p => p.slug === slug && p.activo !== false) || null;
  }

  getFeaturedProducts(): any[] {
    return this.products.filter(p => p.destacado && p.activo !== false && p.visible_catalogo !== false);
  }

  getAllProductsAdmin(): any[] {
    return this.products.map(p => ({
      ...p,
      costo_materiales: 150.0,
      ganancia_estimada: p.precio_venta - 150.0,
      margen_pct: Number((((p.precio_venta - 150.0) / p.precio_venta) * 100).toFixed(1))
    }));
  }
}

export const storeService = new StoreService();

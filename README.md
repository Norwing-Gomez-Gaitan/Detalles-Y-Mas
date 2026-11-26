# Sistema Web Completo: Detalles y Más 🌸

> **"Hecho con amor para cada ocasión"**  
> Sistema web integral para el taller de manualidades y detalles personalizados en **Nicaragua** (arreglos, adornos, regalos de cumpleaños, Sweet 15, bodas y Navidad).

---

## 🏛️ Arquitectura del Sistema

El proyecto está organizado como un **Monorepo** desacoplado, optimizado para los planes gratuitos de la nube:

```
detalles-y-mas/
├── backend/                   # API REST en Node.js, Express, TypeScript, Prisma y Zod
│   ├── prisma/
│   │   ├── migrations/        # Migración SQL aditiva completa
│   │   ├── schema.prisma      # Modelo Prisma multi-schema (manualidades)
│   │   └── seed.ts            # Datos realistas de Nicaragua y admin inicial
│   ├── src/                   # Controladores, rutas públicas y administrativas
│   └── package.json
├── frontend/                  # Sitio público y Panel Administrativo en Next.js 14+
│   ├── app/
│   │   ├── (public)/          # Catálogo para clientes (ISR, SEO, WhatsApp)
│   │   └── admin/             # Panel privado protegido con JWT
│   ├── components/            # Kanban, modales, alertas, tabla y diseño artesanal
│   └── package.json
├── docker-compose.yml         # PostgreSQL local para desarrollo offline
├── manualidades_db.sql        # Esquema base de PostgreSQL con triggers y vistas
└── README.md                  # Esta documentación
```

| Componente | Servicio de Hospedaje | Tecnologías Clave |
|---|---|---|
| **Frontend** (Sitio público + Panel admin) | **Vercel** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** (API REST) | **Render** (Web Service) | Node.js, Express, TypeScript, Prisma, Zod, Sharp |
| **Base de Datos y Almacenamiento** | **Supabase** | PostgreSQL 15 (schema `manualidades`) + Supabase Storage |

---

## 🎨 Identidad Visual y Diseño Artesanal

Paleta cromática configurada en Tailwind y CSS nativo:

- **Borgoña (`#8E2A45`)**: Botones principales, enlaces activos y acentos de marca.
- **Borgoña Oscuro (`#6F1F36`)**: Efectos hover y pulsado.
- **Dorado (`#C9A24D`)**: Insignias, íconos y líneas de elegancia.
- **Rosa Pastel (`#E9B9BE`)**: Etiquetas, estados de cotización y fondos suaves.
- **Kraft (`#D9C3A0`)**: Bordes artesanales y divisores.
- **Crema (`#FBF4E8`)**: Fondo general cálido.
- **Marfil (`#FFFCF7`)**: Tarjetas elevadas, modales y tablas.
- **Chocolate (`#4A2C2A`)**: Tipografía principal de alta legibilidad.
- **Tipografías**: **Playfair Display** para títulos elegantes y **Lato** para interfaz y lectura.

---

## 🚀 Requisitos Previos e Instalación Local

### 1. Requisitos
- **Node.js**: v18 o superior (recomendado v20+)
- **npm**: v9 o superior
- **PostgreSQL** local (o Docker) o un proyecto gratuito en **Supabase**

### 2. Configuración de Variables de Entorno

#### Backend (`backend/.env`):
Copia `backend/.env.example` a `backend/.env` y ajusta las variables:
```env
PORT=5000
NODE_ENV=development

# Conexión a PostgreSQL (local o Supabase)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/manualidades?schema=manualidades"
DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5432/manualidades?schema=manualidades"

# Seguridad JWT
JWT_SECRET="clave_secreta_super_segura_para_detalles_y_mas_jwt_2026"
JWT_EXPIRES_IN="7d"

# Origen permitido para CORS
FRONTEND_URL="http://localhost:3000"

# Supabase Storage para fotos de productos
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
SUPABASE_BUCKET="productos"
```

#### Frontend (`frontend/.env.local`):
Copia `frontend/.env.example` a `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Instalación de Dependencias

En la carpeta raíz o en cada subcarpeta:
```bash
# Instalar backend
cd backend
npm install
npx prisma generate

# Instalar frontend
cd ../frontend
npm install
```

### 4. Inicializar Base de Datos y Seed de Prueba

Si usas Docker:
```bash
docker-compose up -d
```

O si usas Supabase / PostgreSQL local:
1. Ejecuta el archivo `backend/prisma/migrations/001_initial_schema.sql` en el SQL Editor de Supabase o en psql.
2. Carga los datos de prueba iniciales:
```bash
cd backend
npm run db:seed
```

**Credencial de Administrador generada por el seed:**
- **Email:** `admin@detallesymas.ni`
- **Contraseña:** `admin12345`

### 5. Iniciar en Modo Desarrollo

Abre dos terminales:
```bash
# Terminal 1: Backend (Puerto 5000)
cd backend
npm run dev

# Terminal 2: Frontend (Puerto 3000)
cd frontend
npm run dev
```

- **Sitio Público:** http://localhost:3000
- **Panel Administrativo:** http://localhost:3000/admin/login
- **API Health Check:** http://localhost:5000/health

---

## 📦 Guía de Despliegue Paso a Paso a Producción

### Paso 1: Supabase (Base de datos y Storage)

1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto (ej. `detalles-y-mas-db`).
2. Ve al **SQL Editor** y pega el contenido completo de [001_initial_schema.sql](file:///c:/Users/Admin/OneDrive/Escritorio/Detalles%20y%20m%C3%A1s/backend/prisma/migrations/001_initial_schema.sql). Ejecútalo (`Run`).
   - Esto creará el schema `manualidades`, los tipos enumerados, triggers automáticos (`trg_detalle_compra_stock`, `recalcular_total_pedido`), tablas y vistas.
3. Ve a **Storage** en el menú lateral:
   - Haz clic en **New Bucket**.
   - Nombre: `productos`.
   - Marca la casilla **Public Bucket** (para que las fotos se puedan ver en el catálogo sin token firmado).
   - En políticas de Storage (Policies), permite lectura pública y escritura solo a usuarios autenticados o con `service_role`.
4. Ve a **Project Settings -> Database**:
   - Copia la URL del **Connection string** (modo Transaction / Pooler puerto 6543) para `DATABASE_URL`.
   - Copia la URL directa (puerto 5432) para `DIRECT_URL`.
5. Ve a **Project Settings -> API**:
   - Copia la `Project URL` (`SUPABASE_URL`).
   - Copia la clave secreta `service_role` (`SUPABASE_SERVICE_ROLE_KEY`).

### Paso 2: Render (Backend API Web Service)

1. Ingresa a [render.com](https://render.com) y crea un **New Web Service**.
2. Conecta el repositorio de GitHub de este proyecto.
3. Configuración del servicio:
   - **Name:** `detalles-y-mas-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Health Check Path:** `/health`
4. En **Environment Variables**, añade:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (o el que asigne Render)
   - `DATABASE_URL`: Tu cadena de conexión Pooler de Supabase con `?pgbouncer=true&connection_limit=1`
   - `DIRECT_URL`: Tu cadena de conexión directa de Supabase
   - `JWT_SECRET`: Una cadena larga y segura
   - `JWT_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: URL de Vercel (la obtendrás en el Paso 3, ej. `https://detalles-y-mas.vercel.app`)
   - `SUPABASE_URL`: `https://tu-proyecto.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu clave `service_role` de Supabase
   - `SUPABASE_BUCKET`: `productos`
5. Despliega el servicio. Al finalizar, verifica en tu navegador que `https://tu-servicio.onrender.com/health` retorne `{"status":"ok"}`.

### Paso 3: Vercel (Frontend Next.js)

1. Ingresa a [vercel.com](https://vercel.com) y haz clic en **Add New Project**.
2. Selecciona tu repositorio de GitHub.
3. En la configuración del proyecto:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Haz clic en *Edit* y selecciona `frontend`.
4. En **Environment Variables**, añade:
   - `NEXT_PUBLIC_API_URL`: La URL pública de tu backend en Render (ej. `https://detalles-y-mas-api.onrender.com`).
   - `NEXT_PUBLIC_SITE_URL`: La URL asignada por Vercel (ej. `https://detalles-y-mas.vercel.app`).
5. Haz clic en **Deploy**.

### Paso 4: Ajuste Final de CORS y Enlace Cruzado

1. Regresa a Render y asegúrate de que la variable `FRONTEND_URL` coincida exactamente con la URL que te asignó Vercel (sin barra al final, ej. `https://detalles-y-mas.vercel.app`).
2. Ejecuta el seed en producción desde tu terminal local apuntando temporalmente tu `.env` de backend a la base de datos de Supabase:
   ```bash
   cd backend
   npm run db:seed
   ```
3. ¡Listo! Ya puedes ingresar al catálogo público y acceder a `/admin/login` con `admin@detallesymas.ni` / `admin12345`.

---

## 🧪 Flujo de Prueba Integral Verificado

1. **Creación de Producto:** Ve a `/admin/productos`, crea un nuevo producto, sube una foto y asigna materiales en su receta. Comprueba que el margen y costo se calculan en vivo.
2. **Visibilidad Pública:** Ingresa al catálogo público (`/catalogo`) y verifica que el nuevo producto aparece con su precio en C$, fotos y botón de WhatsApp.
3. **Creación de Pedido:** Ve a `/admin/pedidos`, crea un pedido para un cliente, selecciona la entrega y notas. Comprueba que el total suma envío y descuenta promociones.
4. **Registro de Abonos y Saldo:** En la lista o en el tablero Kanban, haz clic en el botón de dólar y registra un anticipo. Verifica que el saldo pendiente se descuenta de inmediato.
5. **Comprobante PDF:** Haz clic en el ícono de impresora para generar el comprobante con membrete, logo, estado de cuenta y botón para guardar en PDF.
6. **Reportes y Kardex:** Ve a `/admin/reportes` y descarga el CSV de pedidos o inventario.

---

## 🔒 Buenas Prácticas de Seguridad Implementadas

- **Aislamiento Total de Supabase:** El frontend nunca se comunica directamente con la base de datos ni posee claves maestras (`service_role`). Toda la información privada (costos, márgenes, clientes) está protegida detrás del backend.
- **Cookies HttpOnly y JWT:** Sesiones seguras sin riesgo de extracción por XSS en el navegador.
- **Rate Limiting:** Protección contra ataques de fuerza bruta en el endpoint de autenticación `/api/admin/auth/login`.
- **Mitigación de Cold Start en Render:** Catálogo público configurado con ISR (revalidación cada 5 minutos) para responder de inmediato sin esperar el arranque del backend.


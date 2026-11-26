-- =====================================================================
--  BASE DE DATOS: DETALLES Y MÁS (PostgreSQL 13+)
--  Esquema completo con extensiones para catálogo público y panel admin
-- =====================================================================

BEGIN;

DROP SCHEMA IF EXISTS manualidades CASCADE;
CREATE SCHEMA manualidades;
SET search_path TO manualidades;

-- ---------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
CREATE TYPE estado_pedido AS ENUM
    ('cotizacion','confirmado','en_produccion','listo','entregado','cancelado');
CREATE TYPE tipo_entrega  AS ENUM ('retiro_local','domicilio','envio');
CREATE TYPE metodo_pago   AS ENUM ('efectivo','transferencia','tarjeta','billetera_movil','otro');
CREATE TYPE tipo_movimiento AS ENUM ('compra','consumo_produccion','ajuste','merma','devolucion');
CREATE TYPE tipo_gasto    AS ENUM ('transporte','empaque','publicidad','servicios','herramientas','otro');

-- ---------------------------------------------------------------------
-- FUNCIÓN GENÉRICA: actualizar columna actualizado_en
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_actualizado_en() RETURNS trigger AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- CATÁLOGO: CATEGORÍAS Y PRODUCTOS
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(80)  NOT NULL UNIQUE,
    descripcion   TEXT,
    activa        BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE productos (
    id                     SERIAL PRIMARY KEY,
    categoria_id           INT           NOT NULL REFERENCES categorias(id),
    codigo                 VARCHAR(30)   NOT NULL UNIQUE,  -- SKU interno
    slug                   VARCHAR(150)  NOT NULL UNIQUE,  -- URL amigable
    nombre                 VARCHAR(120)  NOT NULL,
    descripcion            TEXT,
    precio_venta           NUMERIC(12,2) NOT NULL CHECK (precio_venta >= 0),
    tiempo_elaboracion_min INT           CHECK (tiempo_elaboracion_min >= 0),
    es_personalizable      BOOLEAN       NOT NULL DEFAULT FALSE,
    stock_terminado        INT           NOT NULL DEFAULT 0 CHECK (stock_terminado >= 0),
    imagen_url             TEXT,
    visible_catalogo       BOOLEAN       NOT NULL DEFAULT TRUE,
    destacado              BOOLEAN       NOT NULL DEFAULT FALSE,
    activo                 BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en              TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizado_en         TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_slug ON productos(slug);
CREATE TRIGGER trg_productos_upd BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- Galería de imágenes por producto (almacenadas en Supabase Storage)
CREATE TABLE producto_imagenes (
    id           SERIAL PRIMARY KEY,
    producto_id  INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url          TEXT NOT NULL,
    orden        INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_producto_imagenes_prod ON producto_imagenes(producto_id, orden);

-- ---------------------------------------------------------------------
-- MATERIALES (insumos) Y PROVEEDORES
-- ---------------------------------------------------------------------
CREATE TABLE proveedores (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    contacto    VARCHAR(100),
    telefono    VARCHAR(30),
    email       VARCHAR(120),
    direccion   TEXT,
    notas       TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE materiales (
    id               SERIAL PRIMARY KEY,
    nombre           VARCHAR(120) NOT NULL UNIQUE,
    unidad_medida    VARCHAR(20)  NOT NULL,            -- unidad, metro, pliego, gramo, litro
    stock_actual     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    costo_unitario   NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0), -- último costo
    proveedor_id     INT REFERENCES proveedores(id) ON DELETE SET NULL,
    activo           BOOLEAN NOT NULL DEFAULT TRUE
);

-- Receta: qué materiales (y cuánto) lleva cada producto
CREATE TABLE producto_materiales (
    producto_id  INT NOT NULL REFERENCES productos(id)  ON DELETE CASCADE,
    material_id  INT NOT NULL REFERENCES materiales(id) ON DELETE RESTRICT,
    cantidad     NUMERIC(12,3) NOT NULL CHECK (cantidad > 0),
    PRIMARY KEY (producto_id, material_id)
);

-- ---------------------------------------------------------------------
-- COMPRAS DE MATERIALES
-- ---------------------------------------------------------------------
CREATE TABLE compras (
    id             SERIAL PRIMARY KEY,
    proveedor_id   INT REFERENCES proveedores(id) ON DELETE SET NULL,
    fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
    numero_factura VARCHAR(50),
    total          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    notas          TEXT
);

CREATE TABLE detalle_compras (
    id              SERIAL PRIMARY KEY,
    compra_id       INT NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    material_id     INT NOT NULL REFERENCES materiales(id),
    cantidad        NUMERIC(12,3) NOT NULL CHECK (cantidad > 0),
    costo_unitario  NUMERIC(12,4) NOT NULL CHECK (costo_unitario >= 0),
    subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (round(cantidad * costo_unitario, 2)) STORED
);
CREATE INDEX idx_det_compras_compra ON detalle_compras(compra_id);

-- Historial de movimientos de inventario de materiales
CREATE TABLE movimientos_inventario (
    id           BIGSERIAL PRIMARY KEY,
    material_id  INT NOT NULL REFERENCES materiales(id),
    tipo         tipo_movimiento NOT NULL,
    cantidad     NUMERIC(12,3) NOT NULL,        -- positiva entra, negativa sale
    referencia   VARCHAR(60),                   -- ej. 'compra:12', 'pedido:45', 'ajuste'
    fecha        TIMESTAMPTZ NOT NULL DEFAULT now(),
    notas        TEXT
);
CREATE INDEX idx_mov_material ON movimientos_inventario(material_id, fecha DESC);

-- ---------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(120) NOT NULL,
    telefono        VARCHAR(30),
    whatsapp        VARCHAR(30),
    email           VARCHAR(120),
    direccion       TEXT,
    red_social      VARCHAR(100),               -- usuario de Instagram/Facebook
    fecha_especial  DATE,                       -- cumpleaños/aniversario (para recordatorios)
    notas           TEXT,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_nombre ON clientes (lower(nombre));

-- ---------------------------------------------------------------------
-- PEDIDOS
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
    id                SERIAL PRIMARY KEY,
    cliente_id        INT NOT NULL REFERENCES clientes(id),
    fecha_pedido      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_entrega     TIMESTAMPTZ,
    estado            estado_pedido NOT NULL DEFAULT 'cotizacion',
    tipo_entrega      tipo_entrega  NOT NULL DEFAULT 'retiro_local',
    direccion_entrega TEXT,
    costo_envio       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
    descuento         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    total             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    notas             TEXT,
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado_entrega ON pedidos(estado, fecha_entrega);
CREATE TRIGGER trg_pedidos_upd BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

CREATE TABLE detalle_pedido (
    id                    SERIAL PRIMARY KEY,
    pedido_id             INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id           INT REFERENCES productos(id) ON DELETE SET NULL, -- NULL = pieza 100% a medida
    descripcion           VARCHAR(200) NOT NULL,
    cantidad              INT NOT NULL CHECK (cantidad > 0),
    precio_unitario       NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    costo_estimado        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_estimado >= 0),
    personalizacion       TEXT,                  -- colores, nombre, dedicatoria, etc.
    imagen_referencia_url TEXT,
    subtotal              NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);
CREATE INDEX idx_det_pedido_pedido ON detalle_pedido(pedido_id);

CREATE TABLE pagos (
    id          SERIAL PRIMARY KEY,
    pedido_id   INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
    monto       NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    metodo      metodo_pago NOT NULL DEFAULT 'efectivo',
    es_anticipo BOOLEAN NOT NULL DEFAULT FALSE,
    referencia  VARCHAR(80),
    notas       TEXT
);
CREATE INDEX idx_pagos_pedido ON pagos(pedido_id);

-- ---------------------------------------------------------------------
-- GASTOS GENERALES
-- ---------------------------------------------------------------------
CREATE TABLE gastos (
    id          SERIAL PRIMARY KEY,
    fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo        tipo_gasto NOT NULL DEFAULT 'otro',
    descripcion VARCHAR(200) NOT NULL,
    monto       NUMERIC(12,2) NOT NULL CHECK (monto > 0),
    pedido_id   INT REFERENCES pedidos(id) ON DELETE SET NULL
);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);

-- ---------------------------------------------------------------------
-- USUARIOS ADMINISTRADORES Y CONFIGURACIÓN DEL NEGOCIO
-- ---------------------------------------------------------------------
CREATE TABLE usuarios_admin (
    id                   SERIAL PRIMARY KEY,
    nombre               VARCHAR(120) NOT NULL,
    email                VARCHAR(120) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    activo               BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_verificacion  VARCHAR(10),
    codigo_expira        TIMESTAMPTZ,
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE configuracion_negocio (
    id                  SERIAL PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL DEFAULT 'Detalles y Más',
    lema                VARCHAR(200) NOT NULL DEFAULT 'Hecho con amor para cada ocasión',
    telefono            VARCHAR(30)  DEFAULT '8485-6722',
    whatsapp            VARCHAR(30)  DEFAULT '8485-6722',
    instagram           VARCHAR(100) DEFAULT '@detallesymas.ni',
    facebook            VARCHAR(100) DEFAULT 'https://www.facebook.com/Aracelly82',
    direccion_cobertura TEXT         DEFAULT 'Managua, Nicaragua. Envíos a todo el país.',
    horario             TEXT         DEFAULT 'Lunes a Sábado: 8:00 AM - 6:00 PM',
    sobre_nosotros      TEXT         DEFAULT 'Somos un taller de manualidades y detalles personalizados en Nicaragua. Elaboramos arreglos, adornos y recuerdos únicos hechos a mano con pasión y amor para cada ocasión especial.',
    actualizado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- LÓGICA AUTOMÁTICA
-- ---------------------------------------------------------------------

-- 1) Recalcular total del pedido al cambiar sus líneas o costos
CREATE OR REPLACE FUNCTION recalcular_total_pedido(p_id INT) RETURNS void AS $$
    UPDATE manualidades.pedidos p
       SET total = GREATEST(
              COALESCE((SELECT sum(subtotal) FROM manualidades.detalle_pedido WHERE pedido_id = p_id), 0)
              + p.costo_envio - p.descuento, 0)
     WHERE p.id = p_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION trg_detalle_pedido_total() RETURNS trigger AS $$
BEGIN
    PERFORM recalcular_total_pedido(COALESCE(NEW.pedido_id, OLD.pedido_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detalle_pedido_total
    AFTER INSERT OR UPDATE OR DELETE ON detalle_pedido
    FOR EACH ROW EXECUTE FUNCTION trg_detalle_pedido_total();

CREATE OR REPLACE FUNCTION trg_pedido_recalcula_envio_desc() RETURNS trigger AS $$
BEGIN
    NEW.total := GREATEST(
        COALESCE((SELECT sum(subtotal) FROM manualidades.detalle_pedido WHERE pedido_id = NEW.id), 0)
        + NEW.costo_envio - NEW.descuento, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pedido_recalcula
    BEFORE UPDATE OF costo_envio, descuento ON pedidos
    FOR EACH ROW EXECUTE FUNCTION trg_pedido_recalcula_envio_desc();

-- 2) Al registrar una compra: sube stock, actualiza último costo y deja historial
CREATE OR REPLACE FUNCTION trg_detalle_compra_stock() RETURNS trigger AS $$
BEGIN
    UPDATE manualidades.materiales
       SET stock_actual   = stock_actual + NEW.cantidad,
           costo_unitario = NEW.costo_unitario
     WHERE id = NEW.material_id;

    INSERT INTO manualidades.movimientos_inventario (material_id, tipo, cantidad, referencia)
    VALUES (NEW.material_id, 'compra', NEW.cantidad, 'compra:' || NEW.compra_id);

    UPDATE manualidades.compras c
       SET total = (SELECT COALESCE(sum(subtotal),0) FROM manualidades.detalle_compras WHERE compra_id = NEW.compra_id)
     WHERE c.id = NEW.compra_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detalle_compra_stock
    AFTER INSERT ON detalle_compras
    FOR EACH ROW EXECUTE FUNCTION trg_detalle_compra_stock();

-- ---------------------------------------------------------------------
-- VISTAS ÚTILES
-- ---------------------------------------------------------------------

-- Costo de materiales y margen por producto
CREATE VIEW v_costo_productos AS
SELECT p.id, p.codigo, p.nombre, p.precio_venta,
       COALESCE(sum(pm.cantidad * m.costo_unitario), 0)::NUMERIC(12,2) AS costo_materiales,
       (p.precio_venta - COALESCE(sum(pm.cantidad * m.costo_unitario), 0))::NUMERIC(12,2) AS ganancia_estimada,
       CASE WHEN p.precio_venta > 0
            THEN round(100 * (p.precio_venta - COALESCE(sum(pm.cantidad * m.costo_unitario),0)) / p.precio_venta, 1)
       END AS margen_pct
  FROM productos p
  LEFT JOIN producto_materiales pm ON pm.producto_id = p.id
  LEFT JOIN materiales m           ON m.id = pm.material_id
 GROUP BY p.id;

-- Materiales por debajo del stock mínimo
CREATE VIEW v_materiales_por_reponer AS
SELECT m.id, m.nombre, m.unidad_medida, m.stock_actual, m.stock_minimo,
       (m.stock_minimo - m.stock_actual) AS faltante, pr.nombre AS proveedor
  FROM materiales m
  LEFT JOIN proveedores pr ON pr.id = m.proveedor_id
 WHERE m.activo AND m.stock_actual <= m.stock_minimo;

-- Estado de cuenta de cada pedido
CREATE VIEW v_saldo_pedidos AS
SELECT p.id AS pedido_id, c.nombre AS cliente, p.estado, p.fecha_entrega, p.total,
       COALESCE(sum(pg.monto), 0)::NUMERIC(12,2)            AS pagado,
       (p.total - COALESCE(sum(pg.monto), 0))::NUMERIC(12,2) AS saldo
  FROM pedidos p
  JOIN clientes c      ON c.id = p.cliente_id
  LEFT JOIN pagos pg   ON pg.pedido_id = p.id
 GROUP BY p.id, c.nombre;

-- Pedidos pendientes de entregar, ordenados por urgencia
CREATE VIEW v_pedidos_pendientes AS
SELECT * FROM v_saldo_pedidos
 WHERE estado IN ('confirmado','en_produccion','listo')
 ORDER BY fecha_entrega NULLS LAST;

-- Ventas y ganancia por mes (pedidos entregados)
CREATE VIEW v_resumen_mensual AS
SELECT date_trunc('month', p.fecha_entrega)::date AS mes,
       count(DISTINCT p.id)                        AS pedidos,
       sum(d.subtotal)                             AS ventas,
       sum(d.costo_estimado * d.cantidad)          AS costo_estimado,
       sum(d.subtotal - d.costo_estimado * d.cantidad) AS ganancia_bruta
  FROM pedidos p
  JOIN detalle_pedido d ON d.pedido_id = p.id
 WHERE p.estado = 'entregado'
 GROUP BY 1
 ORDER BY 1 DESC;

-- Productos más vendidos
CREATE VIEW v_productos_mas_vendidos AS
SELECT pr.id, pr.nombre, sum(d.cantidad) AS unidades, sum(d.subtotal) AS ingresos
  FROM detalle_pedido d
  JOIN pedidos   p  ON p.id = d.pedido_id AND p.estado <> 'cancelado' AND p.estado <> 'cotizacion'
  JOIN productos pr ON pr.id = d.producto_id
 GROUP BY pr.id
 ORDER BY unidades DESC;

COMMIT;


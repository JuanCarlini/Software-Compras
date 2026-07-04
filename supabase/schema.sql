-- 3) CREAR TYPES (ENUMS)
CREATE TYPE public.estado_activo_inactivo AS ENUM ('activo', 'inactivo');
CREATE TYPE public.proyecto_estado AS ENUM ('planificado','en_ejecucion','finalizado','cancelado');
CREATE TYPE public.moneda_enum AS ENUM ('ARS','USD','EUR');
CREATE TYPE public.oc_estado AS ENUM ('borrador','en_aprobacion','aprobado','rechazado','anulado');
CREATE TYPE public.linea_estado AS ENUM ('borrador','aprobado','rechazado','anulado');
CREATE TYPE public.cert_estado AS ENUM ('borrador','aprobado','rechazado');
CREATE TYPE public.factura_estado AS ENUM ('borrador','aprobado','rechazado','anulado');
CREATE TYPE public.op_estado AS ENUM ('pendiente','aprobado','rechazado','pagado');
CREATE TYPE public.forma_pago_enum AS ENUM ('transferencia','cheque','efectivo','retencion');
CREATE TYPE public.audit_accion AS ENUM ('crear','actualizar','eliminar');

-- Tabla: gu_roles
CREATE TABLE public.gu_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- Tabla: gu_usuario
CREATE TABLE public.gu_usuario (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id BIGINT NOT NULL,
    estado public.estado_activo_inactivo DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_gu_usuario_rol FOREIGN KEY (rol_id) REFERENCES public.gu_roles(id)
);

-- Tabla: gu_proveedores
CREATE TABLE public.gu_proveedores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    cuit VARCHAR(20),
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(150),
    estado public.estado_activo_inactivo DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: gu_proyectos
CREATE TABLE public.gu_proyectos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado public.proyecto_estado DEFAULT 'planificado',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: gu_ordenesdecompra
CREATE TABLE public.gu_ordenesdecompra (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_oc VARCHAR(30) NOT NULL UNIQUE,
    proveedor_id BIGINT NOT NULL,
    proyecto_id BIGINT,
    fecha_oc DATE NOT NULL,
    moneda public.moneda_enum DEFAULT 'ARS',
    total_neto NUMERIC(12,2) DEFAULT 0,
    total_iva NUMERIC(12,2) DEFAULT 0,
    total_con_iva NUMERIC(12,2) DEFAULT 0,
    estado public.oc_estado DEFAULT 'borrador',
    observaciones TEXT,
    created_by BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_oc_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.gu_proveedores(id),
    CONSTRAINT fk_oc_proyecto FOREIGN KEY (proyecto_id) REFERENCES public.gu_proyectos(id),
    CONSTRAINT fk_oc_usuario FOREIGN KEY (created_by) REFERENCES public.gu_usuario(id)
);

-- Tabla: gu_lineasdeordenesdecompra
CREATE TABLE public.gu_lineasdeordenesdecompra (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orden_compra_id BIGINT NOT NULL,
    item_codigo VARCHAR(50),
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(12,2) NOT NULL DEFAULT 1,
    precio_unitario_neto NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 21,
    total_neto NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_con_iva NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado public.linea_estado DEFAULT 'borrador',
    CONSTRAINT fk_loc_oc FOREIGN KEY (orden_compra_id) REFERENCES public.gu_ordenesdecompra(id)
);

-- Tabla: gu_certificaciones
CREATE TABLE public.gu_certificaciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_cert VARCHAR(30) NOT NULL UNIQUE,
    proyecto_id BIGINT NOT NULL,
    proveedor_id BIGINT NOT NULL,
    fecha_cert DATE NOT NULL,
    total_neto NUMERIC(12,2) DEFAULT 0,
    total_con_iva NUMERIC(12,2) DEFAULT 0,
    estado public.cert_estado DEFAULT 'borrador',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_cert_proyecto FOREIGN KEY (proyecto_id) REFERENCES public.gu_proyectos(id),
    CONSTRAINT fk_cert_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.gu_proveedores(id)
);

-- Tabla: gu_lineasdecertificacion
CREATE TABLE public.gu_lineasdecertificacion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    certificacion_id BIGINT NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(12,2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 21,
    total_neto NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_con_iva NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado public.cert_estado DEFAULT 'borrador',
    CONSTRAINT fk_lcert_cert FOREIGN KEY (certificacion_id) REFERENCES public.gu_certificaciones(id)
);

-- Tabla: gu_facturas
CREATE TABLE public.gu_facturas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_factura VARCHAR(30) NOT NULL UNIQUE,
    proveedor_id BIGINT NOT NULL,
    fecha_factura DATE NOT NULL,
    total_neto NUMERIC(12,2) DEFAULT 0,
    total_iva NUMERIC(12,2) DEFAULT 0,
    total_con_iva NUMERIC(12,2) DEFAULT 0,
    estado public.factura_estado DEFAULT 'borrador',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_fact_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.gu_proveedores(id)
);

-- Tabla: gu_lineasdefactura
CREATE TABLE public.gu_lineasdefactura (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    factura_id BIGINT NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(12,2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
    iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 21,
    total_neto NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_con_iva NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado public.factura_estado DEFAULT 'borrador',
    CONSTRAINT fk_lfact_fact FOREIGN KEY (factura_id) REFERENCES public.gu_facturas(id)
);

-- Tabla: gu_facturas_certificaciones (relación entre facturas y certificaciones)
CREATE TABLE public.gu_facturas_certificaciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    factura_id BIGINT NOT NULL,
    certificacion_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_factcert_fact FOREIGN KEY (factura_id) REFERENCES public.gu_facturas(id) ON DELETE CASCADE,
    CONSTRAINT fk_factcert_cert FOREIGN KEY (certificacion_id) REFERENCES public.gu_certificaciones(id),
    CONSTRAINT uq_factura_certificacion UNIQUE (factura_id, certificacion_id)
);

-- Tabla: gu_ordenesdepago
CREATE TABLE public.gu_ordenesdepago (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_op VARCHAR(30) NOT NULL UNIQUE,
    proveedor_id BIGINT NOT NULL,
    fecha_op DATE NOT NULL,
    total_pago NUMERIC(12,2) DEFAULT 0,
    estado public.op_estado DEFAULT 'pendiente',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_op_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.gu_proveedores(id)
);

-- Tabla: gu_lineasdeordenesdepago
CREATE TABLE public.gu_lineasdeordenesdepago (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orden_pago_id BIGINT NOT NULL,
    factura_id BIGINT,
    concepto TEXT,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    forma_pago public.forma_pago_enum DEFAULT 'transferencia',
    CONSTRAINT fk_lop_op FOREIGN KEY (orden_pago_id) REFERENCES public.gu_ordenesdepago(id),
    CONSTRAINT fk_lop_fact FOREIGN KEY (factura_id) REFERENCES public.gu_facturas(id)
);

-- Tabla: gu_lineasdeordenesdepagocaja
CREATE TABLE public.gu_lineasdeordenesdepagocaja (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orden_pago_id BIGINT NOT NULL,
    caja VARCHAR(50) NOT NULL,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_lopc_op FOREIGN KEY (orden_pago_id) REFERENCES public.gu_ordenesdepago(id)
);

-- Tabla: gu_auditoria
CREATE TABLE public.gu_auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_origen VARCHAR(100) NOT NULL,
    registro_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    accion VARCHAR(50) NOT NULL,
    motivo_cambio TEXT,
    fecha_cambio TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id) REFERENCES public.gu_usuario(id)
);

-- Tabla: gu_audit_log
CREATE TABLE public.gu_audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    accion public.audit_accion NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_auditlog_usuario FOREIGN KEY (usuario_id) REFERENCES public.gu_usuario(id)
);

-- 4) ÍNDICES
CREATE INDEX idx_oc_proveedor ON public.gu_ordenesdecompra (proveedor_id);
CREATE INDEX idx_oc_proyecto ON public.gu_ordenesdecompra (proyecto_id);
CREATE INDEX idx_oc_estado ON public.gu_ordenesdecompra (estado);

CREATE INDEX idx_loc_oc ON public.gu_lineasdeordenesdecompra (orden_compra_id);

CREATE INDEX idx_cert_proyecto ON public.gu_certificaciones (proyecto_id);
CREATE INDEX idx_cert_proveedor ON public.gu_certificaciones (proveedor_id);

CREATE INDEX idx_lcert_cert ON public.gu_lineasdecertificacion (certificacion_id);

CREATE INDEX idx_fact_proveedor ON public.gu_facturas (proveedor_id);
CREATE INDEX idx_fact_estado ON public.gu_facturas (estado);

CREATE INDEX idx_lfact_fact ON public.gu_lineasdefactura (factura_id);

CREATE INDEX idx_factcert_fact ON public.gu_facturas_certificaciones (factura_id);
CREATE INDEX idx_factcert_cert ON public.gu_facturas_certificaciones (certificacion_id);

CREATE INDEX idx_op_proveedor ON public.gu_ordenesdepago (proveedor_id);
CREATE INDEX idx_op_estado ON public.gu_ordenesdepago (estado);

CREATE INDEX idx_lop_op ON public.gu_lineasdeordenesdepago (orden_pago_id);

CREATE INDEX idx_lopc_op ON public.gu_lineasdeordenesdepagocaja (orden_pago_id);

CREATE INDEX idx_tabla_registro_aud ON public.gu_auditoria (tabla_origen, registro_id);
CREATE INDEX idx_fecha_aud ON public.gu_auditoria (fecha_cambio);

CREATE INDEX idx_tabla_registro_auditlog ON public.gu_audit_log (tabla_afectada, registro_id);
CREATE INDEX idx_usuario_auditlog ON public.gu_audit_log (usuario_id);
CREATE INDEX idx_fecha_auditlog ON public.gu_audit_log (created_at);

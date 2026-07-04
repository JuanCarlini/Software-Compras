# Gestión Uno - Sistema Integral de Gestión Empresarial

**Facultad De Tecnología Informática**

**Ingeniería En Sistemas Informáticos**

Bases de Datos Aplicada

***Documentación del Proyecto***

**Profesores**:
Luis Mauricio Garcia
Alejo Andres Nardon

**Alumno**:
Juan Carlini

---

## Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Base de Datos](#base-de-datos)
5. [Módulos del Sistema](#módulos-del-sistema)
6. [Capturas del Proyecto](#capturas-del-proyecto)
7. [Modelo Canónico](#modelo-canónico-de-la-base-de-datos)
8. [Repositorio del Proyecto](#repositorio-del-proyecto)

---

## Descripción del Proyecto

**Gestión Uno** es un sistema integral de gestión empresarial diseñado para centralizar las operaciones administrativas y financieras de una organización en una única plataforma web moderna y escalable.

El objetivo principal es optimizar la administración de proveedores, órdenes de compra, órdenes de pago y reportes financieros, automatizando procesos que tradicionalmente se realizan de forma manual, reduciendo errores y proporcionando trazabilidad completa de cada operación.

El sistema fue diseñado bajo una arquitectura modular dividida en áreas funcionales:
- **Gestión de Proveedores**: Control completo del ciclo de vida de proveedores
- **Órdenes de Compra**: Creación, aprobación y seguimiento de órdenes
- **Órdenes de Pago**: Gestión financiera y control de pagos
- **Reportes y Configuración**: Análisis de datos y parametrización del sistema

Gestión Uno busca digitalizar la cadena de suministro y los procesos de compras, garantizando independencia lógica, facilidad de mantenimiento y cumplimiento de las mejores prácticas de desarrollo.

---

## Tecnologías Utilizadas

El proyecto fue desarrollado con tecnologías de vanguardia:

### Frontend
- **Next.js 15.2.4** - Framework React con App Router y Server Components
- **TypeScript 5** - Tipado estático para mayor robustez del código
- **TailwindCSS 3** - Sistema de diseño utility-first
- **Shadcn/ui** - Componentes accesibles y personalizables
- **React Hook Form + Zod** - Validación de formularios type-safe
- **Lucide React** - Iconografía moderna

### Backend
- **Next.js API Routes** - Endpoints RESTful nativos
- **Supabase** - Backend-as-a-Service con PostgreSQL
- **@supabase/ssr** - Autenticación segura con cookies
- **Middleware de Next.js** - Protección de rutas y validación

### Base de Datos
- **PostgreSQL** (via Supabase)
- Diseño normalizado hasta 3FN
- Row Level Security (RLS) para seguridad a nivel de fila
- Triggers automáticos para auditoría (created_at, updated_at)
- Políticas de acceso basadas en roles

### Herramientas de Desarrollo
- **Git & GitHub** - Control de versiones
- **Visual Studio Code** - IDE principal
- **Desktop Commander MCP** - Asistente de desarrollo IA
- **npm** - Gestor de paquetes
- **ESLint & TypeScript** - Calidad de código

---

## Arquitectura del Sistema

### Estructura de Carpetas (Arquitectura MVC adaptada)

```
src/
├── app/                    # App Router de Next.js
│   ├── (auth)/            # Rutas de autenticación
│   │   ├── login/         # Página de inicio de sesión
│   │   └── signup/        # Página de registro
│   ├── (dashboard)/       # Rutas protegidas del dashboard
│   │   ├── dashboard/     # Panel principal
│   │   ├── proveedores/   # CRUD de proveedores
│   │   ├── ordenes-compra/# Gestión de órdenes de compra
│   │   ├── ordenes-pago/  # Gestión de órdenes de pago
│   │   ├── reportes/      # Reportes y estadísticas
│   │   └── configuracion/ # Configuración del sistema
│   └── api/               # API Routes
│       ├── auth/          # Endpoints de autenticación
│       ├── proveedores/   # API de proveedores
│       ├── ordenes-compra/# API de órdenes de compra
│       └── ordenes-pago/  # API de órdenes de pago
├── components/            # Componentes reutilizables
├── controllers/           # Lógica de negocio (Services)
├── models/                # Interfaces y tipos TypeScript
├── views/                 # Componentes de UI (forms, lists, details)
├── lib/                   # Utilidades y configuraciones
│   └── supabase/         # Clientes y tipos de Supabase
├── shared/                # Código compartido
│   ├── constants.ts       # Constantes del sistema
│   ├── utils.ts          # Funciones auxiliares
│   └── use-*.ts          # Custom hooks
└── middleware.ts          # Middleware de autenticación
```

### Patrón de Diseño

**Arquitectura en Capas (Layered Architecture)**

1. **Capa de Presentación** (`/app`, `/views`)
   - Server Components y Client Components
   - Formularios con React Hook Form
   - UI components con Shadcn/ui

2. **Capa de Aplicación** (`/controllers`)
   - Services con lógica de negocio
   - Operaciones CRUD encapsuladas
   - Validación de datos con Zod

3. **Capa de Datos** (`/lib/supabase`)
   - Clientes de Supabase (browser/server)
   - Tipos generados desde la BD
   - Queries optimizadas

4. **Capa de Persistencia** (Supabase PostgreSQL)
   - Tablas normalizadas
   - Triggers y funciones
   - Row Level Security

---

## Base de Datos

### Esquema de Tablas Principales

#### 1. Proveedores
```sql
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  rfc TEXT UNIQUE,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  pais TEXT DEFAULT 'Argentina',
  sitio_web TEXT,
  notas TEXT,
  estado TEXT DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Órdenes de Compra
```sql
CREATE TABLE ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id),
  fecha_creacion TIMESTAMPTZ NOT NULL,
  fecha_entrega TIMESTAMPTZ,
  descripcion TEXT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  impuestos DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  estado TEXT DEFAULT 'Pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Items de Orden de Compra
```sql
CREATE TABLE ordenes_compra_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);
```

#### 4. Órdenes de Pago
```sql
CREATE TABLE ordenes_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  orden_compra_id UUID REFERENCES ordenes_compra(id),
  proveedor_id UUID REFERENCES proveedores(id),
  fecha_creacion TIMESTAMPTZ NOT NULL,
  fecha_vencimiento TIMESTAMPTZ NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  moneda TEXT DEFAULT 'ARS',
  estado TEXT DEFAULT 'Pendiente',
  metodo_pago TEXT NOT NULL,
  referencia_bancaria TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. Perfiles de Usuario
```sql
CREATE TABLE perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT DEFAULT 'usuario',
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Triggers Automáticos

```sql
-- Actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas las tablas
CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

-- Política de lectura para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer"
  ON proveedores FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de escritura para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden escribir"
  ON proveedores FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## Módulos del Sistema

### 1. Autenticación y Seguridad
- **Login/Signup**: Sistema de autenticación con Supabase Auth
- **Middleware**: Protección de rutas y verificación de sesión
- **Roles**: Admin, Usuario, Supervisor, Solo Lectura
- **Perfiles**: Gestión de información de usuario

### 2. Gestión de Proveedores
- **Lista de Proveedores**: Vista completa con filtros y búsqueda
- **Crear Proveedor**: Formulario validado con información completa
- **Editar Proveedor**: Actualización de datos
- **Detalle de Proveedor**: Vista completa con historial
- **Estados**: Activo, Inactivo, Suspendido
- **Validaciones**: RFC único, email válido, campos requeridos

### 3. Órdenes de Compra
- **Crear Orden**: Selección de proveedor, items múltiples
- **Aprobar/Rechazar**: Flujo de aprobación
- **Estados**: Pendiente, En Revisión, Aprobada, Rechazada, Enviada, Recibida
- **Cálculos automáticos**: Subtotal, impuestos, total
- **Items detallados**: Producto, cantidad, precio unitario

### 4. Órdenes de Pago
- **Generar desde OC**: Vinculación automática
- **Métodos de pago**: Transferencia, Cheque, Efectivo, Tarjeta
- **Control de vencimientos**: Alertas de pagos próximos
- **Referencias bancarias**: Trazabilidad completa
- **Estados**: Pendiente, Aprobada, Pagada, Rechazada, Vencida

### 5. Dashboard y Reportes
- **Estadísticas en tiempo real**: Órdenes, pagos, proveedores
- **Gráficos interactivos**: Recharts para visualización
- **Actividad reciente**: Timeline de operaciones
- **Filtros personalizables**: Por fecha, estado, proveedor

### 6. Configuración
- **Datos de la empresa**: Logo, información fiscal
- **Parámetros del sistema**: Moneda, idioma, zona horaria
- **Gestión de usuarios**: Roles y permisos
- **Respaldos**: Exportar/importar configuración

---

## Capturas del Proyecto

### Pantalla de Login
![Login Screen](docs/screenshots/login.png)
*Sistema de autenticación con validación de credenciales*

### Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)
*Vista general con estadísticas y actividad reciente*

### Gestión de Proveedores
![Proveedores List](docs/screenshots/proveedores-list.png)
*Lista completa de proveedores con acciones rápidas*

![Nuevo Proveedor](docs/screenshots/proveedor-nuevo.png)
*Formulario de creación con validación en tiempo real*

### Órdenes de Compra
![Órdenes Compra](docs/screenshots/ordenes-compra.png)
*Gestión completa del ciclo de órdenes de compra*

### Órdenes de Pago
![Órdenes Pago](docs/screenshots/ordenes-pago.png)
*Control financiero y seguimiento de pagos*

---

## Modelo Canónico de la Base de Datos

El modelo canónico de **Gestión Uno** representa la estructura definitiva del sistema, obtenida tras el proceso de análisis y normalización hasta la **Tercera Forma Normal (3FN)**.

### Características del Modelo

1. **Normalización 3FN**
   - Eliminación de redundancias
   - Dependencias funcionales correctas
   - Integridad referencial garantizada

2. **Claves y Relaciones**
   - UUIDs como claves primarias
   - Claves foráneas con ON DELETE CASCADE/SET NULL
   - Índices en campos de búsqueda frecuente

3. **Módulos Principales**

   **A. Administrativo-Financiero**
   - `proveedores`: Registro maestro de proveedores
   - `ordenes_compra`: Órdenes de compra con estado
   - `ordenes_compra_items`: Detalle de productos
   - `ordenes_pago`: Control de pagos y vencimientos

   **B. Seguridad y Usuarios**
   - `auth.users`: Tabla nativa de Supabase
   - `perfiles_usuario`: Información extendida
   - Políticas RLS por tabla

4. **Auditoría Automática**
   - `created_at`: Timestamp de creación
   - `updated_at`: Actualización automática via trigger
   - Trazabilidad completa de operaciones

### Diagrama Entidad-Relación

```
┌─────────────────┐
│   auth.users    │
└────────┬────────┘
         │ 1:1
         │
┌────────┴─────────────┐
│  perfiles_usuario    │
│  ───────────────     │
│  - id (PK,FK)        │
│  - nombre            │
│  - apellido          │
│  - rol               │
└──────────────────────┘

┌──────────────────┐         ┌────────────────────┐
│   proveedores    │ 1:N     │  ordenes_compra    │
│  ──────────────  │────────>│  ───────────────   │
│  - id (PK)       │         │  - id (PK)         │
│  - nombre        │         │  - proveedor_id(FK)│
│  - rfc           │         │  - numero          │
│  - email         │         │  - total           │
│  - estado        │         │  - estado          │
└──────────────────┘         └─────────┬──────────┘
         │                             │ 1:N
         │ 1:N                         │
         │                   ┌─────────┴──────────────┐
         │                   │ ordenes_compra_items   │
         │                   │ ─────────────────────  │
         │                   │ - id (PK)              │
         │                   │ - orden_compra_id (FK) │
         │                   │ - producto             │
         │                   │ - cantidad             │
         │                   └────────────────────────┘
         │ 1:N
         │
┌────────┴─────────────┐
│   ordenes_pago       │
│  ──────────────────  │
│  - id (PK)           │
│  - proveedor_id (FK) │
│  - orden_compra_id(FK│
│  - monto             │
│  - estado            │
└──────────────────────┘
```

El modelo garantiza:
- ✅ Coherencia y escalabilidad
- ✅ Integridad referencial
- ✅ Trazabilidad completa
- ✅ Facilidad de mantenimiento

---

## Repositorio del Proyecto

El código fuente completo se encuentra en GitHub:

**🔗 [https://github.com/JuanCarlini/Gestion-Uno](https://github.com/JuanCarlini/Gestion-Uno)**

### Estructura del Repositorio

```
├── src/              # Código fuente
├── supabase/         # Scripts SQL y migraciones
├── docs/             # Documentación y diagramas
├── public/           # Assets estáticos
├── .env.local        # Variables de entorno (no versionado)
└── package.json      # Dependencias del proyecto
```

### Instalación y Configuración

```bash
# Clonar repositorio
git clone https://github.com/JuanCarlini/Gestion-Uno.git
cd Gestion-Uno

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Supabase

# Ejecutar migraciones
# En Supabase Dashboard > SQL Editor, ejecutar:
# - supabase/schema.sql
# - supabase/seed.sql (opcional)

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
npm start
```

---

## Conclusiones

**Gestión Uno** representa una solución moderna y escalable para la gestión empresarial, combinando las mejores prácticas de desarrollo web con una arquitectura robusta y mantenible.

### Logros del Proyecto

✅ **Arquitectura Modular**: Separación clara de responsabilidades (MVC adaptado)  
✅ **Base de Datos Normalizada**: Diseño 3FN con integridad referencial  
✅ **Seguridad**: Autenticación robusta y RLS a nivel de base de datos  
✅ **UX Moderna**: Interfaz intuitiva con feedback en tiempo real  
✅ **Código Type-Safe**: TypeScript end-to-end para prevenir errores  
✅ **Escalabilidad**: Preparado para crecer con la organización  

### Aprendizajes Clave

- Implementación de arquitectura full-stack con Next.js 15
- Integración de Supabase como Backend-as-a-Service
- Diseño de base de datos relacional normalizada
- Patrones de diseño aplicados (MVC, Repository, Service Layer)
- Best practices de seguridad (RLS, auth cookies, validación)

---

**Fecha de Entrega**: Enero 2025  
**Versión**: 1.0.0  
**Autor**: Juan Carlini

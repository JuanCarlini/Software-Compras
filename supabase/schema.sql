-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Órdenes de Compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  descripcion TEXT NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado TEXT DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Items de Orden de Compra
CREATE TABLE IF NOT EXISTS ordenes_compra_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_compra_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL
);

-- Tabla de Órdenes de Pago
CREATE TABLE IF NOT EXISTS ordenes_pago (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  orden_compra_id UUID REFERENCES ordenes_compra(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
  monto DECIMAL(12, 2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'ARS',
  estado TEXT DEFAULT 'Pendiente',
  metodo_pago TEXT NOT NULL,
  referencia_bancaria TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_proveedores_updated_at 
  BEFORE UPDATE ON proveedores 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_compra_updated_at 
  BEFORE UPDATE ON ordenes_compra 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_pago_updated_at 
  BEFORE UPDATE ON ordenes_pago 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_pago ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo a usuarios autenticados)
CREATE POLICY "Permitir acceso a usuarios autenticados" ON proveedores
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir acceso a usuarios autenticados" ON ordenes_compra
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir acceso a usuarios autenticados" ON ordenes_compra_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir acceso a usuarios autenticados" ON ordenes_pago
  FOR ALL USING (auth.role() = 'authenticated');
-- Tabla de perfiles de usuario (complementa auth.users de Supabase)
CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario',
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (id, nombre, apellido, rol)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(new.raw_user_meta_data->>'apellido', ''),
    COALESCE(new.raw_user_meta_data->>'rol', 'usuario')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS para perfiles
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio perfil" ON perfiles_usuario
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON perfiles_usuario
  FOR UPDATE USING (auth.uid() = id);

-- Insertar roles
INSERT INTO gu_roles (nombre, descripcion) VALUES
  ('Administrador', 'Acceso total al sistema'),
  ('Usuario', 'Usuario estándar con permisos básicos'),
  ('Supervisor', 'Usuario con permisos de supervisión')
ON CONFLICT DO NOTHING;

-- Insertar usuario administrador.
--
-- La credencial NO va en este archivo: el repositorio es público, así que un hash o una
-- clave literal acá equivalen a publicar el acceso de administrador del sistema.
-- (Auditoría 2026-07-23, CN-003: antes esto tenía la contraseña en texto plano en el
--  comentario y su hash bcrypt en el INSERT.)
--
-- Generar el hash con la MISMA librería y costo que usa la app (bcryptjs, ver
-- src/services/usuario.service.ts):
--   node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'LA-CLAVE'
--
-- Y correr este seed pasando las dos variables:
--   psql -v ADMIN_EMAIL="admin@tu-dominio.com" -v ADMIN_PASSWORD_HASH='<hash>' -f seed.sql
--
-- Usar una clave fuerte y única. Si se corre sin las variables, psql aborta — que es el
-- comportamiento buscado: mejor fallar ruidosamente que sembrar una credencial conocida.
INSERT INTO gu_usuario (nombre, email, password_hash, rol_id, estado) VALUES
  ('Administrador', :'ADMIN_EMAIL', :'ADMIN_PASSWORD_HASH', 1, 'activo')
ON CONFLICT (email) DO NOTHING;

-- Insertar datos de ejemplo en proveedores
INSERT INTO gu_proveedores (nombre, cuit, email, telefono, direccion, estado)
VALUES 
  ('ABC Corporation', '20-12345678-9', 'contacto@abc.com', '+54 341 1234567', 'Av. Pellegrini 1234, Rosario', 'activo'),
  ('XYZ Supplies Ltd', '20-87654321-0', 'ventas@xyz.com', '+54 341 7654321', 'San Martín 567, Rosario', 'activo'),
  ('Tech Solutions Inc', '20-11223344-5', 'info@techsol.com', '+54 341 1122334', 'Córdoba 890, Rosario', 'activo')
ON CONFLICT DO NOTHING;

-- Insertar proyectos de ejemplo
INSERT INTO gu_proyectos (nombre, codigo, descripcion, fecha_inicio, fecha_fin, estado)
VALUES
  ('Edificio Central Plaza', 'PROJ-001', 'Construcción de edificio de oficinas en zona céntrica', '2025-01-15', '2025-12-31', 'en_ejecucion'),
  ('Ampliación Planta Industrial', 'PROJ-002', 'Ampliación de planta de producción', '2025-02-01', '2026-06-30', 'planificado'),
  ('Renovación Oficinas Rosario', 'PROJ-003', 'Renovación completa de oficinas administrativas', '2024-11-01', '2025-04-30', 'en_ejecucion')
ON CONFLICT DO NOTHING;

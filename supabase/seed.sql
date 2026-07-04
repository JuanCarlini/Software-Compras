-- Insertar roles
INSERT INTO gu_roles (nombre, descripcion) VALUES
  ('Administrador', 'Acceso total al sistema'),
  ('Usuario', 'Usuario estándar con permisos básicos'),
  ('Supervisor', 'Usuario con permisos de supervisión')
ON CONFLICT DO NOTHING;

-- Insertar usuario administrador (password: admin123)
INSERT INTO gu_usuario (nombre, email, password_hash, rol_id, estado) VALUES
  ('Administrador', 'admin@gestionuno.com', '$2b$10$T58XeMtS.J6fCyw6HxXyxO1DzWsS3kd2AFYMlljD7impAHF.lY5fO', 1, 'activo')
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

-- Insertar datos de ejemplo en proveedores
INSERT INTO proveedores (nombre, rfc, email, telefono, direccion, ciudad, pais, estado)
VALUES 
  ('ABC Corporation', '20-12345678-9', 'contacto@abc.com', '+54 341 1234567', 'Av. Pellegrini 1234', 'Rosario', 'Argentina', 'Activo'),
  ('XYZ Supplies Ltd', '20-87654321-0', 'ventas@xyz.com', '+54 341 7654321', 'San Martín 567', 'Rosario', 'Argentina', 'Activo'),
  ('Tech Solutions Inc', '20-11223344-5', 'info@techsol.com', '+54 341 1122334', 'Córdoba 890', 'Rosario', 'Argentina', 'Activo')
ON CONFLICT DO NOTHING;

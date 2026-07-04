-- Script para limpiar roles duplicados en gu_roles
-- Corregir nombres de roles para que coincidan con el código
-- admin (1), supervisor (2), usuario (3), readonly (4)

BEGIN;

-- Actualizar los nombres de roles existentes a minúsculas sin espacios
UPDATE gu_roles SET nombre = 'admin', descripcion = 'Administrador del sistema con acceso total' WHERE id = 1;
UPDATE gu_roles SET nombre = 'supervisor', descripcion = 'Usuario con permisos de supervisión y aprobación' WHERE id = 2;
UPDATE gu_roles SET nombre = 'usuario', descripcion = 'Usuario estándar con permisos operativos básicos' WHERE id = 3;
UPDATE gu_roles SET nombre = 'readonly', descripcion = 'Usuario con acceso únicamente de lectura' WHERE id = 4;

-- Verificar que quedaron solo los roles correctos
SELECT * FROM gu_roles ORDER BY id;

COMMIT;

-- Resultado esperado:
-- id | nombre
-- ---|----------
--  1 | admin
--  2 | usuario
--  3 | readonly
--  4 | supervisor

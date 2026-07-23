# 🔐 CONFIGURACIÓN DE AUTENTICACIÓN - SUPABASE

> ## ⚠️ DOCUMENTO OBSOLETO — NO SEGUIR ESTAS INSTRUCCIONES
>
> Describe un diseño que **el proyecto nunca implementó**: Supabase Auth, tabla
> `perfiles_usuario`, IDs UUID y registro público por `/signup`.
>
> **Lo que el sistema usa realmente:** JWT propio firmado con `JWT_SECRET` (`jsonwebtoken` +
> `bcryptjs`, verificado con `jose` en el middleware), tabla `gu_usuario` con PK `BIGINT`, y
> **registro público cerrado** — las altas las hace un admin desde `/admin/usuarios`.
> Ver la sección "Autenticación y permisos" de `CLAUDE.md`, que sí está al día.
>
> Se conserva solo como referencia histórica (discrepancia #1 del `CLAUDE.md`: su borrado
> requiere el OK de Juan Andrés). **Las credenciales de ejemplo fueron redactadas el
> 2026-07-23**: este archivo está en un repositorio público y tenía la contraseña real del
> administrador en texto plano (auditoría CN-003).

## 📋 PASOS PARA CONFIGURAR LOGIN/SIGNUP

### 1. Ejecutar Schema en Supabase

Ve a tu Dashboard de Supabase → SQL Editor y ejecuta:

```sql
-- 1. Copia y pega todo el contenido de: supabase/schema.sql
-- Esto creará las tablas necesarias y el trigger automático para perfiles
```

### 2. Configurar Email Authentication

**En Supabase Dashboard:**
1. Ve a **Authentication** → **Providers**
2. Habilita **Email** provider
3. Configura:
   - ✅ Enable Email provider
   - ✅ Confirm email: **DESACTIVAR** (para testing rápido)
   - ⚠️ Para producción: activar confirmación de email

### 3. Crear Primer Usuario (Opcional)

**Opción A - Desde Dashboard:**
1. Ve a **Authentication** → **Users**
2. Click en **Add user** → **Create new user**
3. Ingresa:
   - Email: `admin@gestion.com`
   - Password: `<REDACTADO — usar una clave fuerte y única>`
   - User Metadata (JSON):
   ```json
   {
     "nombre": "Admin",
     "apellido": "Sistema",
     "rol": "admin"
   }
   ```

**Opción B - Usar el formulario de Signup:**
1. Ve a `http://localhost:3000/signup`
2. Completa el formulario
3. El perfil se crea automáticamente

### 4. Verificar Configuración

**Probar Login:**
```
URL: http://localhost:3000/login
Email: admin@gestion.com
Password: <REDACTADO>
```

**Verificar en Supabase:**
```sql
-- Ver usuarios creados
SELECT * FROM auth.users;

-- Ver perfiles asociados
SELECT * FROM perfiles_usuario;
```

## 🔧 TABLAS NECESARIAS

### ✅ auth.users (Tabla nativa de Supabase)
- Gestionada automáticamente por Supabase
- Almacena email, password hash, metadata

### ✅ perfiles_usuario (Tu tabla custom)
```sql
CREATE TABLE perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario',
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 🤖 Trigger Automático
- Al crear usuario en `auth.users`
- Se crea automáticamente perfil en `perfiles_usuario`
- Extrae datos de `user_metadata`

## 📝 NOTAS IMPORTANTES

1. **NO necesitas crear tabla de usuarios** - Supabase Auth maneja esto
2. **Solo necesitas `perfiles_usuario`** - Para info adicional
3. **El trigger hace todo automático** - No código adicional
4. **RLS está habilitado** - Seguridad por defecto

## 🚀 FLUJO DE AUTENTICACIÓN

```
Signup → Supabase Auth → Trigger → Perfil creado
Login → Supabase Auth → Cookie de sesión → Dashboard
```

## ⚠️ TROUBLESHOOTING

**Error: "User already registered"**
- El email ya existe en Supabase
- Usa otro email o elimina el usuario existente

**Error: "Invalid login credentials"**
- Email o contraseña incorrectos
- Verifica que el usuario exista en Authentication → Users

**Perfil no se crea automáticamente:**
```sql
-- Verificar que el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Re-crear trigger si no existe (ejecutar schema.sql de nuevo)
```

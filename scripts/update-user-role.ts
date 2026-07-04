/**
 * Script para actualizar el rol de un usuario en Supabase Auth
 *
 * Uso:
 * 1. Instalar ts-node si no lo tienes: npm install -g ts-node
 * 2. Ejecutar: ts-node scripts/update-user-role.ts <email> <rol>
 *
 * Ejemplo:
 * ts-node scripts/update-user-role.ts admin@gestion.com admin
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateUserRole(email: string, newRole: string) {
  try {
    console.log(`\n🔍 Buscando usuario con email: ${email}`)

    // Obtener el usuario por email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error al listar usuarios:', listError)
      return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      console.error(`❌ No se encontró usuario con email: ${email}`)
      return
    }

    console.log(`✅ Usuario encontrado: ${user.id}`)
    console.log(`   Rol actual: ${user.user_metadata?.rol || 'sin rol'}`)

    // Actualizar el rol del usuario
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          rol: newRole
        }
      }
    )

    if (error) {
      console.error('❌ Error al actualizar usuario:', error)
      return
    }

    console.log(`\n✅ Rol actualizado exitosamente!`)
    console.log(`   Usuario: ${email}`)
    console.log(`   Nuevo rol: ${newRole}`)
    console.log(`\n⚠️  El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto.\n`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2)

if (args.length !== 2) {
  console.error('\n❌ Uso incorrecto')
  console.log('\nUso: ts-node scripts/update-user-role.ts <email> <rol>')
  console.log('\nRoles válidos: admin, supervisor, usuario, readonly')
  console.log('\nEjemplo:')
  console.log('  ts-node scripts/update-user-role.ts admin@gestion.com admin\n')
  process.exit(1)
}

const [email, newRole] = args

// Validar rol
const validRoles = ['admin', 'supervisor', 'usuario', 'readonly']
if (!validRoles.includes(newRole.toLowerCase())) {
  console.error(`\n❌ Rol inválido: ${newRole}`)
  console.log(`\nRoles válidos: ${validRoles.join(', ')}\n`)
  process.exit(1)
}

// Ejecutar
updateUserRole(email, newRole.toLowerCase())

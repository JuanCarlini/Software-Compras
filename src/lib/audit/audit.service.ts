import { createClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/auth/auth.cookies'

// Bitácora de operaciones con usuario (T06). Se escribe SERVER-SIDE, donde el JWT
// identifica al usuario, a gu_auditoria. Complementa el control de cambios que los
// triggers escriben en gu_audit_log (ver supabase/migration_auditoria_t06.sql).

export type AccionAuditoria =
  | 'login' | 'logout'
  | 'crear' | 'actualizar' | 'eliminar'
  | 'aprobar' | 'rechazar' | 'anular'
  | 'activar' | 'suspender' | 'resetear'

interface RegistrarParams {
  usuarioId: number
  tabla: string          // entidad afectada (ej. 'gu_certificaciones', 'sesion')
  registroId: number     // id del registro afectado
  accion: AccionAuditoria
  detalle?: string       // descripción legible de la operación
}

export class AuditService {
  /**
   * Registra una operación en la bitácora. Nunca lanza: un fallo de auditoría
   * no debe romper la operación de negocio que la disparó (best-effort).
   */
  static async registrar({ usuarioId, tabla, registroId, accion, detalle }: RegistrarParams): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('gu_auditoria').insert({
        tabla_origen: tabla,
        registro_id: registroId,
        usuario_id: usuarioId,
        accion,
        motivo_cambio: detalle ?? null,
      })
    } catch (error) {
      console.error('AuditService.registrar falló (no bloqueante):', error)
    }
  }

  /**
   * Atajo para rutas API: resuelve el usuario autenticado desde la cookie y
   * registra la operación. Si no hay usuario, no registra (best-effort).
   */
  static async registrarDesdeRequest(params: Omit<RegistrarParams, 'usuarioId'>): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return
    await AuditService.registrar({ usuarioId: user.id, ...params })
  }
}

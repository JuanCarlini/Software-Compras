const OrdenCompra = require('../models/OrdenCompra');
const OrdenPago = require('../models/OrdenPago');
const Usuario = require('../models/Usuario');
const Caja = require('../models/Caja');
const { query } = require('../config/database');

/**
 * Controlador para la página de inicio y dashboard
 */
const indexController = {
  /**
   * Muestra la página de inicio con resumen del sistema
   */
  index: async (req, res) => {
    try {
      // Obtener estadísticas según el rol del usuario
      const userId = req.session.user.id;
      const isAdmin = req.session.user.rol === 'admin';
      
      // Estadísticas de órdenes de compra
      let ordenesStats;
      
      if (isAdmin) {
        // Admin ve todas las estadísticas
        ordenesStats = await query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borrador,
            SUM(CASE WHEN estado = 'esperando_aprobacion' THEN 1 ELSE 0 END) as esperando_aprobacion,
            SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobado,
            SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazado,
            SUM(CASE WHEN estado_pago = 'pendiente' THEN 1 ELSE 0 END) as pendiente_pago,
            SUM(CASE WHEN estado_pago = 'parcial' THEN 1 ELSE 0 END) as parcial_pago,
            SUM(CASE WHEN estado_pago = 'total' THEN 1 ELSE 0 END) as total_pago
          FROM ordenes_compra
        `);
      } else {
        // Usuario normal ve solo sus estadísticas
        ordenesStats = await query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borrador,
            SUM(CASE WHEN estado = 'esperando_aprobacion' THEN 1 ELSE 0 END) as esperando_aprobacion,
            SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobado,
            SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazado,
            SUM(CASE WHEN estado_pago = 'pendiente' THEN 1 ELSE 0 END) as pendiente_pago,
            SUM(CASE WHEN estado_pago = 'parcial' THEN 1 ELSE 0 END) as parcial_pago,
            SUM(CASE WHEN estado_pago = 'total' THEN 1 ELSE 0 END) as total_pago
          FROM ordenes_compra
          WHERE usuario_id = ?
        `, [userId]);
      }
      
      // Órdenes pendientes de aprobación (para aprobadores)
      let ordenesPendientesAprobacion = [];
      if (req.session.user.rol === 'admin' || req.session.user.rol === 'aprobador') {
        ordenesPendientesAprobacion = await OrdenCompra.findAllWithRelations({
          estado: 'esperando_aprobacion'
        });
        
        // Si no es admin, filtrar por límite de aprobación
        if (req.session.user.rol !== 'admin') {
          const user = await Usuario.findById(userId);
          ordenesPendientesAprobacion = ordenesPendientesAprobacion.filter(
            orden => orden.monto_total <= user.limite_aprobacion
          );
        }
      }
      
      // Estado de las cajas (solo para admin)
      let cajas = [];
      if (isAdmin) {
        cajas = await Caja.findActivas();
      }
      
      // Últimas órdenes de compra creadas
      let ultimasOrdenes;
      if (isAdmin) {
        ultimasOrdenes = await OrdenCompra.findAllWithRelations({
          limit: 5
        });
      } else {
        ultimasOrdenes = await OrdenCompra.findAllWithRelations({
          usuarioId: userId,
          limit: 5
        });
      }
      
      // Últimos pagos realizados
      let ultimosPagos;
      if (isAdmin) {
        ultimosPagos = await OrdenPago.findAllWithRelations({
          limit: 5
        });
      } else {
        ultimosPagos = await OrdenPago.findAllWithRelations({
          usuarioId: userId,
          limit: 5
        });
      }
      
      res.render('index', {
        title: 'Panel de Control',
        user: req.session.user,
        ordenesStats: ordenesStats[0],
        ordenesPendientesAprobacion,
        cajas,
        ultimasOrdenes,
        ultimosPagos
      });
      
    } catch (error) {
      console.error('Error al cargar el dashboard:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar la página de inicio'
      });
    }
  }
};

module.exports = indexController;
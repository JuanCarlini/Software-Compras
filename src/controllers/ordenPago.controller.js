const OrdenPago = require('../models/OrdenPago');
const OrdenCompra = require('../models/OrdenCompra');
const Proveedor = require('../models/Proveedor');
const Caja = require('../models/Caja');

/**
 * Controlador para la gestión de órdenes de pago
 */
const ordenPagoController = {
  /**
   * Muestra la lista de órdenes de pago
   */
  index: async (req, res) => {
    try {
      // Filtros
      const estados = ['borrador', 'parcial', 'total'];
      
      const estado = req.query.estado;
      const proveedorId = req.query.proveedor;
      const cajaId = req.query.caja;
      const usuarioId = req.session.user.rol === 'admin' ? req.query.usuario : req.session.user.id;
      
      const options = {};
      
      if (estado && estados.includes(estado)) {
        options.estado = estado;
      }
      
      if (proveedorId) {
        options.proveedorId = proveedorId;
      }
      
      if (cajaId) {
        options.cajaId = cajaId;
      }
      
      if (usuarioId && req.session.user.rol !== 'admin') {
        options.usuarioId = usuarioId;
      }
      
      // Obtener las órdenes de pago
      const ordenesPago = await OrdenPago.findAllWithRelations(options);
      
      // Obtener la lista de proveedores para el filtro
      const proveedores = await Proveedor.findActivos();
      
      // Obtener la lista de cajas para el filtro
      const cajas = await Caja.findActivas();
      
      res.render('ordenes-pago/index', {
        title: 'Órdenes de Pago',
        ordenesPago,
        proveedores,
        cajas,
        filtros: {
          estado: estado || '',
          proveedor: proveedorId || '',
          caja: cajaId || ''
        },
        successMessage: req.session.successMessage || null
      });
      
      // Limpiar mensaje de éxito
      req.session.successMessage = null;
      
    } catch (error) {
      console.error('Error al listar órdenes de pago:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener la lista de órdenes de pago'
      });
    }
  },
  
  /**
   * Muestra el formulario para seleccionar proveedor para nueva orden de pago
   */
  selectProveedor: async (req, res) => {
    try {
      // Obtener la lista de proveedores
      const proveedores = await Proveedor.findActivos();
      
      res.render('ordenes-pago/select-proveedor', {
        title: 'Seleccionar Proveedor',
        proveedores,
        error: null
      });
      
    } catch (error) {
      console.error('Error al cargar formulario de selección de proveedor:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar el formulario de selección de proveedor'
      });
    }
  },
  
  /**
   * Muestra el formulario para seleccionar orden de compra para nueva orden de pago
   */
  selectOrdenCompra: async (req, res) => {
    try {
      const { proveedorId } = req.params;
      
      // Verificar si el proveedor existe
      const proveedor = await Proveedor.findById(proveedorId);
      
      if (!proveedor) {
        return res.status(404).render('error', {
          title: 'Proveedor no encontrado',
          message: 'El proveedor solicitado no existe'
        });
      }
      
      // Obtener órdenes de compra aprobadas para este proveedor que no estén pagadas totalmente
      const ordenesCompra = await OrdenCompra.findApprovedForPayment(proveedorId);
      
      if (ordenesCompra.length === 0) {
        return res.render('ordenes-pago/select-proveedor', {
          title: 'Seleccionar Proveedor',
          proveedores: await Proveedor.findActivos(),
          error: `No hay órdenes de compra pendientes de pago para el proveedor ${proveedor.nombre}`
        });
      }
      
      // Calcular el porcentaje pagado para cada orden
      for (const orden of ordenesCompra) {
        orden.porcentaje_pagado = await OrdenCompra.getPorcentajePagado(orden.id);
      }
      
      res.render('ordenes-pago/select-orden', {
        title: 'Seleccionar Orden de Compra',
        proveedor,
        ordenesCompra,
        error: null
      });
      
    } catch (error) {
      console.error('Error al cargar formulario de selección de orden:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar el formulario de selección de orden de compra'
      });
    }
  },
  
  /**
   * Muestra el formulario para crear una nueva orden de pago
   */
  create: async (req, res) => {
    try {
      const { ordenCompraId } = req.params;
      
      // Verificar si la orden de compra existe
      const ordenCompra = await OrdenCompra.findWithRelations(ordenCompraId);
      
      if (!ordenCompra) {
        return res.status(404).render('error', {
          title: 'Orden no encontrada',
          message: 'La orden de compra solicitada no existe'
        });
      }
      
      // Verificar que la orden esté aprobada
      if (ordenCompra.estado !== 'aprobado') {
        return res.status(400).render('error', {
          title: 'Operación no permitida',
          message: 'Solo se pueden pagar órdenes aprobadas'
        });
      }
      
      // Obtener cajas activas según la moneda de la orden
      const cajas = await Caja.findPorMoneda(ordenCompra.moneda);
      
      // Calcular el porcentaje pagado hasta ahora
      const porcentajePagado = await OrdenCompra.getPorcentajePagado(ordenCompraId);
      
      // Calcular monto pendiente
      const montoPendiente = ordenCompra.monto_total * (1 - porcentajePagado / 100);
      
      res.render('ordenes-pago/create', {
        title: 'Crear Orden de Pago',
        ordenCompra,
        cajas,
        porcentajePagado,
        montoPendiente,
        ordenPago: {},
        error: null
      });
      
    } catch (error) {
      console.error('Error al cargar formulario de orden de pago:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar el formulario de orden de pago'
      });
    }
  },
  
  /**
   * Almacena una nueva orden de pago en la base de datos
   */
  store: async (req, res) => {
    try {
      const { ordenCompraId } = req.params;
      const { caja_id, monto, porcentaje, observaciones } = req.body;
      
      // Verificar si la orden de compra existe
      const ordenCompra = await OrdenCompra.findById(ordenCompraId);
      
      if (!ordenCompra) {
        return res.status(404).render('error', {
          title: 'Orden no encontrada',
          message: 'La orden de compra solicitada no existe'
        });
      }
      
      // Crear la orden de pago
      const ordenPagoData = {
        orden_compra_id: ordenCompraId,
        caja_id,
        usuario_id: req.session.user.id,
        monto: parseFloat(monto),
        porcentaje: parseFloat(porcentaje) || (parseFloat(monto) / ordenCompra.monto_total) * 100,
        observaciones: observaciones || null
      };
      
      const ordenPago = await OrdenPago.create(ordenPagoData);
      
      req.session.successMessage = 'Orden de pago creada correctamente';
      res.redirect(`/ordenes-pago/${ordenPago.id}`);
      
    } catch (error) {
      console.error('Error al crear orden de pago:', error);
      
      // Si es un error específico del negocio, mostrarlo
      if (error.message === 'La caja seleccionada no tiene saldo suficiente' ||
          error.message === 'Solo se pueden pagar órdenes aprobadas') {
        
        // Recargar el formulario con los datos
        const ordenCompra = await OrdenCompra.findWithRelations(req.params.ordenCompraId);
        const cajas = await Caja.findPorMoneda(ordenCompra.moneda);
        const porcentajePagado = await OrdenCompra.getPorcentajePagado(req.params.ordenCompraId);
        const montoPendiente = ordenCompra.monto_total * (1 - porcentajePagado / 100);
        
        return res.render('ordenes-pago/create', {
          title: 'Crear Orden de Pago',
          ordenCompra,
          cajas,
          porcentajePagado,
          montoPendiente,
          ordenPago: req.body,
          error: error.message
        });
      }
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al crear la orden de pago'
      });
    }
  },
  
  /**
   * Muestra los detalles de una orden de pago
   */
  show: async (req, res) => {
    try {
      const { id } = req.params;
      const ordenPago = await OrdenPago.findWithRelations(id);
      
      if (!ordenPago) {
        return res.status(404).render('error', {
          title: 'Orden no encontrada',
          message: 'La orden de pago solicitada no existe'
        });
      }
      
      // Obtener la orden de compra relacionada
      const ordenCompra = await OrdenCompra.findWithRelations(ordenPago.orden_compra_id);
      
      // Calcular el porcentaje total pagado de la orden de compra
      const porcentajePagado = await OrdenCompra.getPorcentajePagado(ordenPago.orden_compra_id);
      
      res.render('ordenes-pago/show', {
        title: `Orden de Pago ${ordenPago.numero}`,
        ordenPago,
        ordenCompra,
        porcentajePagado,
        user: req.session.user
      });
      
    } catch (error) {
      console.error('Error al mostrar orden de pago:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener los datos de la orden de pago'
      });
    }
  },
  
  /**
   * Anula una orden de pago
   */
  anular: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario sea admin o anulador
      if (req.session.user.rol !== 'admin' && req.session.user.rol !== 'anulador') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para anular órdenes de pago'
        });
      }
      
      // Anular la orden de pago
      await OrdenPago.anular(id, req.session.user.id);
      
      res.json({
        success: true,
        message: 'Orden de pago anulada correctamente'
      });
      
    } catch (error) {
      console.error('Error al anular orden de pago:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al anular la orden de pago'
      });
    }
  },
  
  /**
   * Obtiene el historial de pagos de una orden de compra
   */
  historialPagos: async (req, res) => {
    try {
      const { ordenCompraId } = req.params;
      
      // Verificar si la orden de compra existe
      const ordenCompra = await OrdenCompra.findWithRelations(ordenCompraId);
      
      if (!ordenCompra) {
        return res.status(404).json({
          success: false,
          message: 'Orden de compra no encontrada'
        });
      }
      
      // Obtener el historial de pagos
      const pagos = await OrdenPago.getHistorialPagos(ordenCompraId);
      
      // Calcular el porcentaje total pagado
      const porcentajePagado = await OrdenCompra.getPorcentajePagado(ordenCompraId);
      
      res.json({
        success: true,
        pagos,
        porcentajePagado,
        ordenCompra
      });
      
    } catch (error) {
      console.error('Error al obtener historial de pagos:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener el historial de pagos'
      });
    }
  },
  
  /**
   * Genera un reporte de órdenes de pago
   */
  reporte: async (req, res) => {
    try {
      // Filtros
      const fechaDesde = req.query.desde ? new Date(req.query.desde) : null;
      const fechaHasta = req.query.hasta ? new Date(req.query.hasta) : null;
      const proveedorId = req.query.proveedor;
      const cajaId = req.query.caja;
      
      let whereCondition = '1=1';
      const params = [];
      
      if (fechaDesde) {
        whereCondition += ' AND op.fecha_pago >= ?';
        params.push(fechaDesde);
      }
      
      if (fechaHasta) {
        whereCondition += ' AND op.fecha_pago <= ?';
        // Ajustar al final del día
        fechaHasta.setHours(23, 59, 59);
        params.push(fechaHasta);
      }
      
      if (proveedorId) {
        whereCondition += ' AND oc.proveedor_id = ?';
        params.push(proveedorId);
      }
      
      if (cajaId) {
        whereCondition += ' AND op.caja_id = ?';
        params.push(cajaId);
      }
      
      // Obtener las órdenes de pago con el filtro
      const sql = `
        SELECT op.*, oc.numero as orden_compra_numero, p.nombre as proveedor_nombre,
               c.nombre as caja_nombre, u.nombre as usuario_nombre, c.moneda
        FROM ordenes_pago op
        JOIN ordenes_compra oc ON op.orden_compra_id = oc.id
        JOIN proveedores p ON oc.proveedor_id = p.id
        JOIN cajas c ON op.caja_id = c.id
        JOIN usuarios u ON op.usuario_id = u.id
        WHERE ${whereCondition}
        ORDER BY op.fecha_pago DESC
      `;
      
      const ordenesPago = await query(sql, params);
      
      // Obtener la lista de proveedores y cajas para los filtros
      const proveedores = await Proveedor.findActivos();
      const cajas = await Caja.findActivas();
      
      // Calcular totales por moneda
      const totalesPorMoneda = {};
      
      ordenesPago.forEach(op => {
        if (!totalesPorMoneda[op.moneda]) {
          totalesPorMoneda[op.moneda] = 0;
        }
        totalesPorMoneda[op.moneda] += parseFloat(op.monto);
      });
      
      res.render('ordenes-pago/reporte', {
        title: 'Reporte de Órdenes de Pago',
        ordenesPago,
        proveedores,
        cajas,
        totalesPorMoneda,
        filtros: {
          desde: req.query.desde || '',
          hasta: req.query.hasta || '',
          proveedor: proveedorId || '',
          caja: cajaId || ''
        }
      });
      
    } catch (error) {
      console.error('Error al generar reporte de órdenes de pago:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al generar el reporte de órdenes de pago'
      });
    }
  }
};

module.exports = ordenPagoController;
const OrdenCompra = require('../models/OrdenCompra');
const LineaOrdenCompra = require('../models/LineaOrdenCompra');
const Proveedor = require('../models/Proveedor');
const Usuario = require('../models/Usuario');

/**
 * Controlador para la gestión de órdenes de compra
 */
const ordenCompraController = {
  /**
   * Muestra la lista de órdenes de compra
   */
  index: async (req, res) => {
    try {
      // Filtros
      const estados = ['borrador', 'esperando_aprobacion', 'aprobado', 'rechazado'];
      const estadosPago = ['pendiente', 'parcial', 'total'];
      
      const estado = req.query.estado;
      const proveedorId = req.query.proveedor;
      const usuarioId = req.session.user.rol === 'admin' ? req.query.usuario : req.session.user.id;
      
      const options = {};
      
      if (estado && estados.includes(estado)) {
        options.estado = estado;
      }
      
      if (proveedorId) {
        options.proveedorId = proveedorId;
      }
      
      if (usuarioId && req.session.user.rol !== 'admin') {
        options.usuarioId = usuarioId;
      }
      
      // Obtener las órdenes
      const ordenes = await OrdenCompra.findAllWithRelations(options);
      
      // Obtener la lista de proveedores para el filtro
      const proveedores = await Proveedor.findActivos();
      
      // Obtener la lista de usuarios para el filtro (solo admin)
      let usuarios = [];
      if (req.session.user.rol === 'admin') {
        usuarios = await Usuario.findAll();
      }
      
      res.render('ordenes-compra/index', {
        title: 'Órdenes de Compra',
        ordenes,
        proveedores,
        usuarios,
        filtros: {
          estado: estado || '',
          proveedor: proveedorId || '',
          usuario: usuarioId || ''
        },
        successMessage: req.session.successMessage || null
      });
      
      // Limpiar mensaje de éxito
      req.session.successMessage = null;
      
    } catch (error) {
      console.error('Error al listar órdenes de compra:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener la lista de órdenes de compra'
      });
    }
  },
  
  /**
   * Muestra el formulario para crear una nueva orden de compra
   */
  create: async (req, res) => {
    try {
      // Obtener la lista de proveedores
      const proveedores = await Proveedor.findActivos();
      
      res.render('ordenes-compra/create', {
        title: 'Crear Orden de Compra',
        orden: {},
        proveedores,
        error: null
      });
      
    } catch (error) {
      console.error('Error al cargar formulario de orden de compra:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cargar el formulario de orden de compra'
      });
    }
  },
  
  /**
   * Almacena una nueva orden de compra en la base de datos
   */
  store: async (req, res) => {
    try {
      const { 
        proveedor_id, titulo, moneda, forma_pago, 
        cuotas, fecha_entrega, observaciones 
      } = req.body;
      
      // Crear la orden de compra
      const ordenData = {
        proveedor_id,
        usuario_id: req.session.user.id,
        titulo,
        moneda: moneda || 'peso',
        forma_pago: forma_pago || 'contado',
        cuotas: forma_pago === 'cuotas' ? cuotas : 1,
        fecha_entrega: fecha_entrega || null,
        observaciones: observaciones || null
      };
      
      const orden = await OrdenCompra.create(ordenData);
      
      req.session.successMessage = 'Orden de compra creada correctamente';
      res.redirect(`/ordenes-compra/${orden.id}/lineas`);
      
    } catch (error) {
      console.error('Error al crear orden de compra:', error);
      
      // Obtener la lista de proveedores para mostrar el formulario nuevamente
      const proveedores = await Proveedor.findActivos();
      
      res.render('ordenes-compra/create', {
        title: 'Crear Orden de Compra',
        orden: req.body,
        proveedores,
        error: 'Error al crear la orden de compra'
      });
    }
  },
  
  /**
   * Muestra el formulario para editar una orden de compra
   */
  edit: async (req, res) => {
    try {
      const { id } = req.params;
      const orden = await OrdenCompra.findWithRelations(id);
      
      if (!orden) {
        return res.status(404).render('error', {
          title: 'Orden no encontrada',
          message: 'La orden de compra solicitada no existe'
        });
      }
      
      // Solo permitir editar órdenes en estado borrador
      if (orden.estado !== 'borrador') {
        return res.status(403).render('error', {
          title: 'Operación no permitida',
          message: 'Solo se pueden editar órdenes en estado borrador'
        });
      }
      
      // Si no es admin, verificar que el usuario sea el creador
      if (req.session.user.rol !== 'admin' && orden.usuario_id !== req.session.user.id) {
        return res.status(403).render('error', {
          title: 'Acceso denegado',
          message: 'No tienes permisos para editar esta orden'
        });
      }
      
      // Obtener la lista de proveedores
      const proveedores = await Proveedor.findActivos();
      
      res.render('ordenes-compra/edit', {
        title: 'Editar Orden de Compra',
        orden,
        proveedores,
        error: null
      });
      
    } catch (error) {
      console.error('Error al obtener orden para editar:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener los datos de la orden de compra'
      });
    }
  },
  
  /**
   * Actualiza una orden de compra en la base de datos
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        proveedor_id, titulo, moneda, forma_pago, 
        cuotas, fecha_entrega, observaciones 
      } = req.body;
      
      // Verificar si la orden existe
      const orden = await OrdenCompra.findById(id);
      
      if (!orden) {
        return res.status(404).render('error', {
          title: 'Orden no encontrada',
          message: 'La orden de compra solicitada no existe'
        });
      }
      
      // Solo permitir editar órdenes en estado borrador
      if (orden.estado !== 'borrador') {
        return res.status(403).render('error', {
          title: 'Operación no permitida',
          message: 'Solo se pueden editar órdenes en estado borrador'
        });
      }
      
      // Si no es admin, verificar que el usuario sea el creador
      if (req.session.user.rol !== 'admin' && orden.usuario_id !== req.session.user.id) {
        return res.status(403).render('error', {
          title: 'Acceso denegado',
          message: 'No tienes permisos para editar esta orden'
        });
      }
      
      // Preparar los datos para actualizar
      const ordenData = {
        proveedor_id,
        titulo,
        moneda: moneda || 'peso',
        forma_pago: forma_pago || 'contado',
        cuotas: forma_pago === 'cuotas' ? cuotas : 1,
        fecha_entrega: fecha_entrega || null,
        observaciones: observaciones || null
      };
      
      // Actualizar la orden
      await OrdenCompra.update(id, ordenData);
      
      req.session.successMessage = 'Orden de compra actualizada correctamente';
      res.redirect(`/ordenes-compra/${id}/lineas`);
      
    } catch (error) {
      console.error('Error al actualizar orden de compra:', error);
      
      // Obtener la lista de proveedores para mostrar el formulario nuevamente
      const proveedores = await Proveedor.findActivos();
      
      res.render('ordenes-compra/edit', {
        title: 'Editar Orden de Compra',
        orden: { ...req.body, id: req.params.id },
        proveedores,
        error: 'Error al actualizar la orden de compra'
      });
    }
  },
  
  /**
   * Muestra los detalles de una orden de compra
   */
  show: async (req, res) => {
    try {
      const { id } = req.params;
      const orden = await OrdenCompra.findWithRelations(id);
      
      if (!orden) {
        return res.status(404).render('error', {
          title: 'Orden no encontrada',
          message: 'La orden de compra solicitada no existe'
        });
      }
      
      // Obtener las líneas de la orden
      const lineas = await LineaOrdenCompra.findByOrdenCompra(id);
      
      // Verificar si el usuario puede aprobar esta orden
      const puedeAprobar = await Usuario.puedeAprobar(req.session.user.id, orden.monto_total);
      
      // Obtener el porcentaje pagado
      const porcentajePagado = await OrdenCompra.getPorcentajePagado(id);
      
      res.render('ordenes-compra/show', {
        title: `Orden de Compra ${orden.numero}`,
        orden,
        lineas,
        puedeAprobar,
        porcentajePagado,
        user: req.session.user
      });
      
    } catch (error) {
      console.error('Error al mostrar orden de compra:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener los datos de la orden de compra'
      });
    }
  },
  
  /**
   * Muestra la sección de líneas de una orden de compra
   */
  showLineas: async (req, res) => {
    try {
      const { id } = req.params;
      const orden = await OrdenCompra.findWithRelations(id);
      
      if (!orden) {
        return res.status(404).render('error', {
          title: 'Orden no encontrada',
          message: 'La orden de compra solicitada no existe'
        });
      }
      
      // Solo permitir editar líneas en órdenes en estado borrador
      if (orden.estado !== 'borrador') {
        return res.redirect(`/ordenes-compra/${id}`);
      }
      
      // Si no es admin, verificar que el usuario sea el creador
      if (req.session.user.rol !== 'admin' && orden.usuario_id !== req.session.user.id) {
        return res.status(403).render('error', {
          title: 'Acceso denegado',
          message: 'No tienes permisos para editar esta orden'
        });
      }
      
      // Obtener las líneas de la orden
      const lineas = await LineaOrdenCompra.findByOrdenCompra(id);
      
      res.render('ordenes-compra/lineas', {
        title: `Líneas - Orden ${orden.numero}`,
        orden,
        lineas,
        successMessage: req.session.successMessage || null
      });
      
      // Limpiar mensaje de éxito
      req.session.successMessage = null;
      
    } catch (error) {
      console.error('Error al mostrar líneas de orden de compra:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener las líneas de la orden de compra'
      });
    }
  },
  
  /**
   * Almacena una nueva línea de orden de compra
   */
  storeLine: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        tipo, titulo, unidad, cantidad, 
        precio_unitario, iva, observaciones 
      } = req.body;
      
      // Verificar si la orden existe y está en estado borrador
      const orden = await OrdenCompra.findById(id);
      
      if (!orden || orden.estado !== 'borrador') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden agregar líneas a órdenes en estado borrador'
        });
      }
      
      // Crear la línea
      const lineaData = {
        orden_compra_id: id,
        tipo: tipo || 'item',
        titulo,
        unidad: unidad || 'unidad',
        cantidad: parseFloat(cantidad),
        precio_unitario: parseFloat(precio_unitario),
        iva: parseFloat(iva || 21),
        observaciones: observaciones || null
      };
      
      const linea = await LineaOrdenCompra.create(lineaData);
      
      res.json({
        success: true,
        message: 'Línea agregada correctamente',
        linea
      });
      
    } catch (error) {
      console.error('Error al agregar línea a la orden:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al agregar la línea a la orden'
      });
    }
  },
  
  /**
   * Actualiza una línea de orden de compra
   */
  updateLine: async (req, res) => {
    try {
      const { id, lineaId } = req.params;
      const { 
        tipo, titulo, unidad, cantidad, 
        precio_unitario, iva, observaciones 
      } = req.body;
      
      // Verificar si la orden existe y está en estado borrador
      const orden = await OrdenCompra.findById(id);
      
      if (!orden || orden.estado !== 'borrador') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden editar líneas de órdenes en estado borrador'
        });
      }
      
      // Verificar si la línea existe y pertenece a la orden
      const linea = await LineaOrdenCompra.findById(lineaId);
      
      if (!linea || linea.orden_compra_id !== parseInt(id)) {
        return res.status(404).json({
          success: false,
          message: 'Línea no encontrada o no pertenece a esta orden'
        });
      }
      
      // Actualizar la línea
      const lineaData = {
        tipo: tipo || 'item',
        titulo,
        unidad: unidad || 'unidad',
        cantidad: parseFloat(cantidad),
        precio_unitario: parseFloat(precio_unitario),
        iva: parseFloat(iva || 21),
        observaciones: observaciones || null
      };
      
      const lineaActualizada = await LineaOrdenCompra.update(lineaId, lineaData);
      
      res.json({
        success: true,
        message: 'Línea actualizada correctamente',
        linea: lineaActualizada
      });
      
    } catch (error) {
      console.error('Error al actualizar línea de la orden:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la línea de la orden'
      });
    }
  },
  
  /**
   * Elimina una línea de orden de compra
   */
  deleteLine: async (req, res) => {
    try {
      const { id, lineaId } = req.params;
      
      // Verificar si la orden existe y está en estado borrador
      const orden = await OrdenCompra.findById(id);
      
      if (!orden || orden.estado !== 'borrador') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar líneas de órdenes en estado borrador'
        });
      }
      
      // Verificar si la línea existe y pertenece a la orden
      const linea = await LineaOrdenCompra.findById(lineaId);
      
      if (!linea || linea.orden_compra_id !== parseInt(id)) {
        return res.status(404).json({
          success: false,
          message: 'Línea no encontrada o no pertenece a esta orden'
        });
      }
      
      // Eliminar la línea
      await LineaOrdenCompra.eliminar(lineaId, id);
      
      res.json({
        success: true,
        message: 'Línea eliminada correctamente'
      });
      
    } catch (error) {
      console.error('Error al eliminar línea de la orden:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la línea de la orden'
      });
    }
  },
  
  /**
   * Envía una orden de compra para aprobación
   */
  enviarAprobacion: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si la orden existe
      const orden = await OrdenCompra.findById(id);
      
      if (!orden) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      // Verificar que la orden esté en estado borrador
      if (orden.estado !== 'borrador') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden enviar a aprobación órdenes en estado borrador'
        });
      }
      
      // Verificar que tenga líneas
      const lineas = await LineaOrdenCompra.findByOrdenCompra(id);
      
      if (lineas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'La orden debe tener al menos una línea para enviarla a aprobación'
        });
      }
      
      // Cambiar el estado de la orden
      await OrdenCompra.cambiarEstado(id, 'esperando_aprobacion', req.session.user.id);
      
      res.json({
        success: true,
        message: 'Orden enviada a aprobación correctamente'
      });
      
    } catch (error) {
      console.error('Error al enviar orden a aprobación:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al enviar la orden a aprobación'
      });
    }
  },
  
  /**
   * Aprueba una orden de compra
   */
  aprobar: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si la orden existe
      const orden = await OrdenCompra.findById(id);
      
      if (!orden) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      // Verificar que la orden esté en estado esperando aprobación
      if (orden.estado !== 'esperando_aprobacion') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden aprobar órdenes en estado esperando aprobación'
        });
      }
      
      // Verificar si el usuario puede aprobar esta orden (por monto)
      const puedeAprobar = await Usuario.puedeAprobar(req.session.user.id, orden.monto_total);
      
      if (!puedeAprobar) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para aprobar órdenes por este monto'
        });
      }
      
      // Cambiar el estado de la orden
      await OrdenCompra.cambiarEstado(id, 'aprobado', req.session.user.id);
      
      res.json({
        success: true,
        message: 'Orden aprobada correctamente'
      });
      
    } catch (error) {
      console.error('Error al aprobar orden:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al aprobar la orden'
      });
    }
  },
  
  /**
   * Rechaza una orden de compra
   */
  rechazar: async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      
      // Verificar si la orden existe
      const orden = await OrdenCompra.findById(id);
      
      if (!orden) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }
      
      // Verificar que la orden esté en estado esperando aprobación
      if (orden.estado !== 'esperando_aprobacion') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden rechazar órdenes en estado esperando aprobación'
        });
      }
      
      // Verificar si el usuario puede aprobar órdenes (mismo criterio que aprobación)
      const puedeAprobar = req.session.user.rol === 'admin' || req.session.user.rol === 'aprobador';
      
      if (!puedeAprobar) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para rechazar órdenes'
        });
      }
      
      // Cambiar el estado de la orden
      await OrdenCompra.cambiarEstado(id, 'rechazado', req.session.user.id);
      
      // Actualizar observaciones con el motivo del rechazo
      if (motivo) {
        await OrdenCompra.update(id, { 
          observaciones: `[RECHAZADO] ${motivo}\n\n${orden.observaciones || ''}` 
        });
      }
      
      res.json({
        success: true,
        message: 'Orden rechazada correctamente'
      });
      
    } catch (error) {
      console.error('Error al rechazar orden:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al rechazar la orden'
      });
    }
  },
  
  /**
   * Muestra la lista de órdenes pendientes de aprobación (para aprobadores)
   */
  pendientesAprobacion: async (req, res) => {
    try {
      // Obtener órdenes pendientes de aprobación
      const ordenes = await OrdenCompra.findAllWithRelations({ estado: 'esperando_aprobacion' });
      
      // Filtrar por límite de aprobación del usuario si no es admin
      const userId = req.session.user.id;
      const isAdmin = await Usuario.isAdmin(userId);
      
      let ordenesFiltradas = ordenes;
      
      if (!isAdmin) {
        const user = await Usuario.findById(userId);
        ordenesFiltradas = ordenes.filter(orden => orden.monto_total <= user.limite_aprobacion);
      }
      
      res.render('ordenes-compra/pendientes-aprobacion', {
        title: 'Órdenes Pendientes de Aprobación',
        ordenes: ordenesFiltradas,
        successMessage: req.session.successMessage || null
      });
      
      // Limpiar mensaje de éxito
      req.session.successMessage = null;
      
    } catch (error) {
      console.error('Error al listar órdenes pendientes de aprobación:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener la lista de órdenes pendientes'
      });
    }
  },
  
  /**
   * Genera un reporte de órdenes de compra pendientes
   */
  reportePendientes: async (req, res) => {
    try {
      // Obtener órdenes pendientes de pago (aprobadas con pago pendiente o parcial)
      const ordenes = await OrdenCompra.findAllWithRelations({ 
        estado: 'aprobado'
      });
      
      // Filtrar las que tienen estado de pago pendiente o parcial
      const ordenesPendientes = ordenes.filter(
        orden => orden.estado_pago === 'pendiente' || orden.estado_pago === 'parcial'
      );
      
      // Calcular porcentaje pagado para cada orden
      for (const orden of ordenesPendientes) {
        orden.porcentaje_pagado = await OrdenCompra.getPorcentajePagado(orden.id);
      }
      
      res.render('ordenes-compra/reporte-pendientes', {
        title: 'Reporte de Órdenes Pendientes de Pago',
        ordenes: ordenesPendientes
      });
      
    } catch (error) {
      console.error('Error al generar reporte de órdenes pendientes:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al generar el reporte de órdenes pendientes'
      });
    }
  }
};

module.exports = ordenCompraController;
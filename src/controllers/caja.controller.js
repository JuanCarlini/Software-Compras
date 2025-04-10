const Caja = require('../models/Caja');

/**
 * Controlador para la gestión de cajas (fuentes de dinero)
 */
const cajaController = {
  /**
   * Muestra la lista de cajas
   */
  index: async (req, res) => {
    try {
      const cajas = await Caja.findAll({
        orderBy: 'nombre'
      });
      
      res.render('cajas/index', {
        title: 'Gestión de Cajas',
        cajas,
        successMessage: req.session.successMessage || null
      });
      
      // Limpiar mensaje de éxito
      req.session.successMessage = null;
      
    } catch (error) {
      console.error('Error al listar cajas:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener la lista de cajas'
      });
    }
  },
  
  /**
   * Muestra el formulario para crear una nueva caja
   */
  create: (req, res) => {
    res.render('cajas/create', {
      title: 'Crear Caja',
      caja: {},
      error: null
    });
  },
  
  /**
   * Almacena una nueva caja en la base de datos
   */
  store: async (req, res) => {
    try {
      const { nombre, descripcion, saldo, moneda } = req.body;
      
      // Crear la caja
      const cajaData = {
        nombre,
        descripcion: descripcion || null,
        saldo: parseFloat(saldo) || 0,
        moneda: moneda || 'peso',
        activo: true
      };
      
      await Caja.create(cajaData);
      
      req.session.successMessage = 'Caja creada correctamente';
      res.redirect('/cajas');
      
    } catch (error) {
      console.error('Error al crear caja:', error);
      
      res.render('cajas/create', {
        title: 'Crear Caja',
        caja: req.body,
        error: 'Error al crear la caja'
      });
    }
  },
  
  /**
   * Muestra el formulario para editar una caja
   */
  edit: async (req, res) => {
    try {
      const { id } = req.params;
      const caja = await Caja.findById(id);
      
      if (!caja) {
        return res.status(404).render('error', {
          title: 'Caja no encontrada',
          message: 'La caja solicitada no existe'
        });
      }
      
      res.render('cajas/edit', {
        title: 'Editar Caja',
        caja,
        error: null
      });
      
    } catch (error) {
      console.error('Error al obtener caja para editar:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener los datos de la caja'
      });
    }
  },
  
  /**
   * Actualiza una caja en la base de datos
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, saldo, moneda, activo } = req.body;
      
      // Verificar si la caja existe
      const caja = await Caja.findById(id);
      
      if (!caja) {
        return res.status(404).render('error', {
          title: 'Caja no encontrada',
          message: 'La caja solicitada no existe'
        });
      }
      
      // Preparar los datos para actualizar
      const cajaData = {
        nombre,
        descripcion: descripcion || null,
        moneda: moneda || 'peso',
        activo: activo === 'on' || activo === true || activo === 1 ? 1 : 0
      };
      
      // Solo actualizar el saldo si se cambia explícitamente
      if (saldo !== undefined && saldo !== null && saldo !== '') {
        cajaData.saldo = parseFloat(saldo);
      }
      
      // Actualizar la caja
      await Caja.update(id, cajaData);
      
      req.session.successMessage = 'Caja actualizada correctamente';
      res.redirect('/cajas');
      
    } catch (error) {
      console.error('Error al actualizar caja:', error);
      
      res.render('cajas/edit', {
        title: 'Editar Caja',
        caja: { ...req.body, id: req.params.id },
        error: 'Error al actualizar la caja'
      });
    }
  },
  
  /**
   * Muestra el historial de movimientos de una caja
   */
  historial: async (req, res) => {
    try {
      const { id } = req.params;
      const caja = await Caja.findById(id);
      
      if (!caja) {
        return res.status(404).render('error', {
          title: 'Caja no encontrada',
          message: 'La caja solicitada no existe'
        });
      }
      
      const movimientos = await Caja.getHistorialMovimientos(id);
      
      res.render('cajas/historial', {
        title: `Historial de Movimientos - ${caja.nombre}`,
        caja,
        movimientos
      });
      
    } catch (error) {
      console.error('Error al obtener historial de caja:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener el historial de movimientos'
      });
    }
  },
  
  /**
   * Ajusta el saldo de una caja (solo admin)
   */
  ajustarSaldo: async (req, res) => {
    try {
      const { id } = req.params;
      const { monto, motivo } = req.body;
      
      // Verificar si la caja existe
      const caja = await Caja.findById(id);
      
      if (!caja) {
        return res.status(404).json({
          success: false,
          message: 'Caja no encontrada'
        });
      }
      
      // Validar el monto
      if (!monto || isNaN(parseFloat(monto))) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser un número válido'
        });
      }
      
      // Actualizar el saldo
      const nuevoSaldo = caja.saldo + parseFloat(monto);
      await Caja.update(id, { saldo: nuevoSaldo });
      
      // Registrar el ajuste (para futuras implementaciones)
      
      res.json({
        success: true,
        message: 'Saldo ajustado correctamente',
        nuevoSaldo
      });
      
    } catch (error) {
      console.error('Error al ajustar saldo de caja:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al ajustar el saldo de la caja'
      });
    }
  },
  
  /**
   * Busca cajas por moneda para uso en formularios
   */
  getPorMoneda: async (req, res) => {
    try {
      const { moneda } = req.params;
      
      if (!moneda || !['peso', 'dolar'].includes(moneda)) {
        return res.json([]);
      }
      
      const cajas = await Caja.findPorMoneda(moneda);
      
      // Formatear para select2
      const results = cajas.map(c => ({
        id: c.id,
        text: `${c.nombre} (Saldo: ${c.saldo.toFixed(2)} ${moneda === 'peso' ? '$' : 'USD'})`
      }));
      
      res.json(results);
      
    } catch (error) {
      console.error('Error al obtener cajas por moneda:', error);
      res.status(500).json([]);
    }
  },
  
  /**
   * Cambia el estado activo/inactivo de una caja
   */
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si la caja existe
      const caja = await Caja.findById(id);
      
      if (!caja) {
        return res.status(404).json({
          success: false,
          message: 'Caja no encontrada'
        });
      }
      
      // Cambiar el estado
      const nuevoEstado = caja.activo === 1 ? 0 : 1;
      await Caja.update(id, { activo: nuevoEstado });
      
      res.json({
        success: true,
        message: `Caja ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`,
        activo: nuevoEstado
      });
      
    } catch (error) {
      console.error('Error al cambiar estado de la caja:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar el estado de la caja'
      });
    }
  }
};

module.exports = cajaController;
const Proveedor = require('../models/Proveedor');

/**
 * Controlador para la gestión de proveedores
 */
const proveedorController = {
  /**
   * Muestra la lista de proveedores
   */
  index: async (req, res) => {
    try {
      const proveedores = await Proveedor.findAll({
        orderBy: 'nombre'
      });
      
      res.render('proveedores/index', {
        title: 'Gestión de Proveedores',
        proveedores,
        successMessage: req.session.successMessage || null
      });
      
      // Limpiar mensaje de éxito
      req.session.successMessage = null;
      
    } catch (error) {
      console.error('Error al listar proveedores:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener la lista de proveedores'
      });
    }
  },
  
  /**
   * Muestra el formulario para crear un nuevo proveedor
   */
  create: (req, res) => {
    res.render('proveedores/create', {
      title: 'Crear Proveedor',
      proveedor: {},
      error: null
    });
  },
  
  /**
   * Almacena un nuevo proveedor en la base de datos
   */
  store: async (req, res) => {
    try {
      const { nombre, cuit, direccion, telefono, email, contacto } = req.body;
      
      // Crear el proveedor
      const proveedorData = {
        nombre,
        cuit: cuit || null,
        direccion: direccion || null,
        telefono: telefono || null,
        email: email || null,
        contacto: contacto || null,
        activo: true
      };
      
      await Proveedor.create(proveedorData);
      
      req.session.successMessage = 'Proveedor creado correctamente';
      res.redirect('/proveedores');
      
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      
      res.render('proveedores/create', {
        title: 'Crear Proveedor',
        proveedor: req.body,
        error: 'Error al crear el proveedor'
      });
    }
  },
  
  /**
   * Muestra el formulario para editar un proveedor
   */
  edit: async (req, res) => {
    try {
      const { id } = req.params;
      const proveedor = await Proveedor.findById(id);
      
      if (!proveedor) {
        return res.status(404).render('error', {
          title: 'Proveedor no encontrado',
          message: 'El proveedor solicitado no existe'
        });
      }
      
      res.render('proveedores/edit', {
        title: 'Editar Proveedor',
        proveedor,
        error: null
      });
      
    } catch (error) {
      console.error('Error al obtener proveedor para editar:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener los datos del proveedor'
      });
    }
  },
  
  /**
   * Actualiza un proveedor en la base de datos
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, cuit, direccion, telefono, email, contacto, activo } = req.body;
      
      // Verificar si el proveedor existe
      const proveedor = await Proveedor.findById(id);
      
      if (!proveedor) {
        return res.status(404).render('error', {
          title: 'Proveedor no encontrado',
          message: 'El proveedor solicitado no existe'
        });
      }
      
      // Preparar los datos para actualizar
      const proveedorData = {
        nombre,
        cuit: cuit || null,
        direccion: direccion || null,
        telefono: telefono || null,
        email: email || null,
        contacto: contacto || null,
        activo: activo === 'on' || activo === true || activo === 1 ? 1 : 0
      };
      
      // Actualizar el proveedor
      await Proveedor.update(id, proveedorData);
      
      req.session.successMessage = 'Proveedor actualizado correctamente';
      res.redirect('/proveedores');
      
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      
      res.render('proveedores/edit', {
        title: 'Editar Proveedor',
        proveedor: { ...req.body, id: req.params.id },
        error: 'Error al actualizar el proveedor'
      });
    }
  },
  
  /**
   * Cambia el estado activo/inactivo de un proveedor
   */
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si el proveedor existe
      const proveedor = await Proveedor.findById(id);
      
      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
      
      // Verificar si tiene órdenes asociadas antes de desactivar
      if (proveedor.activo && await Proveedor.tieneOrdenesAsociadas(id)) {
        // Si tiene órdenes asociadas, solo se permite desactivar, no eliminar
        await Proveedor.desactivar(id);
        
        return res.json({
          success: true,
          message: 'Proveedor desactivado. No se puede eliminar porque tiene órdenes asociadas.',
          activo: 0
        });
      }
      
      // Cambiar el estado
      const nuevoEstado = proveedor.activo === 1 ? 0 : 1;
      await Proveedor.update(id, { activo: nuevoEstado });
      
      res.json({
        success: true,
        message: `Proveedor ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
        activo: nuevoEstado
      });
      
    } catch (error) {
      console.error('Error al cambiar estado del proveedor:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar el estado del proveedor'
      });
    }
  },
  
  /**
   * Busca proveedores que coincidan con un término de búsqueda
   */
  search: async (req, res) => {
    try {
      const { term } = req.query;
      
      if (!term) {
        return res.json([]);
      }
      
      const proveedores = await Proveedor.buscarPorNombre(term);
      
      // Formatear para select2
      const results = proveedores.map(p => ({
        id: p.id,
        text: p.nombre,
        cuit: p.cuit
      }));
      
      res.json(results);
      
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      res.status(500).json([]);
    }
  },
  
  /**
   * Obtiene los detalles de un proveedor para mostrar en modal o API
   */
  getDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const proveedor = await Proveedor.findById(id);
      
      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
      
      res.json({
        success: true,
        proveedor
      });
      
    } catch (error) {
      console.error('Error al obtener detalles del proveedor:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener los detalles del proveedor'
      });
    }
  }
};

module.exports = proveedorController;
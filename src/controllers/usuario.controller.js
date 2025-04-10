const Usuario = require('../models/Usuario');

/**
 * Controlador para la gestión de usuarios
 */
const usuarioController = {
  /**
   * Muestra la lista de usuarios
   */
  index: async (req, res) => {
    try {
      const usuarios = await Usuario.findAll();
      
      res.render('usuarios/index', {
        title: 'Gestión de Usuarios',
        usuarios,
        currentUser: req.session.user
      });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener la lista de usuarios'
      });
    }
  },
  
  /**
   * Muestra el formulario para crear un nuevo usuario
   */
  create: (req, res) => {
    res.render('usuarios/create', {
      title: 'Crear Usuario',
      user: {},
      error: null
    });
  },
  
  /**
   * Almacena un nuevo usuario en la base de datos
   */
  store: async (req, res) => {
    try {
      const { nombre, email, password, rol, limite_aprobacion = 0 } = req.body;
      
      // Verificar si el email ya existe
      const existingUser = await Usuario.findByEmail(email);
      
      if (existingUser) {
        return res.render('usuarios/create', {
          title: 'Crear Usuario',
          user: req.body,
          error: 'El email ya está registrado'
        });
      }
      
      // Crear el usuario
      const userData = {
        nombre,
        email,
        password,
        rol: rol || 'usuario',
        limite_aprobacion: rol === 'aprobador' ? limite_aprobacion : 0,
        activo: true
      };
      
      await Usuario.create(userData);
      
      req.session.successMessage = 'Usuario creado correctamente';
      res.redirect('/usuarios');
      
    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      res.render('usuarios/create', {
        title: 'Crear Usuario',
        user: req.body,
        error: 'Error al crear el usuario'
      });
    }
  },
  
  /**
   * Muestra el formulario para editar un usuario
   */
  edit: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await Usuario.findById(id);
      
      if (!user) {
        return res.status(404).render('error', {
          title: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe'
        });
      }
      
      res.render('usuarios/edit', {
        title: 'Editar Usuario',
        user,
        error: null
      });
      
    } catch (error) {
      console.error('Error al obtener usuario para editar:', error);
      
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al obtener los datos del usuario'
      });
    }
  },
  
  /**
   * Actualiza un usuario en la base de datos
   */
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, email, password, rol, limite_aprobacion = 0, activo } = req.body;
      
      // Verificar si el usuario existe
      const user = await Usuario.findById(id);
      
      if (!user) {
        return res.status(404).render('error', {
          title: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe'
        });
      }
      
      // Verificar si el email ya está en uso por otro usuario
      if (email !== user.email) {
        const existingUser = await Usuario.findByEmail(email);
        
        if (existingUser) {
          return res.render('usuarios/edit', {
            title: 'Editar Usuario',
            user: { ...user, ...req.body },
            error: 'El email ya está registrado por otro usuario'
          });
        }
      }
      
      // Preparar los datos para actualizar
      const userData = {
        nombre,
        email,
        rol,
        limite_aprobacion: rol === 'aprobador' ? limite_aprobacion : 0,
        activo: activo === 'on' || activo === true || activo === 1 ? 1 : 0
      };
      
      // Añadir la contraseña solo si se proporciona
      if (password && password.trim() !== '') {
        userData.password = password;
      }
      
      // Actualizar el usuario
      await Usuario.update(id, userData);
      
      req.session.successMessage = 'Usuario actualizado correctamente';
      res.redirect('/usuarios');
      
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      
      res.render('usuarios/edit', {
        title: 'Editar Usuario',
        user: { ...req.body, id: req.params.id },
        error: 'Error al actualizar el usuario'
      });
    }
  },
  
  /**
   * Cambia el estado activo/inactivo de un usuario
   */
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si el usuario existe
      const user = await Usuario.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // No permitir desactivar al propio usuario
      if (parseInt(id) === parseInt(req.session.user.id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivar tu propio usuario'
        });
      }
      
      // Cambiar el estado
      const nuevoEstado = user.activo === 1 ? 0 : 1;
      await Usuario.update(id, { activo: nuevoEstado });
      
      res.json({
        success: true,
        message: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
        activo: nuevoEstado
      });
      
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al cambiar el estado del usuario'
      });
    }
  },
  
  /**
   * Elimina un usuario (solo disponible para el administrador)
   */
  destroy: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si el usuario existe
      const user = await Usuario.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // No permitir eliminar al propio usuario
      if (parseInt(id) === parseInt(req.session.user.id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propio usuario'
        });
      }
      
      // Eliminar el usuario
      await Usuario.delete(id);
      
      res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
      
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el usuario'
      });
    }
  }
};

module.exports = usuarioController;
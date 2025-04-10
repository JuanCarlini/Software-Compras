const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('../config/config');
const { query } = require('../config/database');

/**
 * Controlador para la gestión de autenticación
 */
const authController = {
  /**
   * Renderiza el formulario de login
   */
  loginForm: (req, res) => {
    res.render('auth/login', {
      title: 'Iniciar sesión',
      error: null
    });
  },
  
  /**
   * Procesa el login de un usuario
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validar campos
      if (!email || !password) {
        return res.render('auth/login', {
          title: 'Iniciar sesión',
          error: 'Debe ingresar email y contraseña',
          email
        });
      }
      
      // Autenticar usuario
      const user = await Usuario.authenticate(email, password);
      
      if (!user) {
        return res.render('auth/login', {
          title: 'Iniciar sesión',
          error: 'Credenciales inválidas',
          email
        });
      }
      
      // Verificar si el usuario está activo
      if (!user.activo) {
        return res.render('auth/login', {
          title: 'Iniciar sesión',
          error: 'Esta cuenta ha sido desactivada',
          email
        });
      }
      
      // Crear sesión de usuario
      req.session.user = user;
      
      // Generar token JWT (para API si es necesario)
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      
      // Almacenar token en cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 día
      });
      
      // Redireccionar a la página solicitada originalmente o al dashboard
      const returnTo = req.session.returnTo || '/';
      delete req.session.returnTo;
      
      res.redirect(returnTo);
      
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      res.render('auth/login', {
        title: 'Iniciar sesión',
        error: 'Ha ocurrido un error al procesar el login',
        email: req.body.email
      });
    }
  },
  
  /**
   * Cierra la sesión del usuario
   */
  logout: (req, res) => {
    // Destruir sesión
    req.session.destroy();
    
    // Eliminar cookie de token
    res.clearCookie('token');
    
    // Redireccionar al login
    res.redirect('/auth/login');
  },
  
  /**
   * Renderiza el formulario para cambiar contraseña
   */
  changePasswordForm: (req, res) => {
    res.render('auth/change-password', {
      title: 'Cambiar contraseña',
      error: null,
      success: null
    });
  },
  
  /**
   * Procesa el cambio de contraseña del usuario
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.session.user.id;
      
      // Validar campos
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.render('auth/change-password', {
          title: 'Cambiar contraseña',
          error: 'Todos los campos son obligatorios',
          success: null
        });
      }
      
      if (newPassword.length < 6) {
        return res.render('auth/change-password', {
          title: 'Cambiar contraseña',
          error: 'La nueva contraseña debe tener al menos 6 caracteres',
          success: null
        });
      }
      
      if (newPassword !== confirmPassword) {
        return res.render('auth/change-password', {
          title: 'Cambiar contraseña',
          error: 'La nueva contraseña y su confirmación no coinciden',
          success: null
        });
      }
      
      // Obtener el usuario con la contraseña
      const sqlQuery = `SELECT password FROM usuarios WHERE id = ?`;
      const result = await query(sqlQuery, [userId]);
      
      if (!result || !result.length) {
        return res.render('auth/change-password', {
          title: 'Cambiar contraseña',
          error: 'Usuario no encontrado',
          success: null
        });
      }
      
      const passwordHash = result[0].password;
      
      // Verificar la contraseña actual
      const isMatch = await bcrypt.compare(currentPassword, passwordHash);
      
      if (!isMatch) {
        return res.render('auth/change-password', {
          title: 'Cambiar contraseña',
          error: 'La contraseña actual es incorrecta',
          success: null
        });
      }
      
      // Actualizar la contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await Usuario.update(userId, { password: hashedPassword });
      
      // Mostrar mensaje de éxito
      res.render('auth/change-password', {
        title: 'Cambiar contraseña',
        error: null,
        success: 'Contraseña actualizada correctamente'
      });
      
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      
      res.render('auth/change-password', {
        title: 'Cambiar contraseña',
        error: 'Ha ocurrido un error al cambiar la contraseña',
        success: null
      });
    }
  },
  
  /**
   * Middleware para proteger rutas API con JWT
   */
  verifyToken: (req, res, next) => {
    // Obtener el token del header o de la cookie
    const token = req.headers['x-access-token'] || req.cookies.token;
    
    if (!token) {
      return res.status(403).json({ 
        message: 'No se ha proporcionado token de autenticación' 
      });
    }
    
    try {
      // Verificar el token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Añadir los datos del usuario al request
      req.user = decoded;
      
      next();
    } catch (error) {
      return res.status(401).json({ 
        message: 'Token inválido o expirado' 
      });
    }
  }
};

module.exports = authController;
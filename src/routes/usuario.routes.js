const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');
const { validateUsuario } = require('../middlewares/validator.middleware');

// Todas las rutas de usuario requieren autenticación y ser admin
router.use(isAuthenticated, isAdmin);

// Ruta para listar usuarios
router.get('/', usuarioController.index);

// Ruta para mostrar el formulario de creación
router.get('/create', usuarioController.create);

// Ruta para almacenar un nuevo usuario
router.post('/', validateUsuario, usuarioController.store);

// Ruta para mostrar el formulario de edición
router.get('/:id/edit', usuarioController.edit);

// Ruta para actualizar un usuario
router.put('/:id', validateUsuario, usuarioController.update);

// Ruta para activar/desactivar un usuario
router.patch('/:id/toggle-status', usuarioController.toggleStatus);

// Ruta para eliminar un usuario (solo admin)
router.delete('/:id', usuarioController.destroy);

module.exports = router;
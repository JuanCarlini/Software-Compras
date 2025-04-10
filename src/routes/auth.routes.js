const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

// Ruta para mostrar el formulario de login
router.get('/login', authController.loginForm);

// Ruta para procesar el login
router.post('/login', authController.login);

// Ruta para cerrar sesión
router.get('/logout', authController.logout);

// Ruta para mostrar el formulario de cambio de contraseña
router.get('/change-password', isAuthenticated, authController.changePasswordForm);

// Ruta para procesar el cambio de contraseña
router.post('/change-password', isAuthenticated, authController.changePassword);

module.exports = router;
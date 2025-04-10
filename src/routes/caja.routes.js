const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');
const { validateCaja } = require('../middlewares/validator.middleware');

// Todas las rutas de caja requieren autenticación
router.use(isAuthenticated);

// Ruta para listar cajas
router.get('/', cajaController.index);

// Ruta para obtener cajas por moneda (API)
router.get('/moneda/:moneda', cajaController.getPorMoneda);

// Ruta para ver el historial de movimientos de una caja
router.get('/:id/historial', cajaController.historial);

// Las siguientes rutas requieren ser admin
router.use(isAdmin);

// Ruta para mostrar el formulario de creación
router.get('/create', cajaController.create);

// Ruta para almacenar una nueva caja
router.post('/', validateCaja, cajaController.store);

// Ruta para mostrar el formulario de edición
router.get('/:id/edit', cajaController.edit);

// Ruta para actualizar una caja
router.put('/:id', validateCaja, cajaController.update);

// Ruta para ajustar el saldo de una caja
router.post('/:id/ajustar-saldo', cajaController.ajustarSaldo);

// Ruta para activar/desactivar una caja
router.patch('/:id/toggle-status', cajaController.toggleStatus);

module.exports = router;
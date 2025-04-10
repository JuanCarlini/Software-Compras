const express = require('express');
const router = express.Router();
const ordenCompraController = require('../controllers/ordenCompra.controller');
const { isAuthenticated, isAprobador, isOwnerOrAdmin } = require('../middlewares/auth.middleware');
const { validateOrdenCompra, validateLineaOrdenCompra } = require('../middlewares/validator.middleware');

// Todas las rutas de orden de compra requieren autenticación
router.use(isAuthenticated);

// Ruta para listar órdenes de compra
router.get('/', ordenCompraController.index);

// Ruta para mostrar el formulario de creación
router.get('/create', ordenCompraController.create);

// Ruta para almacenar una nueva orden de compra
router.post('/', validateOrdenCompra, ordenCompraController.store);

// Ruta para mostrar el reporte de órdenes pendientes
router.get('/pendientes', ordenCompraController.reportePendientes);

// Ruta para listar órdenes pendientes de aprobación (para aprobadores)
router.get('/pendientes-aprobacion', isAprobador, ordenCompraController.pendientesAprobacion);

// Ruta para ver detalles de una orden
router.get('/:id', ordenCompraController.show);

// Rutas para edición de orden (solo propietario o admin)
router.get('/:id/edit', isOwnerOrAdmin, ordenCompraController.edit);
router.put('/:id', isOwnerOrAdmin, validateOrdenCompra, ordenCompraController.update);

// Rutas para gestión de líneas
router.get('/:id/lineas', isOwnerOrAdmin, ordenCompraController.showLineas);
router.post('/:id/lineas', isOwnerOrAdmin, validateLineaOrdenCompra, ordenCompraController.storeLine);
router.put('/:id/lineas/:lineaId', isOwnerOrAdmin, validateLineaOrdenCompra, ordenCompraController.updateLine);
router.delete('/:id/lineas/:lineaId', isOwnerOrAdmin, ordenCompraController.deleteLine);

// Ruta para enviar a aprobación
router.post('/:id/enviar-aprobacion', isOwnerOrAdmin, ordenCompraController.enviarAprobacion);

// Rutas para aprobación/rechazo
router.post('/:id/aprobar', isAprobador, ordenCompraController.aprobar);
router.post('/:id/rechazar', isAprobador, ordenCompraController.rechazar);

module.exports = router;
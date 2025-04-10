const express = require('express');
const router = express.Router();
const ordenPagoController = require('../controllers/ordenPago.controller');
const { isAuthenticated, isAdmin, isAnulador } = require('../middlewares/auth.middleware');
const { validateOrdenPago } = require('../middlewares/validator.middleware');

// Todas las rutas de orden de pago requieren autenticación
router.use(isAuthenticated);

// Ruta para listar órdenes de pago
router.get('/', ordenPagoController.index);

// Ruta para seleccionar proveedor (primer paso para crear una orden de pago)
router.get('/select-proveedor', ordenPagoController.selectProveedor);

// Ruta para seleccionar orden de compra (segundo paso)
router.get('/proveedor/:proveedorId/select-orden', ordenPagoController.selectOrdenCompra);

// Ruta para mostrar el formulario de creación (tercer paso)
router.get('/orden-compra/:ordenCompraId/create', ordenPagoController.create);

// Ruta para almacenar una nueva orden de pago
router.post('/orden-compra/:ordenCompraId', validateOrdenPago, ordenPagoController.store);

// Ruta para obtener el historial de pagos de una orden de compra
router.get('/historial-pagos/:ordenCompraId', ordenPagoController.historialPagos);

// Ruta para ver detalles de una orden de pago
router.get('/:id', ordenPagoController.show);

// Ruta para generar reportes
router.get('/reporte', ordenPagoController.reporte);

// Ruta para anular una orden de pago (requiere ser admin o anulador)
router.delete('/:id', (req, res, next) => {
  if (req.session.user.rol === 'admin' || req.session.user.rol === 'anulador') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para anular órdenes de pago'
  });
}, ordenPagoController.anular);

module.exports = router;
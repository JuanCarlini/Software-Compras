const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedor.controller');
const { isAuthenticated, isAdmin } = require('../middlewares/auth.middleware');
const { validateProveedor } = require('../middlewares/validator.middleware');

// Todas las rutas de proveedor requieren autenticación
router.use(isAuthenticated);

// Ruta para listar proveedores
router.get('/', proveedorController.index);

// Ruta para búsqueda de proveedores (API)
router.get('/search', proveedorController.search);

// Ruta para obtener detalles de un proveedor (API)
router.get('/:id/details', proveedorController.getDetails);

// Las siguientes rutas requieren ser admin
router.use(isAdmin);

// Ruta para mostrar el formulario de creación
router.get('/create', proveedorController.create);

// Ruta para almacenar un nuevo proveedor
router.post('/', validateProveedor, proveedorController.store);

// Ruta para mostrar el formulario de edición
router.get('/:id/edit', proveedorController.edit);

// Ruta para actualizar un proveedor
router.put('/:id', validateProveedor, proveedorController.update);

// Ruta para activar/desactivar un proveedor
router.patch('/:id/toggle-status', proveedorController.toggleStatus);

module.exports = router;
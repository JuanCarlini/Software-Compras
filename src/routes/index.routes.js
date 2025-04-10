const express = require('express');
const router = express.Router();
const indexController = require('../controllers/index.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

// Ruta para la página de inicio (dashboard)
router.get('/', isAuthenticated, indexController.index);

module.exports = router;
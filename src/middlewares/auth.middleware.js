const Usuario = require('../models/Usuario');

/**
 * Middleware para verificar si el usuario está autenticado
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  // Guardar la URL original para redireccionar después del login
  req.session.returnTo = req.originalUrl;
  
  res.redirect('/auth/login');
}

/**
 * Middleware para verificar si el usuario es administrador
 */
async function isAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }
  
  const isUserAdmin = await Usuario.isAdmin(req.session.user.id);
  
  if (!isUserAdmin) {
    return res.status(403).render('error', {
      title: 'Acceso denegado',
      message: 'No tienes permisos para acceder a esta sección.'
    });
  }
  
  next();
}

/**
 * Middleware para verificar si el usuario es aprobador
 */
async function isAprobador(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }
  
  const user = await Usuario.findById(req.session.user.id);
  
  if (!user || (user.rol !== 'aprobador' && user.rol !== 'admin')) {
    return res.status(403).render('error', {
      title: 'Acceso denegado',
      message: 'No tienes permisos para aprobar órdenes de compra.'
    });
  }
  
  next();
}

/**
 * Middleware para verificar si el usuario es anulador
 */
async function isAnulador(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }
  
  const user = await Usuario.findById(req.session.user.id);
  
  if (!user || (user.rol !== 'anulador' && user.rol !== 'admin')) {
    return res.status(403).render('error', {
      title: 'Acceso denegado',
      message: 'No tienes permisos para anular órdenes.'
    });
  }
  
  next();
}

/**
 * Middleware para verificar si el usuario es el creador del recurso
 * o tiene permisos de administrador
 */
async function isOwnerOrAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/auth/login');
  }
  
  const userId = req.session.user.id;
  const isUserAdmin = await Usuario.isAdmin(userId);
  
  // Si es admin, permitir acceso
  if (isUserAdmin) {
    return next();
  }
  
  // Obtener el ID del recurso y el modelo correspondiente
  const resourceId = req.params.id;
  const resourceModel = req.resourceModel; // Debe ser configurado en la ruta
  
  if (!resourceModel || !resourceId) {
    return next(); // Si no hay modelo o ID, continuar (la validación se hará en el controlador)
  }
  
  // Buscar el recurso
  const resource = await resourceModel.findById(resourceId);
  
  // Verificar si el usuario es el creador
  if (!resource || resource.usuario_id !== userId) {
    return res.status(403).render('error', {
      title: 'Acceso denegado',
      message: 'Solo puedes modificar recursos que hayas creado.'
    });
  }
  
  next();
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isAprobador,
  isAnulador,
  isOwnerOrAdmin
};
/**
 * Middleware para validar datos de formularios
 */

/**
 * Valida los datos de un usuario
 */
function validateUsuario(req, res, next) {
  const { nombre, email, password, rol } = req.body;
  const errors = [];
  
  if (!nombre || nombre.trim() === '') {
    errors.push('El nombre es obligatorio');
  }
  
  if (!email || email.trim() === '') {
    errors.push('El email es obligatorio');
  } else if (!isValidEmail(email)) {
    errors.push('El email no es válido');
  }
  
  // Solo validar la contraseña en creación o si se proporciona en actualización
  if (req.method === 'POST' || (req.method === 'PUT' && password)) {
    if (!password || password.trim() === '') {
      errors.push('La contraseña es obligatoria');
    } else if (password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
  }
  
  if (rol && !['admin', 'usuario', 'aprobador', 'anulador'].includes(rol)) {
    errors.push('El rol seleccionado no es válido');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

/**
 * Valida los datos de un proveedor
 */
function validateProveedor(req, res, next) {
  const { nombre, cuit, email } = req.body;
  const errors = [];
  
  if (!nombre || nombre.trim() === '') {
    errors.push('El nombre es obligatorio');
  }
  
  if (cuit && !isValidCuit(cuit)) {
    errors.push('El CUIT no es válido');
  }
  
  if (email && !isValidEmail(email)) {
    errors.push('El email no es válido');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

/**
 * Valida los datos de una caja
 */
function validateCaja(req, res, next) {
  const { nombre, saldo, moneda } = req.body;
  const errors = [];
  
  if (!nombre || nombre.trim() === '') {
    errors.push('El nombre es obligatorio');
  }
  
  if (saldo !== undefined && isNaN(parseFloat(saldo))) {
    errors.push('El saldo debe ser un número');
  }
  
  if (moneda && !['peso', 'dolar'].includes(moneda)) {
    errors.push('La moneda seleccionada no es válida');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

/**
 * Valida los datos de una orden de compra
 */
function validateOrdenCompra(req, res, next) {
  const { proveedor_id, titulo, moneda, forma_pago, cuotas, fecha_entrega } = req.body;
  const errors = [];
  
  if (!proveedor_id || isNaN(parseInt(proveedor_id))) {
    errors.push('Debe seleccionar un proveedor');
  }
  
  if (!titulo || titulo.trim() === '') {
    errors.push('El título es obligatorio');
  }
  
  if (moneda && !['peso', 'dolar'].includes(moneda)) {
    errors.push('La moneda seleccionada no es válida');
  }
  
  if (forma_pago && !['contado', 'cuotas'].includes(forma_pago)) {
    errors.push('La forma de pago seleccionada no es válida');
  }
  
  if (forma_pago === 'cuotas') {
    if (!cuotas || isNaN(parseInt(cuotas)) || parseInt(cuotas) < 1) {
      errors.push('El número de cuotas debe ser un número positivo');
    }
  }
  
  if (fecha_entrega && !isValidDate(fecha_entrega)) {
    errors.push('La fecha de entrega no es válida');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

/**
 * Valida los datos de una línea de orden de compra
 */
function validateLineaOrdenCompra(req, res, next) {
  const { tipo, titulo, unidad, cantidad, precio_unitario, iva } = req.body;
  const errors = [];
  
  if (!tipo || !['item', 'servicio'].includes(tipo)) {
    errors.push('El tipo de línea seleccionado no es válido');
  }
  
  if (!titulo || titulo.trim() === '') {
    errors.push('El título es obligatorio');
  }
  
  if (!unidad || unidad.trim() === '') {
    errors.push('La unidad es obligatoria');
  }
  
  if (!cantidad || isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0) {
    errors.push('La cantidad debe ser un número positivo');
  }
  
  if (!precio_unitario || isNaN(parseFloat(precio_unitario)) || parseFloat(precio_unitario) < 0) {
    errors.push('El precio unitario debe ser un número no negativo');
  }
  
  if (iva !== undefined && (isNaN(parseFloat(iva)) || parseFloat(iva) < 0 || parseFloat(iva) > 100)) {
    errors.push('El IVA debe ser un porcentaje entre 0 y 100');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

/**
 * Valida los datos de una orden de pago
 */
function validateOrdenPago(req, res, next) {
  const { orden_compra_id, caja_id, monto, porcentaje } = req.body;
  const errors = [];
  
  if (!orden_compra_id || isNaN(parseInt(orden_compra_id))) {
    errors.push('Debe seleccionar una orden de compra');
  }
  
  if (!caja_id || isNaN(parseInt(caja_id))) {
    errors.push('Debe seleccionar una caja');
  }
  
  if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
    errors.push('El monto debe ser un número positivo');
  }
  
  if (porcentaje && (isNaN(parseFloat(porcentaje)) || parseFloat(porcentaje) <= 0 || parseFloat(porcentaje) > 100)) {
    errors.push('El porcentaje debe ser un número entre 0 y 100');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}

// Funciones auxiliares de validación

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - Resultado de la validación
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida un CUIT argentino
 * @param {string} cuit - CUIT a validar
 * @returns {boolean} - Resultado de la validación
 */
function isValidCuit(cuit) {
  // Eliminar guiones y espacios
  const cleanCuit = cuit.replace(/[^0-9]/g, '');
  
  // Verificar longitud
  if (cleanCuit.length !== 11) {
    return false;
  }
  
  // Verificar que sea un número
  if (isNaN(parseInt(cleanCuit))) {
    return false;
  }
  
  return true;
}

/**
 * Valida una fecha en formato YYYY-MM-DD
 * @param {string} dateString - Fecha a validar
 * @returns {boolean} - Resultado de la validación
 */
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  validateUsuario,
  validateProveedor,
  validateCaja,
  validateOrdenCompra,
  validateLineaOrdenCompra,
  validateOrdenPago
};
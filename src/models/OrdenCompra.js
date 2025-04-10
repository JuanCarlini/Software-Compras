const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

/**
 * Modelo para la gestión de órdenes de compra
 */
class OrdenCompra extends BaseModel {
  constructor() {
    super();
    this.tableName = 'ordenes_compra';
    this.fillable = [
      'numero', 'proveedor_id', 'usuario_id', 'titulo', 'moneda', 
      'forma_pago', 'cuotas', 'fecha_entrega', 'observaciones', 
      'estado', 'estado_pago', 'monto_total'
    ];
  }

  /**
   * Crea una nueva orden de compra con número autogenerado
   * @param {Object} data - Datos de la orden
   * @returns {Promise<Object>} - Orden creada
   */
  async create(data) {
    // Generar el número de orden
    const numeroOC = await this.generarNumeroOC();
    data.numero = numeroOC;
    data.estado = 'borrador';
    data.estado_pago = 'pendiente';
    
    return await super.create(data);
  }

  /**
   * Genera un número único para la orden de compra
   * @returns {Promise<string>} - Número generado (formato: OC-XXX)
   */
  async generarNumeroOC() {
    const sql = 'SELECT COUNT(*) as total FROM ordenes_compra';
    const result = await query(sql);
    const total = result[0].total;
    
    // Formato: OC-XXX (con ceros a la izquierda)
    return `OC-${String(total).padStart(3, '0')}`;
  }

  /**
   * Obtiene una orden de compra con información de proveedor y usuario
   * @param {number} id - ID de la orden
   * @returns {Promise<Object|null>} - Orden con datos relacionados
   */
  async findWithRelations(id) {
    const sql = `
      SELECT oc.*, p.nombre as proveedor_nombre, u.nombre as usuario_nombre
      FROM ${this.tableName} oc
      JOIN proveedores p ON oc.proveedor_id = p.id
      JOIN usuarios u ON oc.usuario_id = u.id
      WHERE oc.id = ?
    `;
    
    const result = await query(sql, [id]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Obtiene todas las órdenes de compra con información básica de relaciones
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} - Lista de órdenes
   */
  async findAllWithRelations(options = {}) {
    const { estado = null, proveedorId = null, usuarioId = null } = options;
    
    let sql = `
      SELECT oc.*, p.nombre as proveedor_nombre, u.nombre as usuario_nombre
      FROM ${this.tableName} oc
      JOIN proveedores p ON oc.proveedor_id = p.id
      JOIN usuarios u ON oc.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (estado) {
      sql += ' AND oc.estado = ?';
      params.push(estado);
    }
    
    if (proveedorId) {
      sql += ' AND oc.proveedor_id = ?';
      params.push(proveedorId);
    }
    
    if (usuarioId) {
      sql += ' AND oc.usuario_id = ?';
      params.push(usuarioId);
    }
    
    sql += ' ORDER BY oc.creado_en DESC';
    
    return await query(sql, params);
  }

  /**
   * Obtiene órdenes de compra aprobadas para pago
   * @param {number} proveedorId - ID del proveedor (opcional)
   * @returns {Promise<Array>} - Órdenes disponibles para pago
   */
  async findApprovedForPayment(proveedorId = null) {
    let sql = `
      SELECT oc.*, p.nombre as proveedor_nombre
      FROM ${this.tableName} oc
      JOIN proveedores p ON oc.proveedor_id = p.id
      WHERE oc.estado = 'aprobado' AND oc.estado_pago != 'total'
    `;
    
    const params = [];
    
    if (proveedorId) {
      sql += ' AND oc.proveedor_id = ?';
      params.push(proveedorId);
    }
    
    return await query(sql, params);
  }

  /**
   * Calcula y actualiza el monto total de la orden
   * @param {number} id - ID de la orden
   * @returns {Promise<Object>} - Orden actualizada
   */
  async actualizarMontoTotal(id) {
    const sql = `
      SELECT SUM(subtotal) as total
      FROM lineas_ordenes_compra
      WHERE orden_compra_id = ?
    `;
    
    const result = await query(sql, [id]);
    const montoTotal = result[0].total || 0;
    
    return await this.update(id, { monto_total: montoTotal });
  }

  /**
   * Cambia el estado de una orden de compra
   * @param {number} id - ID de la orden
   * @param {string} nuevoEstado - Nuevo estado
   * @param {number} usuarioId - ID del usuario que realiza el cambio
   * @returns {Promise<Object>} - Orden actualizada
   */
  async cambiarEstado(id, nuevoEstado, usuarioId) {
    // Obtener el estado actual
    const orden = await this.findById(id);
    
    if (!orden) {
      throw new Error('Orden no encontrada');
    }
    
    const estadoAnterior = orden.estado;
    
    // Actualizar el estado
    const ordenActualizada = await this.update(id, { estado: nuevoEstado });
    
    // Actualizar también el estado de las líneas
    const sqlLineas = `
      UPDATE lineas_ordenes_compra 
      SET estado = ? 
      WHERE orden_compra_id = ?
    `;
    
    await query(sqlLineas, [nuevoEstado, id]);
    
    // Registrar el cambio en el historial
    const sqlHistorial = `
      INSERT INTO historial_estados 
      (tipo, entidad_id, estado_anterior, estado_nuevo, usuario_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await query(sqlHistorial, ['orden_compra', id, estadoAnterior, nuevoEstado, usuarioId]);
    
    return ordenActualizada;
  }

  /**
   * Actualiza el estado de pago de una orden
   * @param {number} id - ID de la orden
   * @param {string} estadoPago - Nuevo estado de pago
   * @returns {Promise<Object>} - Orden actualizada
   */
  async actualizarEstadoPago(id, estadoPago) {
    return await this.update(id, { estado_pago: estadoPago });
  }

  /**
   * Obtiene el porcentaje pagado de una orden
   * @param {number} id - ID de la orden
   * @returns {Promise<number>} - Porcentaje pagado (0-100)
   */
  async getPorcentajePagado(id) {
    const orden = await this.findById(id);
    
    if (!orden || orden.monto_total <= 0) {
      return 0;
    }
    
    const sql = `
      SELECT SUM(monto) as total_pagado
      FROM ordenes_pago
      WHERE orden_compra_id = ?
    `;
    
    const result = await query(sql, [id]);
    const totalPagado = result[0].total_pagado || 0;
    
    return Math.min(100, Math.round((totalPagado / orden.monto_total) * 100));
  }
}

module.exports = new OrdenCompra();
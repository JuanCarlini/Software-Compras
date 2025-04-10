const BaseModel = require('./BaseModel');
const { query, pool } = require('../config/database');
const OrdenCompra = require('./OrdenCompra');
const Caja = require('./Caja');

/**
 * Modelo para la gestión de órdenes de pago
 */
class OrdenPago extends BaseModel {
  constructor() {
    super();
    this.tableName = 'ordenes_pago';
    this.fillable = [
      'numero', 'orden_compra_id', 'caja_id', 'usuario_id', 
      'monto', 'porcentaje', 'estado', 'observaciones', 'fecha_pago'
    ];
  }

  /**
   * Crea una nueva orden de pago con número autogenerado
   * @param {Object} data - Datos de la orden de pago
   * @returns {Promise<Object>} - Orden de pago creada
   */
  async create(data) {
    // Obtener la orden de compra relacionada
    const ordenCompra = await OrdenCompra.findById(data.orden_compra_id);
    
    if (!ordenCompra) {
      throw new Error('Orden de compra no encontrada');
    }
    
    // Validar que la orden esté aprobada
    if (ordenCompra.estado !== 'aprobado') {
      throw new Error('Solo se pueden pagar órdenes aprobadas');
    }
    
    // Verificar que la caja tenga saldo suficiente
    const tieneSaldo = await Caja.tieneSaldoSuficiente(data.caja_id, data.monto);
    
    if (!tieneSaldo) {
      throw new Error('La caja seleccionada no tiene saldo suficiente');
    }
    
    // Generar el número de orden de pago
    const numeroOP = await this.generarNumeroOP();
    data.numero = numeroOP;
    
    // Si no se especifica un porcentaje, calcularlo
    if (!data.porcentaje && ordenCompra.monto_total > 0) {
      data.porcentaje = (data.monto / ordenCompra.monto_total) * 100;
    }
    
    // Determinar el estado de la orden de pago
    data.estado = data.porcentaje >= 100 ? 'total' : 'parcial';
    
    // Iniciar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Crear la orden de pago
      const sql = `
        INSERT INTO ${this.tableName} 
        (numero, orden_compra_id, caja_id, usuario_id, monto, porcentaje, estado, observaciones, fecha_pago)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const values = [
        data.numero, data.orden_compra_id, data.caja_id, data.usuario_id,
        data.monto, data.porcentaje, data.estado, data.observaciones
      ];
      
      const result = await connection.execute(sql, values);
      const insertId = result[0].insertId;
      
      // Actualizar el saldo de la caja (restar el monto)
      await connection.execute(
        'UPDATE cajas SET saldo = saldo - ? WHERE id = ?',
        [data.monto, data.caja_id]
      );
      
      // Obtener el porcentaje total pagado hasta ahora
      const [pagosResult] = await connection.execute(
        'SELECT SUM(monto) as total_pagado FROM ordenes_pago WHERE orden_compra_id = ?',
        [data.orden_compra_id]
      );
      
      const totalPagado = pagosResult[0].total_pagado || 0;
      const porcentajeTotal = (totalPagado / ordenCompra.monto_total) * 100;
      
      // Actualizar el estado de pago de la orden de compra
      const estadoPagoOC = porcentajeTotal >= 100 ? 'total' : 'parcial';
      
      await connection.execute(
        'UPDATE ordenes_compra SET estado_pago = ? WHERE id = ?',
        [estadoPagoOC, data.orden_compra_id]
      );
      
      // Confirmar la transacción
      await connection.commit();
      
      // Devolver la orden de pago creada
      return await this.findById(insertId);
      
    } catch (error) {
      // Revertir la transacción en caso de error
      await connection.rollback();
      throw error;
    } finally {
      // Liberar la conexión
      connection.release();
    }
  }

  /**
   * Genera un número único para la orden de pago
   * @returns {Promise<string>} - Número generado (formato: OP-XXX)
   */
  async generarNumeroOP() {
    const sql = 'SELECT COUNT(*) as total FROM ordenes_pago';
    const result = await query(sql);
    const total = result[0].total;
    
    // Formato: OP-XXX (con ceros a la izquierda)
    return `OP-${String(total).padStart(3, '0')}`;
  }

  /**
   * Obtiene una orden de pago con información relacionada
   * @param {number} id - ID de la orden de pago
   * @returns {Promise<Object|null>} - Orden con datos relacionados
   */
  async findWithRelations(id) {
    const sql = `
      SELECT op.*, oc.numero as orden_compra_numero, oc.titulo as orden_compra_titulo,
             p.nombre as proveedor_nombre, c.nombre as caja_nombre, u.nombre as usuario_nombre
      FROM ${this.tableName} op
      JOIN ordenes_compra oc ON op.orden_compra_id = oc.id
      JOIN proveedores p ON oc.proveedor_id = p.id
      JOIN cajas c ON op.caja_id = c.id
      JOIN usuarios u ON op.usuario_id = u.id
      WHERE op.id = ?
    `;
    
    const result = await query(sql, [id]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Obtiene todas las órdenes de pago con información relacionada
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} - Lista de órdenes de pago
   */
  async findAllWithRelations(options = {}) {
    const { estado = null, ordenCompraId = null, cajaId = null, usuarioId = null } = options;
    
    let sql = `
      SELECT op.*, oc.numero as orden_compra_numero, p.nombre as proveedor_nombre,
             c.nombre as caja_nombre, u.nombre as usuario_nombre
      FROM ${this.tableName} op
      JOIN ordenes_compra oc ON op.orden_compra_id = oc.id
      JOIN proveedores p ON oc.proveedor_id = p.id
      JOIN cajas c ON op.caja_id = c.id
      JOIN usuarios u ON op.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (estado) {
      sql += ' AND op.estado = ?';
      params.push(estado);
    }
    
    if (ordenCompraId) {
      sql += ' AND op.orden_compra_id = ?';
      params.push(ordenCompraId);
    }
    
    if (cajaId) {
      sql += ' AND op.caja_id = ?';
      params.push(cajaId);
    }
    
    if (usuarioId) {
      sql += ' AND op.usuario_id = ?';
      params.push(usuarioId);
    }
    
    sql += ' ORDER BY op.fecha_pago DESC';
    
    return await query(sql, params);
  }

  /**
   * Anula una orden de pago y revierte los cambios
   * @param {number} id - ID de la orden de pago
   * @param {number} usuarioId - ID del usuario que realiza la anulación
   * @returns {Promise<boolean>} - Resultado de la operación
   */
  async anular(id, usuarioId) {
    // Obtener la orden de pago
    const ordenPago = await this.findById(id);
    
    if (!ordenPago) {
      throw new Error('Orden de pago no encontrada');
    }
    
    // Iniciar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Actualizar el saldo de la caja (devolver el monto)
      await connection.execute(
        'UPDATE cajas SET saldo = saldo + ? WHERE id = ?',
        [ordenPago.monto, ordenPago.caja_id]
      );
      
      // Registrar en el historial
      await connection.execute(
        'INSERT INTO historial_estados (tipo, entidad_id, estado_anterior, estado_nuevo, usuario_id) VALUES (?, ?, ?, ?, ?)',
        ['orden_pago', id, ordenPago.estado, 'anulado', usuarioId]
      );
      
      // Eliminar la orden de pago
      await connection.execute(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      
      // Recalcular el estado de pago de la orden de compra
      const [pagosResult] = await connection.execute(
        'SELECT SUM(monto) as total_pagado FROM ordenes_pago WHERE orden_compra_id = ?',
        [ordenPago.orden_compra_id]
      );
      
      // Obtener la orden de compra
      const [ordenCompraResult] = await connection.execute(
        'SELECT monto_total FROM ordenes_compra WHERE id = ?',
        [ordenPago.orden_compra_id]
      );
      
      const totalPagado = pagosResult[0].total_pagado || 0;
      const montoTotal = ordenCompraResult[0].monto_total;
      
      let estadoPago = 'pendiente';
      if (totalPagado > 0) {
        estadoPago = totalPagado >= montoTotal ? 'total' : 'parcial';
      }
      
      await connection.execute(
        'UPDATE ordenes_compra SET estado_pago = ? WHERE id = ?',
        [estadoPago, ordenPago.orden_compra_id]
      );
      
      // Confirmar la transacción
      await connection.commit();
      
      return true;
      
    } catch (error) {
      // Revertir la transacción en caso de error
      await connection.rollback();
      throw error;
    } finally {
      // Liberar la conexión
      connection.release();
    }
  }

  /**
   * Obtiene el historial de pagos de una orden de compra
   * @param {number} ordenCompraId - ID de la orden de compra
   * @returns {Promise<Array>} - Historial de pagos
   */
  async getHistorialPagos(ordenCompraId) {
    const sql = `
      SELECT op.*, c.nombre as caja_nombre, u.nombre as usuario_nombre
      FROM ${this.tableName} op
      JOIN cajas c ON op.caja_id = c.id
      JOIN usuarios u ON op.usuario_id = u.id
      WHERE op.orden_compra_id = ?
      ORDER BY op.fecha_pago DESC
    `;
    
    return await query(sql, [ordenCompraId]);
  }
}

module.exports = new OrdenPago();
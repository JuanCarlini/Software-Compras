const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

/**
 * Modelo para la gestión de cajas (fuentes de dinero)
 */
class Caja extends BaseModel {
  constructor() {
    super();
    this.tableName = 'cajas';
    this.fillable = ['nombre', 'descripcion', 'saldo', 'moneda', 'activo'];
  }

  /**
   * Obtiene todas las cajas activas
   * @returns {Promise<Array>} - Lista de cajas activas
   */
  async findActivas() {
    return await this.findWhere('activo = 1');
  }

  /**
   * Obtiene cajas por tipo de moneda
   * @param {string} moneda - Tipo de moneda ('peso' o 'dolar')
   * @returns {Promise<Array>} - Lista de cajas con la moneda especificada
   */
  async findPorMoneda(moneda) {
    return await this.findWhere('moneda = ? AND activo = 1', [moneda]);
  }

  /**
   * Actualiza el saldo de una caja
   * @param {number} id - ID de la caja
   * @param {number} monto - Monto a sumar (positivo) o restar (negativo)
   * @returns {Promise<Object>} - Caja actualizada
   */
  async actualizarSaldo(id, monto) {
    const sql = `
      UPDATE ${this.tableName} 
      SET saldo = saldo + ? 
      WHERE id = ?
    `;
    
    await query(sql, [monto, id]);
    
    return await this.findById(id);
  }

  /**
   * Verifica si una caja tiene saldo suficiente
   * @param {number} id - ID de la caja
   * @param {number} monto - Monto a verificar
   * @returns {Promise<boolean>} - True si tiene saldo suficiente
   */
  async tieneSaldoSuficiente(id, monto) {
    const caja = await this.findById(id);
    return caja && caja.saldo >= monto;
  }

  /**
   * Obtiene el historial de movimientos de una caja
   * @param {number} id - ID de la caja
   * @returns {Promise<Array>} - Historial de movimientos
   */
  async getHistorialMovimientos(id) {
    const sql = `
      SELECT op.id, op.numero, op.monto, op.fecha_pago, oc.numero as orden_compra_numero,
             p.nombre as proveedor_nombre
      FROM ordenes_pago op
      JOIN ordenes_compra oc ON op.orden_compra_id = oc.id
      JOIN proveedores p ON oc.proveedor_id = p.id
      WHERE op.caja_id = ?
      ORDER BY op.fecha_pago DESC
    `;
    
    return await query(sql, [id]);
  }
}

module.exports = new Caja();
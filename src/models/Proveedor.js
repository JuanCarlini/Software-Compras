const BaseModel = require('./BaseModel');

/**
 * Modelo para la gestión de proveedores
 */
class Proveedor extends BaseModel {
  constructor() {
    super();
    this.tableName = 'proveedores';
    this.fillable = ['nombre', 'cuit', 'direccion', 'telefono', 'email', 'contacto', 'activo'];
  }

  /**
   * Obtiene todos los proveedores activos
   * @returns {Promise<Array>} - Lista de proveedores activos
   */
  async findActivos() {
    return await this.findWhere('activo = 1');
  }

  /**
   * Desactiva un proveedor en lugar de eliminarlo
   * @param {number} id - ID del proveedor
   * @returns {Promise<Object>} - Proveedor desactivado
   */
  async desactivar(id) {
    return await this.update(id, { activo: 0 });
  }

  /**
   * Reactiva un proveedor desactivado
   * @param {number} id - ID del proveedor
   * @returns {Promise<Object>} - Proveedor reactivado
   */
  async reactivar(id) {
    return await this.update(id, { activo: 1 });
  }

  /**
   * Busca proveedores por nombre (búsqueda parcial)
   * @param {string} nombre - Texto a buscar
   * @returns {Promise<Array>} - Proveedores encontrados
   */
  async buscarPorNombre(nombre) {
    return await this.findWhere('nombre LIKE ?', [`%${nombre}%`]);
  }

  /**
   * Verifica si un proveedor tiene órdenes de compra asociadas
   * @param {number} id - ID del proveedor
   * @returns {Promise<boolean>} - True si tiene órdenes asociadas
   */
  async tieneOrdenesAsociadas(id) {
    const sql = 'SELECT COUNT(*) as total FROM ordenes_compra WHERE proveedor_id = ?';
    const result = await query(sql, [id]);
    return result[0].total > 0;
  }
}

module.exports = new Proveedor();
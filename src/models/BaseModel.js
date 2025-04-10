const { query, sql } = require('../config/database');

/**
 * Modelo base del que heredarán todos los demás modelos
 */
class BaseModel {
  constructor() {
    this.tableName = '';
    this.primaryKey = 'id';
    this.fillable = [];
    this.hidden = ['password'];
  }

  /**
   * Obtiene todos los registros de la tabla
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Array>} - Registros encontrados
   */
  async findAll(options = {}) {
    const { where = '', params = [], orderBy = this.primaryKey, limit = null } = options;
    
    let sqlQuery = `SELECT * FROM ${this.tableName}`;
    
    if (where) {
      sqlQuery += ` WHERE ${where}`;
    }
    
    sqlQuery += ` ORDER BY ${orderBy}`;
    
    if (limit) {
      sqlQuery += ` OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`;
    }
    
    return await query(sqlQuery, params);
  }

  /**
   * Busca un registro por su clave primaria
   * @param {number|string} id - Valor de la clave primaria
   * @returns {Promise<Object|null>} - Registro encontrado o null
   */
  async findById(id) {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const result = await query(sqlQuery, [id]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Busca registros que coincidan con las condiciones
   * @param {string} where - Condición WHERE SQL
   * @param {Array} params - Parámetros para la consulta
   * @returns {Promise<Array>} - Registros encontrados
   */
  async findWhere(where, params = []) {
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE ${where}`;
    return await query(sqlQuery, params);
  }

  /**
   * Busca un solo registro que coincida con las condiciones
   * @param {string} where - Condición WHERE SQL
   * @param {Array} params - Parámetros para la consulta
   * @returns {Promise<Object|null>} - Registro encontrado o null
   */
  async findOne(where, params = []) {
    // SQL Server no usa LIMIT, sino TOP
    const sqlQuery = `SELECT TOP 1 * FROM ${this.tableName} WHERE ${where}`;
    const result = await query(sqlQuery, params);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Crea un nuevo registro
   * @param {Object} data - Datos para crear el registro
   * @returns {Promise<Object>} - Registro creado
   */
  async create(data) {
    // Filtrar solo los campos permitidos en fillable
    const filteredData = {};
    this.fillable.forEach(field => {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    });
    
    const fields = Object.keys(filteredData);
    
    if (fields.length === 0) {
      throw new Error('No hay datos válidos para crear el registro');
    }
    
    const placeholders = fields.map((_, i) => `@p${i}`).join(', ');
    const values = fields.map(field => filteredData[field]);
    
    // SQL Server usa OUTPUT para obtener el ID insertado
    const sqlQuery = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      OUTPUT INSERTED.${this.primaryKey}
      VALUES (${placeholders})
    `;
    
    const result = await query(sqlQuery, values);
    
    // Obtener el ID insertado
    const insertedId = result && result[0] ? result[0][this.primaryKey] : null;
    
    if (insertedId) {
      return await this.findById(insertedId);
    }
    
    return null;
  }

  /**
   * Actualiza un registro existente
   * @param {number|string} id - Valor de la clave primaria
   * @param {Object} data - Datos para actualizar
   * @returns {Promise<Object|null>} - Registro actualizado o null
   */
  async update(id, data) {
    // Filtrar solo los campos permitidos en fillable
    const filteredData = {};
    this.fillable.forEach(field => {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    });
    
    const fields = Object.keys(filteredData);
    
    if (fields.length === 0) {
      return await this.findById(id);
    }
    
    const setClause = fields.map((field, i) => `${field} = @p${i}`).join(', ');
    const values = [...fields.map(field => filteredData[field]), id];
    
    const sqlQuery = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = @p${fields.length}`;
    
    await query(sqlQuery, values);
    
    return await this.findById(id);
  }

  /**
   * Elimina un registro (solo disponible para el administrador)
   * @param {number|string} id - Valor de la clave primaria
   * @returns {Promise<boolean>} - Resultado de la operación
   */
  async delete(id) {
    const sqlQuery = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const result = await query(sqlQuery, [id]);
    return result && result.rowsAffected && result.rowsAffected[0] > 0;
  }

  /**
   * Cuenta el número de registros que coinciden con la condición
   * @param {string} where - Condición WHERE SQL
   * @param {Array} params - Parámetros para la consulta
   * @returns {Promise<number>} - Número de registros
   */
  async count(where = '', params = []) {
    let sqlQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    
    if (where) {
      sqlQuery += ` WHERE ${where}`;
    }
    
    const result = await query(sqlQuery, params);
    return result && result[0] ? result[0].total : 0;
  }
}

module.exports = BaseModel;
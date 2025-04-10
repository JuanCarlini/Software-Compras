const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

/**
 * Modelo para la gestión de usuarios
 */
class Usuario extends BaseModel {
  constructor() {
    super();
    this.tableName = 'usuarios';
    this.fillable = ['nombre', 'email', 'password', 'rol', 'limite_aprobacion', 'activo'];
    this.hidden = ['password'];
  }

  /**
   * Crea un nuevo usuario con contraseña encriptada
   * @param {Object} data - Datos del usuario
   * @returns {Promise<Object>} - Usuario creado
   */
  async create(data) {
    // Encriptar la contraseña
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    return await super.create(data);
  }

  /**
   * Actualiza un usuario existente
   * @param {number} id - ID del usuario
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} - Usuario actualizado
   */
  async update(id, data) {
    // Encriptar la contraseña si se va a actualizar
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    return await super.update(id, data);
  }

  /**
   * Busca un usuario por su email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} - Usuario encontrado o null
   */
  async findByEmail(email) {
    return await this.findOne('email = ?', [email]);
  }

  /**
   * Verifica si las credenciales de un usuario son válidas
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña sin encriptar
   * @returns {Promise<Object|null>} - Usuario autenticado o null
   */
  async authenticate(email, password) {
    // Buscamos el usuario incluyendo la contraseña
    const sqlQuery = `SELECT * FROM ${this.tableName} WHERE email = ?`;
    const result = await query(sqlQuery, [email]);
    
    if (!result.length) {
      return null;
    }
    
    const user = result[0];
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return null;
    }
    
    // Excluir la contraseña del resultado
    delete user.password;
    
    return user;
  }

  /**
   * Obtiene todos los usuarios con rol de aprobador
   * @returns {Promise<Array>} - Lista de aprobadores
   */
  async findAprobadores() {
    return await this.findWhere("rol = 'aprobador' AND activo = 1");
  }

  /**
   * Verifica si un usuario tiene permisos de administrador
   * @param {number} id - ID del usuario
   * @returns {Promise<boolean>} - Resultado de la verificación
   */
  async isAdmin(id) {
    const user = await this.findById(id);
    return user && user.rol === 'admin';
  }

  /**
   * Verifica si un usuario puede aprobar una orden de compra
   * @param {number} userId - ID del usuario
   * @param {number} montoTotal - Monto total de la orden
   * @returns {Promise<boolean>} - Resultado de la verificación
   */
  async puedeAprobar(userId, montoTotal) {
    const user = await this.findById(userId);
    
    if (!user || !user.activo) {
      return false;
    }
    
    // Si es admin, puede aprobar cualquier monto
    if (user.rol === 'admin') {
      return true;
    }
    
    // Si es aprobador, verificar el límite
    if (user.rol === 'aprobador') {
      return user.limite_aprobacion >= montoTotal;
    }
    
    return false;
  }
}

module.exports = new Usuario();
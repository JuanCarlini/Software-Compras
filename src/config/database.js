const sql = require('mssql');
const { config } = require('./config');

// Pool de conexiones
let pool = null;

// Inicializar el pool de conexiones
async function initializePool() {
  try {
    pool = await new sql.ConnectionPool(config.database).connect();
    console.log('Conexión a SQL Server establecida correctamente');
    return pool;
  } catch (error) {
    console.error('Error al inicializar el pool de conexiones:', error.message);
    throw error;
  }
}

// Función para testear la conexión
async function testConnection() {
  try {
    if (!pool) {
      await initializePool();
    }
    
    console.log('Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    return false;
  }
}

// Función para ejecutar consultas
async function query(sqlQuery, params = []) {
  try {
    if (!pool) {
      await initializePool();
    }
    
    // Preparar la consulta
    const request = pool.request();
    
    // Añadir parámetros
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        request.input(`p${index}`, param);
      });
      
      // Reemplazar '?' con parámetros nombrados
      let paramIndex = 0;
      sqlQuery = sqlQuery.replace(/\?/g, () => `@p${paramIndex++}`);
    }
    
    // Ejecutar la consulta
    const result = await request.query(sqlQuery);
    return result.recordset || [];
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error.message);
    throw error;
  }
}

// Función para ejecutar procedimientos almacenados
async function executeProcedure(procedureName, params = {}) {
  try {
    if (!pool) {
      await initializePool();
    }
    
    const request = pool.request();
    
    // Añadir parámetros
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    // Ejecutar el procedimiento
    const result = await request.execute(procedureName);
    return result.recordset || [];
  } catch (error) {
    console.error(`Error al ejecutar el procedimiento ${procedureName}:`, error.message);
    throw error;
  }
}

// Inicializar el pool
initializePool().catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});

module.exports = {
  pool,
  query,
  executeProcedure,
  testConnection,
  sql // Exportar el módulo sql para usarlo en otros archivos
};
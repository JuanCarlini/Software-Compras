const sql = require('mssql');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Configuración de conexión:');
    console.log(`Server: ${process.env.DB_SERVER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Windows Auth: ${process.env.DB_WINDOWS_AUTH}`);
    
    const config = {
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      options: {
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
        encrypt: process.env.DB_ENCRYPT === 'true',
        enableArithAbort: true,
        integratedSecurity: process.env.DB_WINDOWS_AUTH === 'true'
      },
      connectionTimeout: 30000
    };
    
    console.log('\nIntentando conectar a SQL Server...');
    const pool = await sql.connect(config);
    console.log('¡CONEXIÓN EXITOSA!');
    
    // Verificar bases de datos disponibles
    console.log('\nComprobando la conexión con una consulta:');
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as currentDB');
    
    console.log(`Versión de SQL Server: ${result.recordset[0].version.split('\n')[0]}`);
    console.log(`Base de datos actual: ${result.recordset[0].currentDB}`);
    
    // Verificar si existe la base de datos carlini_sistema
    const dbCheckResult = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = 'carlini_sistema'
    `);
    
    if (dbCheckResult.recordset.length > 0) {
      console.log('\n✅ La base de datos "carlini_sistema" existe.');
      
      // Intentar cambiar a la base de datos del proyecto
      try {
        await pool.request().query('USE carlini_sistema');
        console.log('✅ Se cambió correctamente a la base de datos "carlini_sistema"');
        
        // Verificar si hay tablas
        const tableResult = await pool.request().query(`
          SELECT COUNT(*) as tableCount FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        
        console.log(`Número de tablas en carlini_sistema: ${tableResult.recordset[0].tableCount}`);
        
        if (tableResult.recordset[0].tableCount === 0) {
          console.log('⚠️ La base de datos está vacía. Debes ejecutar "npm run setup-db" para crear las tablas.');
        } else {
          console.log('✅ La base de datos tiene tablas configuradas.');
        }
      } catch (error) {
        console.log(`❌ Error al cambiar a la base de datos carlini_sistema: ${error.message}`);
      }
    } else {
      console.log('\n⚠️ La base de datos "carlini_sistema" NO existe.');
      console.log('👉 Debes ejecutar "npm run setup-db" para crear la base de datos del proyecto.');
    }
    
    await pool.close();
    console.log('\nConexión cerrada correctamente.');
    
    console.log('\n=== SIGUIENTE PASO ===');
    if (dbCheckResult.recordset.length === 0) {
      console.log('1. Ejecuta "npm run setup-db" para crear la base de datos y las tablas.');
      console.log('2. Actualiza el .env para usar la base de datos creada:');
      console.log('   DB_NAME=carlini_sistema');
      console.log('3. Luego ejecuta "npm run dev" para iniciar la aplicación.');
    } else {
      console.log('1. Actualiza el .env para usar la base de datos creada:');
      console.log('   DB_NAME=carlini_sistema');
      console.log('2. Ejecuta "npm run dev" para iniciar la aplicación.');
    }
    
  } catch (err) {
    console.error('ERROR DE CONEXIÓN:');
    console.error(err);
  }
}

// Ejecutar el test
testConnection();
const sql = require('mssql');
require('dotenv').config();

async function testNewSQLConnection() {
  try {
    // Obtener configuración desde variables de entorno
    console.log('Configuración de conexión:');
    console.log(`Server: ${process.env.DB_SERVER}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Windows Auth: ${process.env.DB_WINDOWS_AUTH}`);
    
    // Configuración exacta según la nueva instalación
    const config = {
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true // Autenticación de Windows
      },
      connectionTimeout: 30000
    };
    
    console.log('\nIntentando conectar a SQL Server 2022 Express...');
    console.log('Este es un nuevo intento con la instancia recién instalada SQLEXPRESS01');
    
    const pool = await sql.connect(config);
    console.log('\n✅ ¡CONEXIÓN EXITOSA!');
    
    // Verificar información del servidor
    const serverInfo = await pool.request().query(`
      SELECT 
        @@VERSION as version,
        @@SERVERNAME as servername,
        DB_NAME() as database_name,
        SUSER_NAME() as current_user
    `);
    
    console.log('\n=== Información del Servidor ===');
    console.log(`Nombre del servidor: ${serverInfo.recordset[0].servername}`);
    console.log(`Base de datos actual: ${serverInfo.recordset[0].database_name}`);
    console.log(`Usuario actual: ${serverInfo.recordset[0].current_user}`);
    console.log(`Versión: ${serverInfo.recordset[0].version.split('\n')[0]}`);
    
    // Verificar si podemos crear la base de datos del proyecto
    try {
      console.log('\nIntentando crear base de datos para el proyecto...');
      
      // Verificar si ya existe la base de datos
      const dbExists = await pool.request().query(`
        SELECT name FROM sys.databases WHERE name = 'carlini_sistema'
      `);
      
      if (dbExists.recordset.length > 0) {
        console.log('✅ La base de datos "carlini_sistema" ya existe');
      } else {
        // Crear la base de datos
        await pool.request().query(`
          CREATE DATABASE carlini_sistema
        `);
        console.log('✅ Base de datos "carlini_sistema" creada correctamente');
      }
      
      // Intentar cambiar a la base de datos creada
      await pool.request().query('USE carlini_sistema');
      console.log('✅ Conectado correctamente a la base de datos del proyecto');
      
    } catch (dbError) {
      console.log(`❌ Error al crear/usar la base de datos: ${dbError.message}`);
    }
    
    await pool.close();
    console.log('\nConexión cerrada correctamente');
    
    console.log('\n=== SIGUIENTE PASO ===');
    console.log('1. Si la conexión fue exitosa, actualiza el .env para usar:');
    console.log('   DB_NAME=carlini_sistema');
    console.log('2. Ejecuta "npm run setup-db" para crear las tablas del sistema');
    console.log('3. Luego inicia la aplicación con "npm run dev"');
    
  } catch (err) {
    console.error('\n❌ ERROR DE CONEXIÓN:');
    console.error(err);
    
    console.log('\nVerifica los siguientes puntos:');
    console.log('1. SQL Server está recién instalado y puede tardar unos minutos en estar disponible');
    console.log('2. El servicio "SQL Server (SQLEXPRESS01)" debe estar en ejecución');
    console.log('3. El servicio "SQL Server Browser" debe estar en ejecución');
    console.log('4. Los protocolos TCP/IP deben estar habilitados (usa SQL Server Configuration Manager)');
  }
}

// Ejecutar el test
testNewSQLConnection();
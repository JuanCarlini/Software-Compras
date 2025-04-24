const sql = require('mssql');

async function tryDirectConnection() {
  try {
    // Intentar conexión directa con nombre y puerto específico
    const config = {
      server: '127.0.0.1',  // IP local en lugar de nombre de host
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      },
      // No especificar puerto para permitir que use el predeterminado
    };
    
    console.log('Intentando conexión directa a 127.0.0.1...');
    console.log('Configuración:', config);
    
    const pool = await sql.connect(config);
    console.log('¡CONEXIÓN EXITOSA!');
    
    // Verificar información del servidor
    const result = await pool.request().query(`
      SELECT @@SERVERNAME AS server_name, 
             @@VERSION AS version,
             SERVERPROPERTY('InstanceName') AS instance_name,
             DB_NAME() AS current_database
    `);
    
    console.log('\nInformación del servidor:');
    console.log(`Nombre del servidor: ${result.recordset[0].server_name}`);
    console.log(`Nombre de instancia: ${result.recordset[0].instance_name}`);
    console.log(`Base de datos actual: ${result.recordset[0].current_database}`);
    console.log(`Versión: ${result.recordset[0].version.split('\n')[0]}`);
    
    // Obtener lista de bases de datos
    const dbResult = await pool.request().query(`
      SELECT name FROM sys.databases WHERE database_id > 4
    `);
    
    console.log('\nBases de datos del usuario:');
    if (dbResult.recordset.length === 0) {
      console.log('No se encontraron bases de datos de usuario');
    } else {
      dbResult.recordset.forEach(db => {
        console.log(`- ${db.name}`);
      });
    }
    
    await pool.close();
    console.log('\nConexión cerrada correctamente');
    
    console.log('\n=== CONFIGURACIÓN EXITOSA ===');
    console.log('Usa esta configuración en tu archivo .env:');
    console.log('DB_SERVER=127.0.0.1');
    console.log('DB_NAME=master');
    console.log('DB_WINDOWS_AUTH=true');
    
  } catch (err) {
    console.error('ERROR DE CONEXIÓN:');
    console.error(err.message);
    
    // Intentar con diferentes servidores
    console.log('\nIntentando conexiones alternativas...');
    
    try {
      // Intentar con localhost
      const configLocal = {
        server: 'localhost',
        database: 'master',
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          integratedSecurity: true
        }
      };
      
      console.log('\nProbando con localhost...');
      const pool = await sql.connect(configLocal);
      console.log('¡CONEXIÓN EXITOSA con localhost!');
      
      const result = await pool.request().query('SELECT @@VERSION AS version');
      console.log(`Versión: ${result.recordset[0].version.split('\n')[0]}`);
      
      await pool.close();
      
      console.log('\n=== CONFIGURACIÓN EXITOSA ===');
      console.log('Usa esta configuración en tu archivo .env:');
      console.log('DB_SERVER=localhost');
      console.log('DB_NAME=master');
      console.log('DB_WINDOWS_AUTH=true');
      
    } catch (err2) {
      console.log(`Error con localhost: ${err2.message}`);
      
      try {
        // Intentar con conexión directa mediante servidor\\instancia
        const configNamed = {
          server: 'localhost\\SQLEXPRESS01',
          database: 'master',
          options: {
            trustServerCertificate: true,
            encrypt: false,
            enableArithAbort: true,
            integratedSecurity: true
          }
        };
        
        console.log('\nProbando con localhost\\SQLEXPRESS01...');
        const pool = await sql.connect(configNamed);
        console.log('¡CONEXIÓN EXITOSA con localhost\\SQLEXPRESS01!');
        
        const result = await pool.request().query('SELECT @@VERSION AS version');
        console.log(`Versión: ${result.recordset[0].version.split('\n')[0]}`);
        
        await pool.close();
        
        console.log('\n=== CONFIGURACIÓN EXITOSA ===');
        console.log('Usa esta configuración en tu archivo .env:');
        console.log('DB_SERVER=localhost\\\\SQLEXPRESS01');
        console.log('DB_NAME=master');
        console.log('DB_WINDOWS_AUTH=true');
        
      } catch (err3) {
        console.log(`Error con localhost\\SQLEXPRESS01: ${err3.message}`);
        
        console.log('\n¡NO SE PUDO CONECTAR CON NINGUNA CONFIGURACIÓN!');
        console.log('Por favor, verifica:');
        console.log('1. Que SQL Server esté en ejecución');
        console.log('2. Que SQL Server Browser esté en ejecución');
        console.log('3. Que TCP/IP esté habilitado para la instancia');
      }
    }
  }
}

tryDirectConnection();
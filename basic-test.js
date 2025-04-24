const sql = require('mssql');

async function testBasicConnection() {
  try {
    // Configuración básica - sin nombre de instancia, solo base de datos master
    const config = {
      server: 'LAPTOP-PGQG7IE3',  // Nombre de host sin instancia
      database: 'master',        // Base de datos master que siempre existe
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true  // Autenticación de Windows
      },
      connectionTimeout: 30000
    };

    console.log('Intentando conexión básica a SQL Server...');
    console.log('Configuración:', config);
    
    const pool = await sql.connect(config);
    console.log('¡CONEXIÓN EXITOSA!');
    
    // Verificar bases de datos disponibles
    console.log('\nListando todas las bases de datos:');
    const result = await pool.request().query('SELECT name FROM sys.databases');
    
    if (result.recordset && result.recordset.length > 0) {
      console.log('Bases de datos disponibles:');
      result.recordset.forEach(db => {
        console.log(`- ${db.name}`);
      });
    } else {
      console.log('No se encontraron bases de datos.');
    }
    
    await pool.close();
    console.log('\nConexión cerrada correctamente.');
  } catch (err) {
    console.error('ERROR DE CONEXIÓN:');
    console.error(err);
  }
}

// Ejecutar el test
testBasicConnection();

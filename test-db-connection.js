const sql = require('mssql');
const { config } = require('./src/config/config');

async function testConnection() {
  try {
    console.log('Configuración de conexión:', {
      ...config.database,
      password: config.database.password ? '[OCULTA]' : undefined
    });

    // Preparar la configuración
    let dbConfig = { ...config.database };
    
    // Probar primero con configuración básica sin autenticación Windows
    console.log("\n--- PRUEBA 1: Conexión básica con el nombre de servidor completo ---");
    try {
      // Usar el nombre de host exacto con la instancia
      const config1 = {
        server: dbConfig.server.replace(/\\\\/g, '\\'),  // Asegurarse de tener solo un \
        database: dbConfig.database,
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          // Sin autenticación de Windows
        },
        connectionTimeout: 30000
      };
      
      console.log("Configuración:", config1);
      console.log("Intentando conectar...");
      
      const pool1 = await new sql.ConnectionPool(config1).connect();
      console.log("✅ Conexión exitosa con prueba 1!");
      await pool1.close();
      return; // Si tiene éxito, terminamos
    } catch (err) {
      console.log("❌ Error en prueba 1:", err.message);
    }
    
    // Prueba 2: Intentar con autenticación de Windows explícita
    console.log("\n--- PRUEBA 2: Usando autenticación de Windows explícita ---");
    try {
      const config2 = {
        server: dbConfig.server.replace(/\\\\/g, '\\'),  // Nombre con un solo \
        database: dbConfig.database,
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          trustedConnection: true,
          integratedSecurity: true,
        },
        connectionTimeout: 30000
      };
      
      console.log("Configuración:", config2);
      console.log("Intentando conectar...");
      
      const pool2 = await new sql.ConnectionPool(config2).connect();
      console.log("✅ Conexión exitosa con prueba 2!");
      await pool2.close();
      return; // Si tiene éxito, terminamos
    } catch (err) {
      console.log("❌ Error en prueba 2:", err.message);
    }
    
    // Prueba 3: Probar solo con localhost
    console.log("\n--- PRUEBA 3: Usando localhost sin nombre de instancia ---");
    try {
      const config3 = {
        server: 'localhost',
        database: dbConfig.database,
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true
        },
        connectionTimeout: 30000
      };
      
      console.log("Configuración:", config3);
      console.log("Intentando conectar...");
      
      const pool3 = await new sql.ConnectionPool(config3).connect();
      console.log("✅ Conexión exitosa con prueba 3!");
      await pool3.close();
      return; // Si tiene éxito, terminamos
    } catch (err) {
      console.log("❌ Error en prueba 3:", err.message);
    }
    
    // Prueba 4: Usar IP local
    console.log("\n--- PRUEBA 4: Usando IP local 127.0.0.1 ---");
    try {
      const config4 = {
        server: '127.0.0.1',
        database: dbConfig.database,
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true
        },
        connectionTimeout: 30000
      };
      
      console.log("Configuración:", config4);
      console.log("Intentando conectar...");
      
      const pool4 = await new sql.ConnectionPool(config4).connect();
      console.log("✅ Conexión exitosa con prueba 4!");
      await pool4.close();
      return; // Si tiene éxito, terminamos
    } catch (err) {
      console.log("❌ Error en prueba 4:", err.message);
    }
    
    // Prueba 5: Intentar autenticación SQL Server con usuario sa
    console.log("\n--- PRUEBA 5: Intentando con usuario SA ---");
    try {
      const config5 = {
        server: dbConfig.server.replace(/\\\\/g, '\\'),
        database: dbConfig.database,
        user: 'sa',
        password: '',  // Intenta con contraseña vacía
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true
        },
        connectionTimeout: 30000
      };
      
      console.log("Configuración:", config5);
      console.log("Intentando conectar...");
      
      const pool5 = await new sql.ConnectionPool(config5).connect();
      console.log("✅ Conexión exitosa con prueba 5!");
      await pool5.close();
      return; // Si tiene éxito, terminamos
    } catch (err) {
      console.log("❌ Error en prueba 5:", err.message);
    }

    console.log('Configuración final:', dbConfig);
    
    // Intentar conectar
    console.log('Intentando conectar a SQL Server...');
    const pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('¡Conexión exitosa!');
    
    // Verificar la base de datos
    console.log('Verificando base de datos...');
    const result = await pool.request().query('SELECT DB_NAME() as dbName');
    console.log(`Base de datos conectada: ${result.recordset[0].dbName}`);
    
    // Cerrar la conexión
    await pool.close();
    console.log('Conexión cerrada correctamente.');
  } catch (err) {
    console.error('Error de conexión:');
    console.error(err);
  }
}

testConnection();

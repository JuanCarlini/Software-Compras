const sql = require('mssql');

// Función para probar una conexión con un puerto específico
async function testConnection(server, port) {
  // Configuración básica - nombre de servidor exacto y puerto específico
  const config = {
    server: server,
    database: 'master',
    options: {
      trustServerCertificate: true,
      encrypt: false,
      enableArithAbort: true,
      integratedSecurity: true
    },
    port: port,
    connectionTimeout: 10000 // 10 segundos para cada intento
  };

  try {
    console.log(`Intentando conectar a ${server}:${port}...`);
    const pool = await sql.connect(config);
    console.log(`✅ ¡CONEXIÓN EXITOSA a ${server}:${port}!`);
    
    // Verificar información del servidor
    const result = await pool.request().query('SELECT @@VERSION AS version');
    console.log(`Versión: ${result.recordset[0].version.split('\n')[0]}`);
    
    await pool.close();
    return true;
  } catch (err) {
    console.log(`❌ Error al conectar a ${server}:${port}: ${err.message}`);
    return false;
  }
}

// Función principal para probar diferentes configuraciones
async function testMultipleConfigurations() {
  console.log('Probando diferentes configuraciones de conexión a SQL Server...\n');
  
  // Lista de puertos comunes de SQL Server
  const ports = [1433, 1434, 2433, 4022, 1450, 2301, 135];
  
  // Lista de configuraciones de servidor
  const serverConfigs = [
    { name: 'Nombre de host', server: 'LAPTOP-PGQG7IE3' },
    { name: 'Nombre de host + instancia', server: 'LAPTOP-PGQG7IE3\\SQLEXPRESS' },
    { name: 'Localhost', server: 'localhost' },
    { name: 'Localhost + instancia', server: 'localhost\\SQLEXPRESS' },
    { name: 'IP local', server: '127.0.0.1' },
    { name: 'IP local + instancia', server: '127.0.0.1\\SQLEXPRESS' }
  ];
  
  let foundConnection = false;
  
  // Probar cada configuración
  for (const serverConfig of serverConfigs) {
    console.log(`\n---- Probando conexiones a ${serverConfig.name}: ${serverConfig.server} ----`);
    
    // Probar primero sin puerto específico (SQL Server determinará automáticamente)
    try {
      const config = {
        server: serverConfig.server,
        database: 'master',
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          integratedSecurity: true
        },
        connectionTimeout: 10000
      };
      
      console.log(`Intentando conectar a ${serverConfig.server} (sin puerto específico)...`);
      const pool = await sql.connect(config);
      console.log(`✅ ¡CONEXIÓN EXITOSA a ${serverConfig.server}!`);
      
      // Verificar información del servidor
      const result = await pool.request().query('SELECT @@VERSION AS version, @@SERVERNAME AS servername');
      console.log(`Nombre del servidor: ${result.recordset[0].servername}`);
      console.log(`Versión: ${result.recordset[0].version.split('\n')[0]}`);
      
      await pool.close();
      
      foundConnection = true;
      console.log('\n¡CONFIGURACIÓN CORRECTA ENCONTRADA!');
      console.log(`Usa esta configuración en tu archivo .env:`);
      console.log(`DB_SERVER=${serverConfig.server}`);
      console.log(`DB_NAME=carlini_sistema`);
      console.log(`DB_WINDOWS_AUTH=true`);
      break;
    } catch (err) {
      console.log(`❌ Error con conexión predeterminada: ${err.message}`);
      
      // Si falla, probar con puertos específicos
      for (const port of ports) {
        const success = await testConnection(serverConfig.server, port);
        if (success) {
          foundConnection = true;
          console.log('\n¡CONFIGURACIÓN CORRECTA ENCONTRADA!');
          console.log(`Usa esta configuración en tu archivo .env:`);
          console.log(`DB_SERVER=${serverConfig.server}`);
          console.log(`DB_PORT=${port}`);
          console.log(`DB_NAME=carlini_sistema`);
          console.log(`DB_WINDOWS_AUTH=true`);
          break;
        }
      }
      
      if (foundConnection) break;
    }
  }
  
  if (!foundConnection) {
    console.log('\n❌ No se pudo establecer conexión con ninguna configuración.');
    console.log('Posibles soluciones:');
    console.log('1. Verifica que SQL Server esté funcionando');
    console.log('2. Verifica que SQL Server Browser esté funcionando');
    console.log('3. Comprueba que los protocolos TCP/IP estén habilitados');
    console.log('4. Verifica las reglas del firewall');
  }
}

// Ejecutar todas las pruebas
testMultipleConfigurations();

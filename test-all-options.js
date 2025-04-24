const sql = require('mssql');
require('dotenv').config();

async function tryConnection(configObj) {
  try {
    console.log(`\nProbando conexión con: ${configObj.server}`);
    console.log(`Configuración: ${JSON.stringify(configObj, null, 2)}`);
    
    const pool = await sql.connect(configObj);
    const result = await pool.request().query('SELECT @@VERSION as version, @@SERVERNAME as servername');
    
    console.log('\n✅ ¡CONEXIÓN EXITOSA!');
    console.log(`Servidor: ${result.recordset[0].servername}`);
    console.log(`Versión: ${result.recordset[0].version.split('\n')[0]}`);
    
    await pool.close();
    return true;
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }
}

async function testAllConfigurations() {
  const configurations = [
    // 1. Con nombre de host sin instancia
    {
      server: 'LAPTOP-PGQG7IE3',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
    
    // 2. Con nombre de host con la instancia
    {
      server: 'LAPTOP-PGQG7IE3\\SQLEXPRESS',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
    
    // 3. Con localhost sin instancia
    {
      server: 'localhost',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
    
    // 4. Con localhost y la instancia
    {
      server: 'localhost\\SQLEXPRESS',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
    
    // 5. Con 127.0.0.1 sin instancia
    {
      server: '127.0.0.1',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
    
    // 6. Con 127.0.0.1 y la instancia
    {
      server: '127.0.0.1\\SQLEXPRESS',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
    
    // 7. Con autenticación SQL
    {
      server: 'LAPTOP-PGQG7IE3\\SQLEXPRESS',
      database: 'master',
      user: 'sa',
      password: '',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
      }
    },
    
    // 8. Con punto como localhost
    {
      server: '.',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
    
    // 9. Con punto y la instancia
    {
      server: '.\\SQLEXPRESS',
      database: 'master',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        integratedSecurity: true
      }
    },
  ];
  
  let success = false;
  
  for (let i = 0; i < configurations.length; i++) {
    if (await tryConnection(configurations[i])) {
      console.log(`\n✅ CONFIGURACIÓN ${i+1} FUNCIONA CORRECTAMENTE`);
      console.log('Usa esta configuración en tu archivo .env:');
      console.log(`DB_SERVER=${configurations[i].server}`);
      
      success = true;
      break;
    }
  }
  
  if (!success) {
    console.log('\n❌ Ninguna configuración funcionó. Posibles problemas:');
    console.log('1. SQL Server no está ejecutándose.');
    console.log('2. El servicio SQL Server Browser no está activo.');
    console.log('3. Los protocolos TCP/IP no están habilitados.');
    console.log('4. Hay restricciones en el firewall.');
  }
}

testAllConfigurations();

const { exec } = require('child_process');

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`Command stderr: ${stderr}`); // Log but don't reject
      }
      resolve(stdout);
    });
  });
}

async function checkSQLServerStatus() {
  console.log("=== Verificando estado de SQL Server ===\n");
  
  try {
    // Verificar si SQL Server está instalado
    console.log("Comprobando SQL Server instalado:");
    try {
      const sqlInstalledOutput = await executeCommand('sc query MSSQLSERVER || sc query MSSQL$SQLEXPRESS');
      console.log(sqlInstalledOutput);
    } catch (err) {
      console.log("No se pudo verificar la instalación de SQL Server");
    }
    
    // Verificar servicios SQL Server
    console.log("\nVerificando servicios SQL Server (status):");
    try {
      const sqlServiceOutput = await executeCommand('sc query MSSQL$SQLEXPRESS');
      console.log(sqlServiceOutput);
    } catch (err) {
      console.log("No se pudo obtener información del servicio SQL Server Express");
    }
    
    // Verificar si SQL Browser está activo
    console.log("\nVerificando SQL Browser (status):");
    try {
      const browserServiceOutput = await executeCommand('sc query SQLBrowser');
      console.log(browserServiceOutput);
    } catch (err) {
      console.log("No se pudo obtener información del servicio SQL Browser");
    }
    
    // Intentar iniciar SQL Server Browser si no está activo
    console.log("\nIntentando iniciar SQL Server Browser:");
    try {
      await executeCommand('sc start SQLBrowser');
      console.log("Comando para iniciar SQL Browser ejecutado");
    } catch (err) {
      console.log("No se pudo iniciar SQL Browser (puede requerir permisos de administrador)");
    }
    
    // Verificar conexiones TCP activas
    console.log("\nVerificando conexiones TCP (puerto 1433):");
    try {
      const netstatOutput = await executeCommand('netstat -ano | findstr :1433');
      console.log(netstatOutput || "No se encontraron conexiones en el puerto 1433");
    } catch (err) {
      console.log("No se encontraron conexiones en el puerto 1433");
    }
    
    console.log("\n=== Instrucciones para habilitar SQL Server Browser ===");
    console.log("1. Abrir 'Servicios' (services.msc)");
    console.log("2. Buscar 'SQL Server Browser'");
    console.log("3. Hacer clic derecho y seleccionar 'Propiedades'");
    console.log("4. Cambiar 'Tipo de inicio' a 'Automático'");
    console.log("5. Hacer clic en 'Iniciar' si no está en ejecución");
    console.log("6. Hacer clic en 'Aplicar' y 'Aceptar'");
    
    console.log("\n=== Instrucciones para habilitar TCP/IP en SQL Server ===");
    console.log("1. Abrir 'SQL Server Configuration Manager'");
    console.log("2. Ir a 'SQL Server Network Configuration' > 'Protocols for SQLEXPRESS'");
    console.log("3. Habilitar 'TCP/IP' (doble clic y cambiar 'Enabled' a 'Yes')");
    console.log("4. Reiniciar el servicio SQL Server Express desde Servicios");
    
  } catch (error) {
    console.error(`Error general: ${error}`);
  }
}

// Ejecutar la verificación
checkSQLServerStatus();

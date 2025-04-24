const { exec } = require('child_process');

// Función para ejecutar comandos PowerShell
function runPowerShellCommand(command) {
  return new Promise((resolve, reject) => {
    exec(`powershell -Command "${command}"`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

async function checkSQLServerServices() {
  console.log('Verificando servicios de SQL Server...\n');
  
  try {
    // Comprobar el servicio SQL Server
    console.log('Verificando SQL Server:');
    const sqlServiceOutput = await runPowerShellCommand('Get-Service -Name MSSQL* | Format-Table Name, DisplayName, Status -AutoSize');
    console.log(sqlServiceOutput);
    
    // Comprobar SQL Server Browser
    console.log('Verificando SQL Server Browser:');
    const browserServiceOutput = await runPowerShellCommand('Get-Service -Name SQLBrowser | Format-Table Name, DisplayName, Status -AutoSize');
    console.log(browserServiceOutput);
    
    // Comprobar la configuración del firewall
    console.log('Verificando reglas de firewall para SQL Server:');
    const firewallOutput = await runPowerShellCommand('Get-NetFirewallRule -DisplayName *SQL* | Format-Table Name, DisplayName, Enabled, Direction, Action -AutoSize');
    console.log(firewallOutput);
    
    // Comprobar si TCP/IP está habilitado
    console.log('\nVerificando información de Conexión:');
    console.log('Para SQL Server, es necesario que:');
    console.log('1. Protocols for SQLEXPRESS > TCP/IP esté habilitado');
    console.log('2. SQL Server Browser service esté iniciado');
    console.log('3. El Firewall permita conexiones al puerto 1433 y UDP 1434\n');
    
    console.log('Resumen:');
    console.log('- Si SQL Server no está ejecutándose, inícielo desde Servicios.');
    console.log('- Si SQL Browser no está ejecutándose, inícielo desde Servicios.');
    console.log('- Si no hay reglas de firewall para SQL, necesita configurarlas.');
    
  } catch (error) {
    console.error(`Error al verificar servicios: ${error}`);
  }
}

checkSQLServerServices();

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

async function checkSQLServerPorts() {
  console.log('Verificando puertos de SQL Server...\n');
  
  try {
    // Verificar puertos TCP activos que puedan estar relacionados con SQL Server
    console.log('Verificando puertos TCP activos (busca conexiones SQL Server):');
    const tcpPortsOutput = await runPowerShellCommand('Get-NetTCPConnection | Where-Object {$_.State -eq \"Listen\"} | Select-Object LocalAddress, LocalPort | Sort-Object LocalPort | Format-Table -AutoSize');
    console.log(tcpPortsOutput);
    
    // Verificar procesos SQL Server
    console.log('Verificando procesos de SQL Server:');
    const sqlProcessesOutput = await runPowerShellCommand('Get-Process *sql* | Format-Table Name, Id, Description -AutoSize');
    console.log(sqlProcessesOutput);
    
    console.log('Para determinar el puerto exacto que está usando SQL Server:');
    console.log('1. Busca en la lista de puertos TCP activos');
    console.log('2. El puerto de SQL Server suele ser 1433, pero podría ser diferente');
    console.log('3. Si no aparece, puede significar que SQL Server está configurado para usar');
    console.log('   pipes con nombre en lugar de TCP/IP, o que no se ha iniciado');
    
  } catch (error) {
    console.error(`Error al verificar puertos: ${error}`);
  }
}

checkSQLServerPorts();

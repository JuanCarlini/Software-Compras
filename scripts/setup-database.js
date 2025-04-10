const sql = require('mssql');
const { config } = require('../src/config/config');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  let pool = null;
  
  try {
    console.log('Iniciando configuración de la base de datos...');
    
    // Crear una conexión al servidor sin especificar base de datos
    const serverConfig = {
      ...config.database,
      database: 'master' // Conectar a la base de datos master primero
    };
    
    // Conectar al servidor
    pool = await new sql.ConnectionPool(serverConfig).connect();
    
    // Verificar si la base de datos existe
    const dbCheckResult = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = '${config.database.database}'
    `);
    
    // Crear la base de datos si no existe
    if (dbCheckResult.recordset.length === 0) {
      console.log(`Creando base de datos ${config.database.database}...`);
      await pool.request().query(`CREATE DATABASE ${config.database.database}`);
    } else {
      console.log(`La base de datos ${config.database.database} ya existe.`);
    }
    
    // Cerrar la conexión a master
    await pool.close();
    
    // Conectar a la base de datos del proyecto
    pool = await new sql.ConnectionPool(config.database).connect();
    
    // Crear tablas
    console.log('Creando tablas...');
    
    // Tabla de usuarios
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usuarios')
      CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(100) NOT NULL,
        rol NVARCHAR(20) NOT NULL DEFAULT 'usuario',
        limite_aprobacion DECIMAL(15,2) DEFAULT 0,
        activo BIT DEFAULT 1,
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE()
      )
    `);
    
    // Tabla de proveedores
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'proveedores')
      CREATE TABLE proveedores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        cuit NVARCHAR(20),
        direccion NVARCHAR(MAX),
        telefono NVARCHAR(20),
        email NVARCHAR(100),
        contacto NVARCHAR(100),
        activo BIT DEFAULT 1,
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE()
      )
    `);
    
    // Tabla de cajas (fuentes de dinero)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cajas')
      CREATE TABLE cajas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        descripcion NVARCHAR(MAX),
        saldo DECIMAL(15,2) DEFAULT 0,
        moneda NVARCHAR(10) DEFAULT 'peso',
        activo BIT DEFAULT 1,
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE()
      )
    `);
    
    // Tabla de órdenes de compra
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ordenes_compra')
      CREATE TABLE ordenes_compra (
        id INT IDENTITY(1,1) PRIMARY KEY,
        numero NVARCHAR(10) NOT NULL UNIQUE,
        proveedor_id INT NOT NULL,
        usuario_id INT NOT NULL,
        titulo NVARCHAR(200) NOT NULL,
        moneda NVARCHAR(10) DEFAULT 'peso',
        forma_pago NVARCHAR(10) DEFAULT 'contado',
        cuotas INT DEFAULT 1,
        fecha_entrega DATE,
        observaciones NVARCHAR(MAX),
        estado NVARCHAR(20) DEFAULT 'borrador',
        estado_pago NVARCHAR(20) DEFAULT 'pendiente',
        monto_total DECIMAL(15,2) DEFAULT 0,
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    
    // Tabla de líneas de órdenes de compra
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'lineas_ordenes_compra')
      CREATE TABLE lineas_ordenes_compra (
        id INT IDENTITY(1,1) PRIMARY KEY,
        orden_compra_id INT NOT NULL,
        numero NVARCHAR(15) NOT NULL,
        tipo NVARCHAR(10) DEFAULT 'item',
        titulo NVARCHAR(200) NOT NULL,
        unidad NVARCHAR(20) DEFAULT 'unidad',
        cantidad DECIMAL(15,2) DEFAULT 0,
        precio_unitario DECIMAL(15,2) DEFAULT 0,
        iva DECIMAL(5,2) DEFAULT 21,
        subtotal DECIMAL(15,2) DEFAULT 0,
        observaciones NVARCHAR(MAX),
        estado NVARCHAR(20) DEFAULT 'borrador',
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE
      )
    `);
    
    // Tabla de órdenes de pago
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ordenes_pago')
      CREATE TABLE ordenes_pago (
        id INT IDENTITY(1,1) PRIMARY KEY,
        numero NVARCHAR(10) NOT NULL UNIQUE,
        orden_compra_id INT NOT NULL,
        caja_id INT NOT NULL,
        usuario_id INT NOT NULL,
        monto DECIMAL(15,2) DEFAULT 0,
        porcentaje DECIMAL(5,2) DEFAULT 0,
        estado NVARCHAR(10) DEFAULT 'borrador',
        observaciones NVARCHAR(MAX),
        fecha_pago DATETIME DEFAULT GETDATE(),
        creado_en DATETIME DEFAULT GETDATE(),
        actualizado_en DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id),
        FOREIGN KEY (caja_id) REFERENCES cajas(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    
    // Tabla para registro de cambios de estado (auditoría)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'historial_estados')
      CREATE TABLE historial_estados (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tipo NVARCHAR(20) NOT NULL,
        entidad_id INT NOT NULL,
        estado_anterior NVARCHAR(50) NOT NULL,
        estado_nuevo NVARCHAR(50) NOT NULL,
        usuario_id INT NOT NULL,
        fecha DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    
    // Crear un trigger para actualizar el campo 'actualizado_en' automáticamente
    // Este bloque necesita ejecutarse para cada tabla que tenga el campo 'actualizado_en'
    const tablasConActualizadoEn = ['usuarios', 'proveedores', 'cajas', 'ordenes_compra', 'lineas_ordenes_compra', 'ordenes_pago'];
    
    for (const tabla of tablasConActualizadoEn) {
      const triggerName = `TR_${tabla}_UpdateTimestamp`;
      
      // Verificar si el trigger ya existe
      const triggerExists = await pool.request().query(`
        SELECT name FROM sys.triggers WHERE name = '${triggerName}'
      `);
      
      if (triggerExists.recordset.length === 0) {
        await pool.request().query(`
          CREATE TRIGGER ${triggerName}
          ON ${tabla}
          AFTER UPDATE
          AS
          BEGIN
            SET NOCOUNT ON;
            IF UPDATE(actualizado_en) RETURN;
            UPDATE ${tabla}
            SET actualizado_en = GETDATE()
            FROM ${tabla} t
            INNER JOIN inserted i ON t.id = i.id;
          END
        `);
      }
    }
    
    // Verificar si existe el usuario administrador
    const adminResult = await pool.request().query(`
      SELECT * FROM usuarios WHERE email = 'admin@sistema.com'
    `);
    
    // Crear usuario administrador si no existe
    if (adminResult.recordset.length === 0) {
      console.log('Creando usuario administrador...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.request()
        .input('nombre', sql.NVarChar, 'Administrador')
        .input('email', sql.NVarChar, 'admin@sistema.com')
        .input('password', sql.NVarChar, hashedPassword)
        .input('rol', sql.NVarChar, 'admin')
        .query(`
          INSERT INTO usuarios (nombre, email, password, rol)
          VALUES (@nombre, @email, @password, @rol)
        `);
    }
    
    // Crear algunas cajas de ejemplo
    const cajasResult = await pool.request().query(`
      SELECT * FROM cajas
    `);
    
    if (cajasResult.recordset.length === 0) {
      console.log('Creando cajas de ejemplo...');
      
      await pool.request().query(`
        INSERT INTO cajas (nombre, descripcion, saldo, moneda)
        VALUES 
        ('Banco Santander', 'Cuenta corriente principal', 100000, 'peso'),
        ('Banco Macro', 'Cuenta en dólares', 5000, 'dolar'),
        ('Caja chica', 'Efectivo para gastos menores', 10000, 'peso')
      `);
    }
    
    console.log('Configuración de la base de datos completada exitosamente.');
    
  } catch (error) {
    console.error('Error durante la configuración de la base de datos:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Ejecutar la configuración
setupDatabase();
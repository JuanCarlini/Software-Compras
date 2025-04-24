require('dotenv').config();

const config = {
  // Servidor
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Base de datos SQL Server
  database: {
    server: process.env.DB_SERVER || 'localhost',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'carlini_sistema',
    port: parseInt(process.env.DB_PORT) || 1433,
    windowsAuth: process.env.DB_WINDOWS_AUTH === 'true', // Para autenticación de Windows
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true', // Para conexiones Azure
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true' || true, // Para desarrollo local
      enableArithAbort: true
    }
  },
  
  // Autenticación
  jwtSecret: process.env.JWT_SECRET || 'carlini-sistema-secreto',
  sessionSecret: process.env.SESSION_SECRET || 'carlini-session-secreto',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  
  // Correo (para futuras implementaciones)
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'no-reply@sistema-carlini.com'
  }
};

module.exports = { config };
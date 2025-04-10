const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const methodOverride = require('method-override');
const morgan = require('morgan');
const { config } = require('./config/config');

// Inicializar la aplicación
const app = express();

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para pasar información del usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Rutas
const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const proveedorRoutes = require('./routes/proveedor.routes');
const ordenCompraRoutes = require('./routes/ordenCompra.routes');
const ordenPagoRoutes = require('./routes/ordenPago.routes');
const cajaRoutes = require('./routes/caja.routes');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/proveedores', proveedorRoutes);
app.use('/ordenes-compra', ordenCompraRoutes);
app.use('/ordenes-pago', ordenPagoRoutes);
app.use('/cajas', cajaRoutes);

// Manejo de error 404
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Página no encontrada',
    message: 'La página que estás buscando no existe.'
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('error', { 
    title: 'Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error inesperado' 
      : err.message
  });
});

// Puerto
const PORT = config.port || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
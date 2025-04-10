# Sistema de Gestión de Órdenes de Compra y Pago - Carlini

Este sistema permite administrar órdenes de compra y órdenes de pago, con un completo seguimiento de estados y flujo de trabajo.

## Características

- Gestión de usuarios con roles (administrador, usuario, aprobador, anulador)
- Gestión de proveedores
- Gestión de cajas (fuentes de dinero)
- Gestión de órdenes de compra con estados y líneas
- Gestión de órdenes de pago
- Generación de reportes
- Panel de control con estadísticas

## Tecnologías

- Node.js
- Express.js
- MySQL
- EJS (templates)
- Bootstrap 5 (interfaz)
- JavaScript (jQuery, ajax)

## Instalación

### Requisitos previos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)

### Pasos de instalación

1. Clone el repositorio o descomprima el archivo zip

```bash
# Si usa git:
git clone [url-repositorio]
cd Proyecto-Software-Carlini
```

2. Instale las dependencias

```bash
npm install
```

3. Configure la base de datos

- Cree una base de datos MySQL llamada `carlini_sistema`
- Configure sus credenciales MySQL en el archivo `.env` (puede usar `.env.example` como plantilla)

4. Configure las variables de entorno (copie el archivo .env.example a .env)

```bash
cp .env.example .env
# Edite el archivo .env con su información
```

5. Inicialice la base de datos

```bash
npm run setup-db
```

6. Inicie la aplicación

```bash
npm start
# O en modo desarrollo:
npm run dev
```

7. Acceda a la aplicación

- Abra su navegador y vaya a `http://localhost:3000`
- Inicie sesión con las credenciales de administrador:
  - Email: admin@sistema.com
  - Contraseña: admin123

## Estructura del proyecto

```
Proyecto-Software-Carlini/
├── public/               # Archivos estáticos (CSS, JS, imágenes)
├── scripts/              # Scripts de utilidad (configuración de BD)
├── src/                  # Código fuente
│   ├── config/           # Configuración de la aplicación
│   ├── controllers/      # Controladores
│   ├── middlewares/      # Middlewares
│   ├── models/           # Modelos
│   ├── routes/           # Rutas
│   ├── utils/            # Utilidades
│   └── app.js            # Punto de entrada de la aplicación
├── views/                # Vistas (templates EJS)
├── .env                  # Variables de entorno
├── .gitignore            # Archivos ignorados por git
├── package.json          # Dependencias y scripts
└── README.md             # Este archivo
```

## Flujo de trabajo

### Órdenes de compra

1. **Creación**: El usuario crea una orden de compra en estado "borrador"
2. **Líneas**: El usuario agrega líneas a la orden de compra
3. **Envío a aprobación**: El usuario envía la orden a aprobación (estado "esperando_aprobacion")
4. **Aprobación/Rechazo**: Un usuario con rol aprobador aprueba o rechaza la orden
5. **Pago**: Las órdenes aprobadas pueden ser pagadas parcial o totalmente

### Órdenes de pago

1. **Selección de proveedor**: El usuario selecciona un proveedor
2. **Selección de orden de compra**: El usuario selecciona una orden de compra aprobada
3. **Pago**: El usuario indica el monto a pagar y la caja de donde sale el dinero
4. **Registro**: El sistema registra el pago y actualiza los estados correspondientes

## Usuarios y Roles

- **Administrador**: Acceso completo al sistema
- **Usuario**: Puede crear y gestionar órdenes de compra y pago
- **Aprobador**: Puede aprobar órdenes de compra (con límite de monto configurable)
- **Anulador**: Puede anular órdenes de pago

## Licencia

Este proyecto es de uso privado y está destinado exclusivamente para Carlini.

## Soporte

Para soporte técnico y consultas, contáctenos a través de correo electrónico o por nuestro sistema de tickets.

## Seguridad

- Todas las contraseñas se almacenan encriptadas en la base de datos
- Los permisos se verifican en cada operación
- No se permite la eliminación física de registros (solo se desactivan)
- Se mantiene un registro de cambios de estado para auditoría

## Reportes disponibles

1. **Órdenes pendientes de aprobación**: Lista órdenes esperando ser aprobadas
2. **Órdenes pendientes de pago**: Lista órdenes aprobadas pero pendientes de pago
3. **Órdenes pagadas parcialmente**: Lista órdenes con pagos parciales
4. **Historial de pagos por proveedor**: Resumen de pagos realizados a un proveedor
5. **Histórico de movimientos por caja**: Detalle de entradas y salidas de dinero de cada caja

## Notas adicionales

- Se recomienda realizar copias de seguridad regulares de la base de datos
- El sistema está optimizado para navegadores modernos como Chrome, Firefox, Edge y Safari
- La aplicación es responsive y se adapta a diferentes tamaños de pantalla
# Instrucciones para Instalar y Ejecutar el Sistema

## Requisitos previos

1. **Node.js**: Descargar e instalar desde [nodejs.org](https://nodejs.org/) (versión 14 o superior)
2. **SQL Server**: Asegúrese de tener SQL Server instalado y en ejecución
3. **SQL Server Management Studio (SSMS)**: Para administrar la base de datos

## Pasos para la instalación

### 1. Configurar la base de datos

1. Abra SQL Server Management Studio
2. Conéctese a su instancia local de SQL Server
3. Cree una nueva base de datos:
   - Nombre: `carlini_sistema`
   - Clic derecho en "Bases de datos" > "Nueva base de datos"
   - Escriba el nombre y haga clic en "Aceptar"

### 2. Configurar el entorno

1. Abra el archivo `.env` en la carpeta principal del proyecto
2. Configure las variables de conexión a SQL Server:
   ```
   DB_SERVER=localhost      # O el nombre de su instancia de SQL Server
   DB_USER=sa               # Su nombre de usuario de SQL Server
   DB_PASSWORD=YourPassword # Su contraseña de SQL Server
   DB_NAME=carlini_sistema  # Nombre de la base de datos creada
   DB_PORT=1433             # Puerto de SQL Server (generalmente 1433)
   ```

### 3. Instalar dependencias

1. Abra una terminal o línea de comandos
2. Navegue hasta la carpeta del proyecto
3. Ejecute el siguiente comando para instalar las dependencias:
   ```
   npm install
   ```

### 4. Configurar la base de datos

1. Una vez instaladas las dependencias, ejecute el script para configurar la base de datos:
   ```
   npm run setup-db
   ```
   Este script creará todas las tablas necesarias y el usuario administrador inicial.

### 5. Iniciar la aplicación

1. Para iniciar la aplicación en modo desarrollo, ejecute:
   ```
   npm run dev
   ```
   O para iniciarla en modo producción:
   ```
   npm start
   ```

2. Abra su navegador y vaya a: http://localhost:3000

3. Inicie sesión con las credenciales predeterminadas:
   - Usuario: admin@sistema.com
   - Contraseña: admin123

## Solución de problemas comunes

### Error de conexión a SQL Server

Si recibe un error al conectarse a SQL Server, verifique:

1. Que SQL Server esté en ejecución
2. Que las credenciales en el archivo `.env` sean correctas
3. Que el servicio SQL Server Browser esté habilitado
4. Que los puertos necesarios estén abiertos (generalmente 1433)

Para habilitar la autenticación SQL Server:
1. Abra SQL Server Management Studio
2. Conéctese al servidor
3. Haga clic derecho en el servidor > Propiedades
4. Vaya a Seguridad
5. Asegúrese de que "Modo de autenticación de SQL Server y Windows" esté seleccionado

### Error al inicializar la base de datos

Si recibe errores al ejecutar `npm run setup-db`:

1. Asegúrese de que la base de datos `carlini_sistema` existe
2. Verifique que el usuario tenga permisos suficientes para crear tablas
3. Revise los logs de error para identificar problemas específicos

### Error al iniciar sesión

Si no puede iniciar sesión con el usuario administrador predeterminado:

1. Verifique que el script de configuración de la base de datos se ejecutó correctamente
2. Compruebe en la base de datos que el usuario existe:
   ```sql
   SELECT * FROM usuarios WHERE email = 'admin@sistema.com'
   ```
3. Si el usuario no existe, puede crearlo manualmente:
   ```sql
   INSERT INTO usuarios (nombre, email, password, rol, activo)
   VALUES ('Administrador', 'admin@sistema.com', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXX', 'admin', 1)
   ```
   (Reemplace XXXX con una contraseña hash generada, o contacte al desarrollador para obtener ayuda)

## Preguntas frecuentes

1. **¿Cómo crear nuevos usuarios?**
   Una vez que inicie sesión como administrador, vaya a Administración > Usuarios y haga clic en "Nuevo Usuario".

2. **¿Cómo configurar los roles de usuario?**
   En la sección de edición de usuarios, puede asignar roles como "aprobador" o "anulador" y configurar límites de aprobación.

3. **¿Cómo realizar una copia de seguridad de la base de datos?**
   Puede usar SQL Server Management Studio para programar copias de seguridad regulares (recomendado).

4. **¿Dónde se almacenan los datos de sesión?**
   Los datos de sesión se almacenan en la memoria del servidor. Para entornos de producción, se recomienda configurar un almacén de sesiones persistente.

## Contacto y soporte

Para obtener ayuda adicional, contacte al equipo de desarrollo:
- Email: soporte@sistemacarlini.com
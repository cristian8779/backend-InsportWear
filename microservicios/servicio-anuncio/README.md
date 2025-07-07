# README.md

# Servicio Anuncio

Este proyecto es un microservicio para gestionar anuncios. Permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre los anuncios.

## Estructura del Proyecto

- **controllers/**: Contiene la lógica de negocio para manejar los anuncios.
- **middlewares/**: Incluye funciones middleware para la autenticación y autorización.
- **models/**: Define el modelo de datos para los anuncios utilizando Mongoose.
- **routes/**: Configura las rutas para las operaciones de anuncios.
- **server.js**: Punto de entrada de la aplicación, configura el servidor Express y las conexiones a la base de datos.
- **package.json**: Archivo de configuración de npm que lista las dependencias del proyecto.

## Instalación

1. Clona el repositorio:
   ```
   git clone <URL_DEL_REPOSITORIO>
   ```
2. Navega al directorio del proyecto:
   ```
   cd servicio-anuncio
   ```
3. Instala las dependencias:
   ```
   npm install
   ```

## Uso

Para iniciar el servidor, ejecuta el siguiente comando:
```
npm start
```

El servidor estará corriendo en `http://localhost:3000` (o el puerto que hayas configurado).

## Rutas

- `POST /api/anuncios`: Crear un nuevo anuncio.
- `GET /api/anuncios`: Obtener todos los anuncios.
- `GET /api/anuncios/:id`: Obtener un anuncio por ID.
- `PUT /api/anuncios/:id`: Actualizar un anuncio por ID.
- `DELETE /api/anuncios/:id`: Eliminar un anuncio por ID.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.
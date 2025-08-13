# Servicio Anuncio

Este servicio maneja la **gestión de anuncios** dentro de la plataforma **InsportWear**.  
Permite crear, listar, actualizar y eliminar anuncios, así como manejar la subida de imágenes y eliminar anuncios vencidos automáticamente.

---

## 📌 Tecnologías utilizadas

- **Node.js** - Entorno de ejecución.
- **Express.js** - Framework para construir APIs REST.
- **MongoDB + Mongoose** - Base de datos NoSQL.
- **Cloudinary** - Almacenamiento y gestión de imágenes.
- **Multer** - Subida de archivos.
- **JWT** - Autenticación.
- **Node Cron** - Ejecución de tareas automáticas.

---

## 📂 Estructura del proyecto

```
servicio-anuncio/
│── config/                 # Configuración de base de datos y Cloudinary
│── controllers/            # Lógica de negocio de anuncios
│── jobs/                    # Tareas programadas (limpieza de anuncios vencidos)
│── middlewares/             # Validaciones y manejo de subida de imágenes
│── models/                  # Esquema de anuncios
│── routes/                  # Rutas de la API
│── utils/                   # Funciones auxiliares
│── server.js                # Punto de entrada
│── package.json             # Dependencias y scripts
│── .env                     # Variables de entorno
```

---

## 🚀 Instalación y ejecución

1. **Clonar repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd servicio-anuncio
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear un archivo `.env` con:
```
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

4. **Ejecutar en desarrollo**
```bash
npm start
```

---

## 📜 Descripción de archivos y funciones

### `server.js`
- Configura Express.
- Conecta a MongoDB (`config/database.js`).
- Define middlewares globales.
- Carga rutas de anuncios (`routes/anuncio.routes.js`).

### `config/cloudinary.js`
- Configuración de Cloudinary para almacenar imágenes de anuncios.

### `config/database.js`
- Conexión a MongoDB usando Mongoose.

### `controllers/anuncioController.js`
- `crearAnuncio()` → Crea un nuevo anuncio.
- `obtenerAnuncios()` → Lista todos los anuncios.
- `obtenerAnuncioPorId()` → Obtiene un anuncio específico.
- `actualizarAnuncio()` → Modifica un anuncio.
- `eliminarAnuncio()` → Elimina un anuncio.
- `obtenerAnunciosPorCategoria()` → Filtra anuncios por categoría.

### `jobs/limpiarAnunciosVencidos.js`
- Tarea programada que elimina automáticamente los anuncios cuya fecha de vencimiento ha pasado.

### `middlewares/auth.js`
- Middleware que verifica el token JWT.

### `middlewares/uploadAnuncio.js`
- Maneja la subida de imágenes usando **Multer** y las envía a Cloudinary.

### `models/Anuncio.js`
- Esquema de Mongoose para los anuncios:
  - `titulo`
  - `descripcion`
  - `categoria`
  - `precio`
  - `fechaExpiracion`
  - `imagen`

### `routes/anuncio.routes.js`
- Define endpoints para manejar anuncios:
  - `POST /anuncios` → Crear anuncio.
  - `GET /anuncios` → Listar anuncios.
  - `GET /anuncios/:id` → Ver un anuncio.
  - `PUT /anuncios/:id` → Actualizar anuncio.
  - `DELETE /anuncios/:id` → Eliminar anuncio.
  - `GET /anuncios/categoria/:categoria` → Filtrar por categoría.

### `utils/externalServices.js`
- Funciones para interactuar con servicios externos.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | /anuncios | Crear un anuncio |
| GET    | /anuncios | Listar todos los anuncios |
| GET    | /anuncios/:id | Ver detalles de un anuncio |
| PUT    | /anuncios/:id | Actualizar un anuncio |
| DELETE | /anuncios/:id | Eliminar un anuncio |
| GET    | /anuncios/categoria/:categoria | Listar anuncios por categoría |

---

## 🛡 Autenticación
- Algunas rutas requieren token JWT (`auth.js`).

---

## 🖼 Manejo de imágenes
- Imágenes subidas con **Multer** y almacenadas en **Cloudinary**.

---

## 📆 Tareas automáticas
- Limpieza de anuncios expirados con `node-cron`.

---

## 🤝 Contribuir
1. Hacer un fork.
2. Crear una rama: `git checkout -b nueva-funcionalidad`.
3. Commit: `git commit -m "Agrega nueva funcionalidad"`.
4. Push: `git push origin nueva-funcionalidad`.
5. Abrir un Pull Request.

---

## 📄 Licencia
Proyecto privado para **InsportWear**.

# Servicio Categoría

Este servicio gestiona las **categorías de productos** dentro de la plataforma **InsportWear**.  
Permite crear, listar, actualizar y eliminar categorías, asegurando que los productos estén organizados correctamente.

---

## 📌 Tecnologías utilizadas

- **Node.js** - Entorno de ejecución.
- **Express.js** - Framework para construir APIs REST.
- **MongoDB + Mongoose** - Base de datos NoSQL.
- **JWT (Json Web Token)** - Autenticación segura.
- **dotenv** - Manejo de variables de entorno.

---

## 📂 Estructura del proyecto

```
servicio-categoria/
│── config/                 # Configuración de base de datos
│── controllers/            # Lógica de negocio de categorías
│── middlewares/            # Verificación de token y roles
│── models/                  # Esquema de categoría
│── routes/                  # Rutas de la API
│── server.js                # Punto de entrada
│── package.json             # Dependencias y scripts
│── .env                     # Variables de entorno
```

---

## 🚀 Instalación y ejecución

1. **Clonar repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd servicio-categoria
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
- Carga rutas de categorías (`routes/categoria.routes.js`).

### `config/database.js`
- Conexión a MongoDB usando Mongoose.

### `controllers/categoriaController.js`
- `crearCategoria()` → Crea una nueva categoría.
- `obtenerCategorias()` → Lista todas las categorías.
- `obtenerCategoriaPorId()` → Obtiene una categoría específica.
- `actualizarCategoria()` → Modifica una categoría existente.
- `eliminarCategoria()` → Elimina una categoría.

### `middlewares/auth.js`
- Middleware que verifica el token JWT.

### `middlewares/roles.js`
- Middleware que valida que el usuario tenga rol de administrador para ciertas operaciones.

### `models/Categoria.js`
- Esquema de Mongoose para categorías:
  - `nombre`
  - `descripcion`
  - `fechaCreacion`

### `routes/categoria.routes.js`
- `POST /categorias` → Crear categoría.
- `GET /categorias` → Listar todas las categorías.
- `GET /categorias/:id` → Obtener categoría por ID.
- `PUT /categorias/:id` → Actualizar categoría.
- `DELETE /categorias/:id` → Eliminar categoría.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | /categorias | Crear categoría |
| GET    | /categorias | Listar categorías |
| GET    | /categorias/:id | Obtener categoría por ID |
| PUT    | /categorias/:id | Actualizar categoría |
| DELETE | /categorias/:id | Eliminar categoría |

---

## 🛡 Seguridad
- Uso de **JWT** para autenticación.
- Validación de rol administrador para operaciones críticas.

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

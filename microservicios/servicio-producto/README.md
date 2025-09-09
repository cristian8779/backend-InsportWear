# Servicio Producto

Este servicio gestiona los **productos** dentro de la plataforma **InsportWear**.  
Permite crear, listar, actualizar, eliminar y buscar productos, asociarlos a categorías y gestionar su inventario.

---

## 📌 Tecnologías utilizadas

- **Node.js** - Entorno de ejecución.
- **Express.js** - Framework para construir APIs REST.
- **MongoDB + Mongoose** - Base de datos NoSQL.
- **JWT (Json Web Token)** - Autenticación segura.
- **dotenv** - Manejo de variables de entorno.
- **Multer** - Manejo de subida de imágenes.

---

## 📂 Estructura del proyecto

```
servicio-producto/
│── config/                 # Configuración de base de datos
│── controllers/            # Lógica de negocio de productos
│── middlewares/            # Verificación de token y roles
│── models/                  # Esquema de producto
│── routes/                  # Rutas de la API
│── uploads/                 # Carpeta para imágenes de productos
│── server.js                # Punto de entrada
│── package.json             # Dependencias y scripts
│── .env                     # Variables de entorno
```

---

## 🚀 Instalación y ejecución

1. **Clonar repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd servicio-producto
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
- Habilita subida de imágenes con Multer.
- Carga rutas de productos (`routes/producto.routes.js`).

### `config/database.js`
- Conexión a MongoDB usando Mongoose.

### `controllers/productoController.js`
- `crearProducto()` → Crea un nuevo producto con imagen.
- `obtenerProductos()` → Lista todos los productos.
- `obtenerProductoPorId()` → Obtiene un producto por ID.
- `actualizarProducto()` → Modifica un producto existente.
- `eliminarProducto()` → Elimina un producto.
- `buscarProductos()` → Busca productos por nombre o categoría.

### `middlewares/auth.js`
- Middleware que verifica el token JWT.

### `middlewares/roles.js`
- Middleware que valida que el usuario tenga rol de administrador para ciertas operaciones.

### `models/Producto.js`
- Esquema de Mongoose para productos:
  - `nombre`
  - `descripcion`
  - `precio`
  - `stock`
  - `categoriaId`
  - `imagen`
  - `fechaCreacion`

### `routes/producto.routes.js`
- `POST /productos` → Crear producto.
- `GET /productos` → Listar productos.
- `GET /productos/:id` → Obtener producto por ID.
- `PUT /productos/:id` → Actualizar producto.
- `DELETE /productos/:id` → Eliminar producto.
- `GET /productos/buscar/:termino` → Buscar producto.
- `GET /productos/filtros` → Buscar filtros.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | /productos | Crear producto |
| GET    | /productos | Listar productos |
| GET    | /productos/:id | Obtener producto |
| PUT    | /productos/:id | Actualizar producto |
| DELETE | /productos/:id | Eliminar producto |
| GET    | /productos/buscar/:termino | Buscar producto |
| GET    | /productos/filtros | Buscar filtros |
---

## 🛡 Seguridad
- Uso de **JWT** para autenticación.
- Validación de rol administrador para operaciones críticas.
- Control de inventario para evitar ventas de productos sin stock.

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

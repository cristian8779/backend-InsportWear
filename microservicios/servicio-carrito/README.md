# Servicio Carrito

Este servicio gestiona el **carrito de compras** de los usuarios dentro de la plataforma **InsportWear**.  
Permite agregar productos al carrito, listar su contenido, actualizar cantidades, eliminar productos y vaciar el carrito.

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
servicio-carrito/
│── config/                 # Configuración de base de datos
│── controllers/            # Lógica de negocio del carrito
│── middlewares/             # Verificación de token
│── models/                  # Esquema del carrito
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
cd servicio-carrito
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
- Carga rutas de carrito (`routes/carrito.routes.js`).

### `config/database.js`
- Conexión a MongoDB usando Mongoose.

### `controllers/carritoController.js`
- `agregarProducto()` → Añade un producto al carrito.
- `obtenerCarrito()` → Lista el contenido del carrito del usuario.
- `actualizarCantidad()` → Cambia la cantidad de un producto en el carrito.
- `eliminarProducto()` → Elimina un producto específico del carrito.
- `vaciarCarrito()` → Elimina todos los productos del carrito.

### `middlewares/auth.js`
- Middleware que verifica el token JWT para asegurar que el usuario está autenticado.

### `models/Carrito.js`
- Esquema de Mongoose para el carrito:
  - `usuarioId`
  - `productos` (array con id de producto, cantidad y precio)
  - `fechaCreacion`

### `routes/carrito.routes.js`
- `POST /carrito` → Agregar producto al carrito.
- `GET /carrito` → Listar productos del carrito.
- `PUT /carrito/:productoId` → Actualizar cantidad de producto.
- `DELETE /carrito/:productoId` → Eliminar producto del carrito.
- `DELETE /carrito` → Vaciar carrito.

### `utils/helpers.js`
- Funciones auxiliares para manejo de datos.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | /carrito | Agregar producto |
| GET    | /carrito | Listar productos |
| PUT    | /carrito/:productoId | Actualizar cantidad |
| DELETE | /carrito/:productoId | Eliminar producto |
| DELETE | /carrito | Vaciar carrito |

---

## 🛡 Seguridad
- Uso de **JWT** para autenticación.
- Validación de usuario antes de modificar el carrito.

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

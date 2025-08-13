# Servicio Venta

Este servicio gestiona las **ventas** dentro de la plataforma **InsportWear**.  
Permite registrar ventas, obtener historial, consultar ventas por usuario y generar reportes.

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
servicio-venta/
│── config/                 # Configuración de base de datos
│── controllers/            # Lógica de negocio de ventas
│── middlewares/            # Autenticación y roles
│── models/                  # Esquema de venta
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
cd servicio-venta
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
- Carga rutas de ventas (`routes/venta.routes.js`).

### `config/database.js`
- Conexión a MongoDB usando Mongoose.

### `controllers/ventaController.js`
- `registrarVenta()` → Crea una nueva venta con los productos del carrito.
- `obtenerVentas()` → Lista todas las ventas (solo admin).
- `obtenerVentaPorId()` → Obtiene detalles de una venta específica.
- `obtenerVentasPorUsuario()` → Lista ventas asociadas a un usuario.
- `generarReporte()` → Genera un reporte de ventas (filtrado por fecha, usuario, etc.).

### `middlewares/auth.js`
- Verifica el token JWT.

### `middlewares/roles.js`
- Valida permisos según el rol del usuario.

### `models/Venta.js`
- Esquema de Mongoose para ventas:
  - `usuarioId`
  - `productos` (array con id, cantidad, precio)
  - `total`
  - `fechaVenta`
  - `estado`

### `routes/venta.routes.js`
- `POST /ventas` → Registrar venta.
- `GET /ventas` → Listar ventas.
- `GET /ventas/:id` → Obtener venta por ID.
- `GET /ventas/usuario/:idUsuario` → Ventas por usuario.
- `GET /ventas/reporte` → Generar reporte.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | /ventas | Registrar venta |
| GET    | /ventas | Listar ventas |
| GET    | /ventas/:id | Obtener venta |
| GET    | /ventas/usuario/:idUsuario | Ventas por usuario |
| GET    | /ventas/reporte | Generar reporte |

---

## 🛡 Seguridad
- Autenticación mediante **JWT**.
- Validación de roles para operaciones críticas.
- Integración con **servicio-carrito** para procesar ventas.

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

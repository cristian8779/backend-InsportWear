# Servicio Pago

Este servicio gestiona el **proceso de pagos** dentro de la plataforma **InsportWear**.  
Permite registrar pagos, verificar transacciones y actualizar el estado de los pedidos una vez confirmados.

---

## 📌 Tecnologías utilizadas

- **Node.js** - Entorno de ejecución.
- **Express.js** - Framework para construir APIs REST.
- **MongoDB + Mongoose** - Base de datos NoSQL.
- **JWT (Json Web Token)** - Autenticación segura.
- **dotenv** - Manejo de variables de entorno.
- **Integración con pasarela de pagos** (Stripe, PayPal u otra, según configuración).

---

## 📂 Estructura del proyecto

```
servicio-pago/
│── config/                 # Configuración de base de datos y pasarela de pago
│── controllers/            # Lógica de negocio para pagos
│── middlewares/            # Verificación de token
│── models/                  # Esquema de pagos
│── routes/                  # Rutas de la API
│── utils/                   # Funciones auxiliares para pagos
│── server.js                # Punto de entrada
│── package.json             # Dependencias y scripts
│── .env                     # Variables de entorno
```

---

## 🚀 Instalación y ejecución

1. **Clonar repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd servicio-pago
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
PAYMENT_PROVIDER_KEY=...
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
- Carga rutas de pagos (`routes/pago.routes.js`).

### `config/database.js`
- Conexión a MongoDB usando Mongoose.

### `controllers/pagoController.js`
- `crearPago()` → Registra un nuevo pago.
- `obtenerPagos()` → Lista todos los pagos (solo admins).
- `obtenerPagoPorId()` → Obtiene un pago específico.
- `verificarPago()` → Confirma si un pago fue exitoso.
- `actualizarEstadoPago()` → Cambia el estado de un pago (pendiente, completado, fallido).

### `middlewares/auth.js`
- Middleware que verifica el token JWT.

### `models/Pago.js`
- Esquema de Mongoose para pagos:
  - `usuarioId`
  - `pedidoId`
  - `monto`
  - `metodoPago`
  - `estado`
  - `fecha`

### `routes/pago.routes.js`
- `POST /pagos` → Crear un nuevo pago.
- `GET /pagos` → Listar pagos (solo admins).
- `GET /pagos/:id` → Obtener pago por ID.
- `POST /pagos/verificar` → Verificar transacción.
- `PUT /pagos/:id` → Actualizar estado de pago.

### `utils/paymentHelper.js`
- Funciones para interactuar con la pasarela de pago.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | /pagos | Crear pago |
| GET    | /pagos | Listar pagos |
| GET    | /pagos/:id | Obtener pago |
| POST   | /pagos/verificar | Verificar transacción |
| PUT    | /pagos/:id | Actualizar estado |

---

## 🛡 Seguridad
- Uso de **JWT** para autenticación.
- Verificación de rol para acceso a pagos de otros usuarios.
- Comunicación segura con la pasarela de pagos.

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

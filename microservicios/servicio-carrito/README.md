# Servicio Carrito

## ¿Qué hace este microservicio?
Gestiona los carritos de compra de los usuarios, permitiendo agregar, actualizar y eliminar productos antes de la compra final.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-carrito
   ```
2. **Instala las dependencias necesarias:**
   ```bash
   npm install
   ```
3. **Inicia el microservicio:**
   ```bash
   npm start
   ```
   - Para desarrollo con recarga automática:
     ```bash
     npm run dev
     ```

---

## Endpoints principales y ejemplos de uso

### Agregar producto al carrito
- **POST** `/api/carrito`
- **Requiere:** Token JWT válido y datos del producto.
- **Ejemplo de body (JSON):**
  ```json
  {
    "productoId": "64b1f2c1e1a2b3c4d5e6f7a8",
    "cantidad": 2,
    "variacion": { "tallaNumero": "38", "color": "Negro" }
  }
  ```

### Obtener carrito del usuario
- **GET** `/api/carrito`
- **Requiere:** Token JWT válido.

### Actualizar ítem del carrito
- **PUT** `/api/carrito/:id`
- **Requiere:** Token JWT válido y datos a modificar.
- **Ejemplo de body:**
  ```json
  {
    "cantidad": 3
  }
  ```

### Eliminar ítem del carrito
- **DELETE** `/api/carrito/:id`
- **Requiere:** Token JWT válido.

---

## Cosas importantes y tips
- **Autenticación:** El token JWT es obligatorio para todas las operaciones. Agrégalo en el header:
  ```
  Authorization: Bearer <tu_token>
  ```
- **Stock:** El servicio verifica el stock antes de agregar productos al carrito.
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - Agregar productos sin stock suficiente.
- **Recomendación:** Siempre revisa la respuesta del endpoint para confirmar la operación.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `middlewares/` — Funciones para autenticación y validación
- `config/` — Configuración de base de datos

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

# Servicio Pago

## ¿Qué hace este microservicio?
Gestiona los pagos realizados por los usuarios, registra transacciones y puede integrarse con pasarelas de pago externas. Es esencial para llevar el control de las compras y su estado.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-pago
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

### Registrar un pago
- **POST** `/api/pagos`
- **Requiere:** Token JWT válido y datos del pago.
- **Ejemplo de body (JSON):**
  ```json
  {
    "usuarioId": "64b1f2c1e1a2b3c4d5e6f7a8",
    "monto": 150.00,
    "metodo": "tarjeta",
    "referencia": "1234567890",
    "estado": "aprobado"
  }
  ```
- **Respuesta esperada:**
  ```json
  {
    "mensaje": "Pago registrado correctamente.",
    "pago": { /* datos del pago */ }
  }
  ```

### Listar pagos
- **GET** `/api/pagos`
- **Respuesta ejemplo:**
  ```json
  [
    { "_id": "...", "usuarioId": "...", "monto": 150, "estado": "aprobado" },
    { "_id": "...", "usuarioId": "...", "monto": 200, "estado": "pendiente" }
  ]
  ```

---

## Cosas importantes y tips
- **Autenticación:** El token JWT es obligatorio para registrar pagos. Agrégalo en el header:
  ```
  Authorization: Bearer <tu_token>
  ```
- **Estados de pago:** Usa valores claros como `aprobado`, `pendiente`, `rechazado`.
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - No enviar el monto o el método de pago.
  - Intentar registrar un pago duplicado.
- **Recomendación:** Siempre revisa la respuesta del endpoint para confirmar el estado del pago.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `services/` — Integraciones con pasarelas de pago externas
- `utils/` — Funciones auxiliares reutilizables

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

# Servicio Venta

## ¿Qué hace este microservicio?
Gestiona las ventas, registra transacciones y controla el stock después de cada venta. Permite registrar y listar ventas de forma segura.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-venta
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

### Registrar venta
- **POST** `/api/ventas`
- **Requiere:** Token JWT válido y datos de la venta.
- **Ejemplo de body (JSON):**
  ```json
  {
    "usuarioId": "64b1f2c1e1a2b3c4d5e6f7a8",
    "productos": [
      { "productoId": "...", "cantidad": 2, "variacion": { "tallaNumero": "38", "color": "Negro" } }
    ],
    "total": 300.00
  }
  ```

### Listar ventas
- **GET** `/api/ventas`
- **Respuesta ejemplo:**
  ```json
  [
    { "_id": "...", "usuarioId": "...", "total": 300, "fecha": "2025-07-20T12:00:00Z" }
  ]
  ```

---

## Cosas importantes y tips
- **Autenticación:** El token JWT es obligatorio para registrar ventas. Agrégalo en el header:
  ```
  Authorization: Bearer <tu_token>
  ```
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - No enviar productos o total.
- **Recomendación:** Siempre revisa la respuesta del endpoint para confirmar la operación.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `utils/` — Funciones auxiliares reutilizables

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

# Servicio Producto

## ¿Qué hace este microservicio?
Gestiona productos, variaciones (tallas, colores), stock, imágenes, favoritos, historial y reseñas. Permite crear, listar, actualizar y eliminar productos, así como gestionar el stock y las variaciones de forma flexible.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-producto
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

### Crear producto
- **POST** `/api/productos`
- **Requiere:** Token JWT válido (admin/superAdmin), multipart/form-data.
- **Ejemplo de body (form-data):**
  - `nombre`: Zapatilla deportiva
  - `descripcion`: Zapatilla cómoda para correr
  - `precio`: 120
  - `categoria`: 64b1f2c1e1a2b3c4d5e6f7a8
  - `subcategoria`: Running
  - `variaciones`: (como string JSON)
    ```json
    [
      { "tallaNumero": "38", "tallaLetra": "M", "color": "Negro", "stock": 10 },
      { "tallaLetra": "L", "color": "Blanco", "stock": 5 }
    ]
    ```
  - `imagen`: (archivo de imagen)

### Listar productos y filtros
- **GET** `/api/productos`
- **Respuesta ejemplo:**
  ```json
  {
    "productos": [ /* array de productos */ ],
    "filtrosDisponibles": {
      "subcategorias": ["Running"],
      "tallasNumero": ["38"],
      "tallasLetra": ["M", "L"],
      "colores": ["Negro", "Blanco"]
    }
  }
  ```

### Obtener producto por ID
- **GET** `/api/productos/:id`

### Actualizar producto
- **PUT** `/api/productos/:id`

### Eliminar producto
- **DELETE** `/api/productos/:id`

### Reducir stock de una variación
- **PUT** `/api/productos/:id/reducir-stock-variacion`
- **Ejemplo de body:**
  ```json
  { "cantidad": 2, "tallaNumero": "38", "color": "Negro" }
  ```

---

## Cosas importantes y tips
- El campo `variaciones` debe enviarse como string JSON en multipart/form-data.
- El token JWT debe ser válido y de un usuario con rol adecuado.
- Las imágenes se suben a Cloudinary automáticamente.
- Si cambias la estructura de variaciones, actualiza también el frontend y la documentación.
- Si usas Docker, asegúrate de exponer el puerto y enlazar la base de datos.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `middlewares/` — Funciones para autenticación, subida de archivos, etc.
- `config/` — Configuración de base de datos y servicios externos
- `utils/` — Funciones auxiliares reutilizables

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

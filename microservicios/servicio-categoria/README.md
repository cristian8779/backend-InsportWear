# Servicio Categoría

## ¿Qué es este microservicio?
Este microservicio se encarga de la gestión de **categorías** y **subcategorías** de productos. Permite crear, listar, actualizar y eliminar categorías, así como asociar imágenes a cada una. Es fundamental para organizar los productos en la plataforma y facilitar búsquedas y filtros.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-categoria
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

### Crear una categoría
- **POST** `/api/categorias`
- **Requiere:** Token JWT válido (admin/superAdmin) y datos de la categoría.
- **Ejemplo de body (JSON):**
  ```json
  {
    "nombre": "Calzado",
    "descripcion": "Productos para pies",
    "imagen": "(archivo de imagen, multipart/form-data)"
  }
  ```

### Listar todas las categorías
- **GET** `/api/categorias`
- **Respuesta ejemplo:**
  ```json
  [
    { "_id": "...", "nombre": "Calzado", "descripcion": "...", "imagen": "url" },
    { "_id": "...", "nombre": "Ropa", "descripcion": "...", "imagen": "url" }
  ]
  ```

### Actualizar una categoría
- **PUT** `/api/categorias/:id`
- **Requiere:** Token JWT válido y datos a modificar.
- **Ejemplo de body:**
  ```json
  {
    "nombre": "Calzado deportivo"
  }
  ```

### Eliminar una categoría
- **DELETE** `/api/categorias/:id`
- **Requiere:** Token JWT válido.

---

## Cosas importantes y tips
- **Imágenes:** Las imágenes de categoría se suben automáticamente a Cloudinary. Si subes una nueva imagen al actualizar, la anterior se elimina.
- **Autenticación:** Todas las operaciones de creación, actualización y eliminación requieren un token JWT válido de un usuario con permisos.
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - No enviar el nombre de la categoría.
  - Intentar eliminar una categoría que no existe.
- **Recomendación:** Siempre revisa la respuesta del endpoint para ver si la operación fue exitosa o si hubo algún error.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `middlewares/` — Funciones que se ejecutan antes de los controladores (ej: autenticación)
- `config/` — Configuración de base de datos y servicios externos
- `utils/` — Funciones auxiliares reutilizables

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`:
```
Authorization: Bearer <tu_token>
```

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

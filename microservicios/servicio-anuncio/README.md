# README.md

# Servicio Anuncio

## ¿Qué hace este microservicio?
Gestiona anuncios publicados en la plataforma. Permite crear, listar, actualizar y eliminar anuncios, así como limpiar automáticamente los anuncios vencidos.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-anuncio
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

### Crear anuncio
- **POST** `/api/anuncios`
- **Requiere:** Token JWT válido y datos del anuncio.
- **Ejemplo de body (JSON):**
  ```json
  {
    "titulo": "Oferta especial",
    "descripcion": "Descuento en zapatillas",
    "imagen": "(archivo de imagen, multipart/form-data)"
  }
  ```

### Listar anuncios
- **GET** `/api/anuncios`
- **Respuesta ejemplo:**
  ```json
  [
    { "_id": "...", "titulo": "Oferta especial", "descripcion": "...", "imagen": "url" }
  ]
  ```

### Eliminar anuncio
- **DELETE** `/api/anuncios/:id`
- **Requiere:** Token JWT válido.

---

## Cosas importantes y tips
- **Imágenes:** Las imágenes se suben automáticamente a Cloudinary.
- **Limpieza automática:** El servicio ejecuta un job para eliminar anuncios vencidos.
- **Autenticación:** El token JWT es obligatorio para crear/eliminar anuncios. Agrégalo en el header:
  ```
  Authorization: Bearer <tu_token>
  ```
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - No enviar el título del anuncio.
- **Recomendación:** Siempre revisa la respuesta del endpoint para confirmar la operación.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `middlewares/` — Funciones para autenticación y subida de archivos
- `config/` — Configuración de base de datos y servicios externos
- `jobs/` — Tareas programadas para limpieza automática

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.
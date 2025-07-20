# Servicio Usuario

## ¿Qué hace este microservicio?
Gestiona los usuarios, sus datos personales, favoritos, historial y preferencias. Permite crear, listar, actualizar y eliminar usuarios, así como gestionar sus relaciones con otros servicios.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-usuario
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

### Crear usuario
- **POST** `/api/usuarios`
- **Ejemplo de body (JSON):**
  ```json
  {
    "nombre": "Carlos",
    "correo": "carlos@correo.com",
    "password": "123456"
  }
  ```

### Obtener usuario por ID
- **GET** `/api/usuarios/:id`

### Actualizar usuario
- **PUT** `/api/usuarios/:id`
- **Ejemplo de body:**
  ```json
  {
    "nombre": "Carlos Actualizado"
  }
  ```

### Eliminar usuario
- **DELETE** `/api/usuarios/:id`

---

## Cosas importantes y tips
- **Autenticación:** El token JWT es obligatorio para operaciones protegidas. Agrégalo en el header:
  ```
  Authorization: Bearer <tu_token>
  ```
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - Intentar modificar/eliminar un usuario sin permisos.
- **Recomendación:** Siempre revisa la respuesta del endpoint para confirmar la operación.

---

## Estructura de carpetas explicada
- `controller/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `middlewares/` — Funciones para autenticación y validación
- `config/` — Configuración de base de datos
- `utils/` — Funciones auxiliares reutilizables

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

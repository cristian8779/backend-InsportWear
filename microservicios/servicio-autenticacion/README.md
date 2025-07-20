# Servicio Autenticación

## ¿Qué hace este microservicio?
Gestiona la autenticación de usuarios, login, registro, login con Google, gestión de credenciales y roles. Permite proteger rutas, enviar correos de bienvenida y cambiar roles de usuario.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-autenticacion
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

### Login usuario
- **POST** `/api/auth/login`
- **Ejemplo de body (JSON):**
  ```json
  {
    "correo": "usuario@correo.com",
    "password": "123456"
  }
  ```
- **Respuesta esperada:**
  ```json
  {
    "token": "...",
    "usuario": { /* datos del usuario */ }
  }
  ```

### Registro usuario
- **POST** `/api/auth/register`
- **Ejemplo de body:**
  ```json
  {
    "nombre": "Ana",
    "correo": "ana@correo.com",
    "password": "123456"
  }
  ```

### Login con Google
- **POST** `/api/auth/google`
- **Ejemplo de body:**
  ```json
  {
    "tokenGoogle": "..."
  }
  ```

### Obtener datos usuario autenticado
- **GET** `/api/auth/usuario`
- **Requiere:** Token JWT válido en el header.

### Cambiar rol usuario
- **PUT** `/api/auth/usuario/rol`
- **Requiere:** Token JWT válido y datos del nuevo rol.
- **Ejemplo de body:**
  ```json
  {
    "nuevoRol": "admin"
  }
  ```

---

## Cosas importantes y tips
- **Autenticación:** El token JWT es obligatorio para rutas protegidas. Agrégalo en el header:
  ```
  Authorization: Bearer <tu_token>
  ```
- **Correos:** El servicio puede enviar correos de bienvenida y cambio de rol.
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - Intentar cambiar el rol sin permisos suficientes.
  - Registrar un usuario con correo ya existente.
- **Recomendación:** Siempre revisa la respuesta del endpoint para confirmar la operación.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `middlewares/` — Funciones para autenticación y validación
- `config/` — Configuración de base de datos y servicios externos
- `services/` — Lógica de negocio adicional (ej: Google, roles)
- `utils/` — Funciones auxiliares reutilizables

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

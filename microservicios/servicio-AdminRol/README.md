# Servicio AdminRol

## ¿Qué hace este microservicio?
Gestiona los roles de usuario y la administración de usuarios con privilegios especiales (admin, superAdmin). Permite crear usuarios administradores, solicitar cambios de rol y revisar solicitudes.

---

## Instalación y ejecución paso a paso

1. **Ubícate en la carpeta del servicio:**
   ```bash
   cd microservicios/servicio-AdminRol
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

### Crear usuario admin
- **POST** `/api/admin/crear`
- **Requiere:** Token JWT válido de superAdmin y datos del nuevo admin.
- **Ejemplo de body (JSON):**
  ```json
  {
    "nombre": "Juan Pérez",
    "correo": "juan@admin.com",
    "password": "123456"
  }
  ```

### Solicitar cambio de rol
- **POST** `/api/rol/solicitar`
- **Requiere:** Token JWT válido y motivo de la solicitud.
- **Ejemplo de body:**
  ```json
  {
    "motivo": "Necesito permisos de admin para gestionar productos."
  }
  ```

### Listar solicitudes de rol
- **GET** `/api/rol/solicitudes`
- **Requiere:** Token JWT válido de admin/superAdmin.

---

## Cosas importantes y tips
- **Autenticación:** El token JWT es obligatorio para todas las operaciones. Agrégalo en el header:
  ```
  Authorization: Bearer <tu_token>
  ```
- **Permisos:** Solo los superAdmin pueden crear nuevos administradores.
- **Correos:** El servicio puede enviar notificaciones por correo usando Resend.
- **Errores comunes:**
  - No enviar el token o enviar uno inválido.
  - Intentar crear un admin sin permisos suficientes.
  - Solicitar un cambio de rol sin motivo.
- **Recomendación:** Siempre revisa la respuesta del endpoint para confirmar la operación.

---

## Estructura de carpetas explicada
- `controllers/` — Lógica de negocio (qué hacer cuando llega una petición)
- `models/` — Esquemas de Mongoose (estructura de los datos en MongoDB)
- `routes/` — Definición de rutas y métodos HTTP
- `middlewares/` — Funciones para verificar permisos y autenticación
- `config/` — Configuración de base de datos y servicios externos
- `utils/` — Funciones auxiliares reutilizables

---

## Pruebas rápidas
Puedes usar Thunder Client, Postman o cualquier cliente HTTP para probar los endpoints. Recuerda siempre enviar el token JWT en el header `Authorization`.

---

## ¿A quién preguntar dudas?
Si tienes problemas, revisa primero los mensajes de error y la consola. Si no logras resolverlo, contacta al equipo de backend o revisa la documentación interna del proyecto.

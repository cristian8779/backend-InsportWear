
# Servicio AdminRol

Este servicio forma parte del ecosistema **InsportWear** y está diseñado para la **gestión de roles y administración de usuarios** dentro de la plataforma. 
Proporciona endpoints para manejar administradores, solicitudes de cambio de rol y validaciones de permisos.

---

## 📌 Tecnologías utilizadas

- **Node.js** - Entorno de ejecución.
- **Express.js** - Framework para construir APIs REST.
- **MongoDB + Mongoose** - Base de datos NoSQL y modelado de datos.
- **Resend API** - Envío de correos electrónicos.
- **Cron Jobs** - Ejecución de tareas programadas.
- **JWT** - Autenticación mediante tokens.

---

## 📂 Estructura del proyecto

```
servicio-AdminRol/
│── config/                # Configuraciones de base de datos, cron jobs y API de correo
│── controllers/           # Lógica principal de cada endpoint
│── middlewares/           # Validaciones y control de acceso
│── models/                # Modelos de Mongoose
│── routes/                # Definición de rutas y asignación de controladores
│── utils/                 # Funciones utilitarias (plantillas de correos, etc.)
│── server.js               # Punto de entrada del servidor
│── package.json            # Dependencias y scripts
│── .gitignore
```

---

## 🚀 Instalación y ejecución

1. **Clonar repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd servicio-AdminRol
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
RESEND_API_KEY=...
```

4. **Ejecutar en desarrollo**
```bash
npm start
```

---

## 📜 Descripción de archivos y funciones

### `server.js`
- Configura Express.
- Conecta con MongoDB (`config/database.js`).
- Define middlewares globales.
- Carga rutas (`routes/adminRoutes.js` y `routes/rolRoutes.js`).

### `config/database.js`
- Conecta con MongoDB usando Mongoose.
- Maneja eventos de conexión y errores.

### `config/cronJobs.js`
- Configura tareas programadas para ejecutar en intervalos definidos.

### `config/resend.js`
- Configura el cliente de Resend para enviar correos electrónicos.

### `controllers/adminController.js`
- Maneja creación, actualización y eliminación de administradores.
- Funciones clave:
  - `crearAdministrador()` → Crea un nuevo admin.
  - `obtenerAdministradores()` → Lista todos.
  - `actualizarAdministrador()` → Modifica datos.
  - `eliminarAdministrador()` → Elimina.

### `controllers/rolController.js`
- Maneja solicitudes y cambios de rol.
- Funciones clave:
  - `solicitarCambioRol()` → Un usuario solicita cambio de rol.
  - `aprobarCambioRol()` → Acepta la solicitud.
  - `rechazarCambioRol()` → La rechaza.

### `middlewares/esSuperAdmin.js`
- Verifica si el usuario tiene rol **SUPER_ADMIN**.

### `middlewares/limitarInvitacion.js`
- Restringe el número de invitaciones que un usuario puede enviar.

### `middlewares/limitarInvitacionPendiente.js`
- Evita que un usuario tenga varias solicitudes pendientes.

### `middlewares/verificarToken.js`
- Valida el token JWT y agrega el usuario autenticado al `req`.

### `models/RolRequest.js`
- Modelo Mongoose para solicitudes de cambio de rol.
- Campos: `usuarioId`, `rolSolicitado`, `estado`, `fechaSolicitud`.

### `routes/adminRoutes.js`
- Endpoints relacionados con administradores.
  - `GET /admins`
  - `POST /admins`
  - `PUT /admins/:id`
  - `DELETE /admins/:id`

### `routes/rolRoutes.js`
- Endpoints relacionados con cambios de rol.
  - `POST /roles/solicitud`
  - `PUT /roles/aprobar/:id`
  - `PUT /roles/rechazar/:id`

### `utils/plantillaCambioRol.js`
- Plantilla HTML para enviar correos al aprobar o rechazar cambios de rol.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | /admins | Lista todos los administradores |
| POST   | /admins | Crea un nuevo administrador |
| PUT    | /admins/:id | Actualiza datos de un administrador |
| DELETE | /admins/:id | Elimina un administrador |
| POST   | /roles/solicitud | Solicita un cambio de rol |
| PUT    | /roles/aprobar/:id | Aprueba solicitud de cambio de rol |
| PUT    | /roles/rechazar/:id | Rechaza solicitud de cambio de rol |

---

## 🛡 Autenticación y permisos
- Todas las rutas protegidas usan `verificarToken`.
- Algunas requieren ser **SUPER_ADMIN** (`esSuperAdmin`).

---

## 📧 Notificaciones por correo
- Al aprobar o rechazar un cambio de rol, se envía un correo con `Resend` usando la plantilla en `utils/plantillaCambioRol.js`.

---

## 📆 Tareas programadas
- Configuradas en `config/cronJobs.js`.
- Pueden ejecutar limpiezas automáticas de solicitudes expiradas.

---

## 🤝 Contribuir
1. Hacer un fork.
2. Crear una rama: `git checkout -b nueva-funcionalidad`.
3. Commit: `git commit -m "Agrega nueva funcionalidad"`.
4. Push: `git push origin nueva-funcionalidad`.
5. Abrir un Pull Request.

---

## 📄 Licencia
Este proyecto es privado y pertenece a **InsportWear**.

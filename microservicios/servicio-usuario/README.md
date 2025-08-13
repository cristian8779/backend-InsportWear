# Servicio Usuario

Este servicio administra la **gestión de usuarios** dentro de la plataforma **InsportWear**.  
Permite registrar usuarios, actualizar sus datos, eliminar cuentas, asignar roles y obtener información de perfil.

---

## 📌 Tecnologías utilizadas

- **Node.js** - Entorno de ejecución.
- **Express.js** - Framework para construir APIs REST.
- **MongoDB + Mongoose** - Base de datos NoSQL.
- **JWT (Json Web Token)** - Autenticación segura.
- **bcrypt** - Cifrado de contraseñas.
- **dotenv** - Manejo de variables de entorno.

---

## 📂 Estructura del proyecto

```
servicio-usuario/
│── config/                 # Configuración de base de datos
│── controllers/            # Lógica de negocio de usuarios
│── middlewares/            # Autenticación y autorización
│── models/                  # Esquema de usuario
│── routes/                  # Rutas de la API
│── server.js                # Punto de entrada
│── package.json             # Dependencias y scripts
│── .env                     # Variables de entorno
```

---

## 🚀 Instalación y ejecución

1. **Clonar repositorio**
```bash
git clone <URL_DEL_REPOSITORIO>
cd servicio-usuario
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
```

4. **Ejecutar en desarrollo**
```bash
npm start
```

---

## 📜 Descripción de archivos y funciones

### `server.js`
- Configura Express.
- Conecta a MongoDB (`config/database.js`).
- Carga rutas de usuarios (`routes/usuario.routes.js`).

### `config/database.js`
- Conexión a MongoDB usando Mongoose.

### `controllers/usuarioController.js`
- `registrarUsuario()` → Crea un nuevo usuario con contraseña cifrada.
- `obtenerUsuarios()` → Lista todos los usuarios (solo admin).
- `obtenerUsuarioPorId()` → Obtiene datos de un usuario específico.
- `actualizarUsuario()` → Modifica datos de un usuario.
- `eliminarUsuario()` → Elimina un usuario.
- `asignarRol()` → Cambia el rol de un usuario.
- `perfilUsuario()` → Obtiene el perfil del usuario autenticado.

### `middlewares/auth.js`
- Verifica el token JWT.

### `middlewares/roles.js`
- Valida que el usuario tenga permisos adecuados (admin, usuario normal, etc.).

### `models/Usuario.js`
- Esquema de Mongoose para usuarios:
  - `nombre`
  - `correo`
  - `password`
  - `rol`
  - `fechaRegistro`

### `routes/usuario.routes.js`
- `POST /usuarios` → Registrar usuario.
- `GET /usuarios` → Listar usuarios.
- `GET /usuarios/:id` → Obtener usuario por ID.
- `PUT /usuarios/:id` → Actualizar usuario.
- `DELETE /usuarios/:id` → Eliminar usuario.
- `PATCH /usuarios/:id/rol` → Cambiar rol.
- `GET /usuarios/perfil` → Perfil del usuario autenticado.

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | /usuarios | Registrar usuario |
| GET    | /usuarios | Listar usuarios |
| GET    | /usuarios/:id | Obtener usuario |
| PUT    | /usuarios/:id | Actualizar usuario |
| DELETE | /usuarios/:id | Eliminar usuario |
| PATCH  | /usuarios/:id/rol | Cambiar rol |
| GET    | /usuarios/perfil | Perfil del usuario |

---

## 🛡 Seguridad
- Contraseñas cifradas con **bcrypt**.
- Autenticación mediante **JWT**.
- Validación de roles para acceso a datos sensibles.

---

## 🤝 Contribuir
1. Hacer un fork.
2. Crear una rama: `git checkout -b nueva-funcionalidad`.
3. Commit: `git commit -m "Agrega nueva funcionalidad"`.
4. Push: `git push origin nueva-funcionalidad`.
5. Abrir un Pull Request.

---

## 📄 Licencia
Proyecto privado para **InsportWear**.

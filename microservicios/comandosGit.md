# 📌 Guía Rápida de Comandos Git para GitHub

Este documento contiene los comandos más utilizados para trabajar con repositorios Git y GitHub: clonar, traer cambios, subir actualizaciones y manejar ramas.

---

## 🔹 Configuración inicial (solo la primera vez en tu PC)
```bash
# Configurar nombre de usuario
git config --global user.name "Tu Nombre"

# Configurar email (debe ser el mismo de tu cuenta de GitHub)
git config --global user.email "tuemail@example.com"

# Ver configuración actual
git config --list
```

---

## 🔹 Clonar un repositorio existente
```bash
git clone https://github.com/usuario/nombre-repo.git
```
Esto crea una carpeta con todos los archivos e historial del proyecto.

---

## 🔹 Ver el estado del repositorio
```bash
git status
```
Muestra qué archivos fueron modificados, agregados o eliminados.

---

## 🔹 Traer cambios del repositorio remoto
```bash
# Solo descarga cambios
git fetch

# Descarga y combina cambios
git pull

# Desde una rama específica (ej. main)
git pull origin main
```

---

## 🔹 Agregar archivos para commit
```bash
# Agregar un archivo específico
git add archivo.txt

# Agregar todos los cambios
git add .
```

---

## 🔹 Confirmar los cambios (commit)
```bash
git commit -m "Descripción clara de lo que hiciste"
```

---

## 🔹 Subir cambios a GitHub
```bash
# Si ya estás en la rama correcta
git push

# A una rama específica
git push origin nombre-de-la-rama
```

---

## 🔹 Manejo de ramas
```bash
# Crear nueva rama
git branch nombre-de-la-rama

# Cambiar de rama
git checkout nombre-de-la-rama

# Crear y cambiar en un solo paso
git checkout -b nombre-de-la-rama

# Ver todas las ramas
git branch

# Fusionar rama con la actual
git merge nombre-de-la-rama

# Eliminar rama local
git branch -d nombre-de-la-rama

# Eliminar rama remota
git push origin --delete nombre-de-la-rama
```

---

## 🔹 Deshacer cambios
```bash
# Restaurar un archivo a la última versión
git checkout -- archivo.txt

# Eliminar último commit pero conservar cambios
git reset --soft HEAD~1

# Eliminar último commit y cambios
git reset --hard HEAD~1
```

---

## 🔹 Guardar cambios temporalmente (stash)
```bash
# Guardar cambios
git stash

# Restaurar cambios
git stash pop
```

---

💡 **Consejo**: Siempre antes de subir (`git push`), es buena práctica hacer:
```bash
git pull
```
para traer cambios nuevos y evitar conflictos.

---
📜 **Licencia**: Uso libre.

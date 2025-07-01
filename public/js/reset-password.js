// =======================
// Elementos DOM
// =======================
const form = document.getElementById('resetForm');
const messageEl = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const modal = document.getElementById('modal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const formContainer = document.querySelector('.form-container');
const formTitle = document.querySelector('.form-title'); // Verifica que exista en el HTML

// =======================
// Configuración
// =======================
const baseUrl = 'http://20.251.145.196:5000';
const token = new URLSearchParams(window.location.search).get('token');

// =======================
// Utilidades
// =======================
const showMessage = (msg, type = 'error') => {
  if (!messageEl) return;
  messageEl.textContent = msg;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
};

const hideMessage = () => {
  if (!messageEl) return;
  messageEl.style.display = 'none';
};

// =======================
// Verificar token
// =======================
const verificarToken = async () => {
  if (!token) {
    showMessage('Token no válido.');
    if (submitBtn) submitBtn.disabled = true;
    if (formContainer) formContainer.style.display = 'none'; // Oculta formulario y título
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/auth/reset-password/${encodeURIComponent(token)}`);
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.mensaje || 'Token inválido o expirado.');
      if (submitBtn) submitBtn.disabled = true;
      if (formContainer) formContainer.style.display = 'none';
      messageEl.style.display = 'block';
      return;
    }
  } catch (err) {
    showMessage('Error al verificar token.');
    if (submitBtn) submitBtn.disabled = true;
    if (formContainer) formContainer.style.display = 'none';
  }
};

// =======================
// Enviar nueva contraseña
// =======================
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();

  const password = form.newPassword.value.trim();
  const confirm = form.confirmPassword.value.trim();

  if (!password || !confirm) {
    showMessage('Completa todos los campos.');
    return;
  }

  if (password !== confirm) {
    showMessage('Las contraseñas no coinciden.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando...';

  try {
    const res = await fetch(`${baseUrl}/api/auth/reset-password/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevaPassword: password }),
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(data.mensaje || 'Contraseña actualizada.', 'success');
      form.reset();
      modal.classList.add('active');
      // Dejamos el formulario visible para que el usuario vea el modal
    } else {
      showMessage(data.mensaje || 'Error al actualizar la contraseña.');
    }
  } catch (err) {
    showMessage('Error de red. Intenta más tarde.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar nueva contraseña';
  }
});

// =======================
// Modal: botón cerrar
// =======================
modalCloseBtn?.addEventListener('click', () => {
  modal.classList.remove('active');
  if (formContainer) formContainer.style.display = 'none';
  hideMessage();
});

// =======================
// Mostrar/Ocultar contraseña
// =======================
document.querySelectorAll('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');

    const eyeOpen = btn.querySelector('.eye-open');
    const eyeClosed = btn.querySelector('.eye-closed');

    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPassword ? 'none' : 'inline';
      eyeClosed.style.display = isPassword ? 'inline' : 'none';
    }
  });
});

// =======================
// Init
// =======================
window.addEventListener('DOMContentLoaded', verificarToken);

/* ==========================================================================
   LÓGICA DEL FORMULARIO DE INICIO DE SESIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const passInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eyeIcon');
  const submitBtn = document.getElementById('btnLogin');

  // Alternar visualización de contraseña
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';

      if (eyeIcon) {
        if (isPassword) {
          // Mostrar ojo tachado (ocultar)
          eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          `;
        } else {
          // Mostrar ojo normal
          eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          `;
        }
      }
    });
  }

  // Envío del formulario de login
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usuario = document.getElementById('usuario').value.trim();
      const password = document.getElementById('password').value.trim();
      const recordar = document.getElementById('recordar').checked;

      if (!usuario || !password) {
        showAlert('Por favor ingrese su usuario y contraseña.', 'danger');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Iniciando sesión...';
      hideAlert();

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, password, recordar })
        });

        const data = await response.json();

        if (data.success) {
          showAlert(data.message || 'Acceso concedido. Redirigiendo...', 'success');
          setTimeout(() => {
            window.location.href = data.redirect || '/inicio';
          }, 800);
        } else {
          showAlert(data.message || 'Usuario o contraseña incorrectos.', 'danger');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Iniciar Sesión';
        }
      } catch (error) {
        console.error('Error en login:', error);
        showAlert('No se pudo conectar con el servidor. Intente nuevamente.', 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar Sesión';
      }
    });
  }

  function showAlert(msg, type) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `login-alert show login-alert-${type}`;
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.className = 'login-alert';
  }
});

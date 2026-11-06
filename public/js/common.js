
/* ==========================================================================
   SISTEMA DE ASISTENCIA C.E.I. SIMÓN DÍAZ - JS COMÚN
   Arquitectura Centralizada: Sidebar, Cápsula de Administrador y Tema Unificado
   ========================================================================== */

let currentAdminProfile = null;

document.addEventListener('DOMContentLoaded', () => {
  initSharedLayout();
  initDateAndClock();
  initExportDropdowns();
  initLogout();
});

// 1. INICIALIZAR LAYOUT COMPARTIDO (SIDEBAR Y ADMINISTRADOR CENTRALIZADOS)
function initSharedLayout() {
  renderSharedSidebar();
  renderSharedAdminCapsule();
}

// RENDERIZAR LA SIDEBAR MODERNA UNA SOLA VEZ DE MANERA DINÁMICA
function renderSharedSidebar() {
  const sidebar = document.querySelector('.sidebar-modern');
  if (!sidebar) return;

  const path = window.location.pathname;
  const isInicio = path === '/inicio' || path === '/preview-inicio';
  const isEmpleados = path.startsWith('/empleados') || path.startsWith('/preview-empleados') || path.startsWith('/preview-modal');
  const isAsistencia = path.startsWith('/asistencia') || path.startsWith('/preview-asistencia');
  const isPermisos = path.startsWith('/permisos') || path.startsWith('/preview-permisos');
  const isReportes = path.startsWith('/reportes') || path.startsWith('/preview-reportes');

  sidebar.innerHTML = `
    <div class="sidebar-top">
      <div class="sidebar-brand-box">
        <img src="/assets/escudo.png" alt="Escudo" class="sidebar-shield">
        <span class="sidebar-school-title">C.E.I. SIMON DIAZ</span>
      </div>

      <nav class="sidebar-nav">
        <a href="/inicio" class="nav-item ${isInicio ? 'active' : ''}">
          <i class="fas fa-home nav-icon"></i>
          <span>Inicio</span>
        </a>
        <a href="/empleados" class="nav-item ${isEmpleados ? 'active' : ''}">
          <i class="fas fa-user-friends nav-icon"></i>
          <span>Empleados</span>
        </a>
        <a href="/asistencia" class="nav-item ${isAsistencia ? 'active' : ''}">
          <i class="far fa-calendar-alt nav-icon"></i>
          <span>Asistencia</span>
        </a>
        <a href="/permisos" class="nav-item ${isPermisos ? 'active' : ''}">
          <i class="far fa-file-alt nav-icon"></i>
          <span>Permisos</span>
        </a>
        <a href="/reportes" class="nav-item ${isReportes ? 'active' : ''}">
          <i class="fas fa-chart-line nav-icon"></i>
          <span>Reportes</span>
        </a>
      </nav>
    </div>

    <div class="sidebar-bottom">
      <div class="dark-mode-pill">
        <div class="dark-mode-left">
          <i id="themeIcon" class="fas fa-moon"></i>
          <span id="themeLabel">Modo Oscuro</span>
        </div>
        <label class="toggle-pill" for="themeSwitch">
          <input type="checkbox" id="themeSwitch">
          <span class="toggle-circle"></span>
        </label>
      </div>

      <button type="button" class="logout-link logout-btn">
        <i class="fas fa-sign-out-alt"></i>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  `;

  initTheme();
}

// 2. MODO OSCURO / MODO CLARO (CAMBIO DINÁMICO DE TEXTO, ICONO SOL/LUNA Y PERSISTENCIA)
function initTheme() {
  const themeSwitch = document.getElementById('themeSwitch');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  const savedTheme = localStorage.getItem('cei_theme') || 'light';

  function applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      if (themeSwitch) themeSwitch.checked = true;
      if (themeLabel) themeLabel.textContent = 'Modo Claro';
      if (themeIcon) {
        themeIcon.className = 'fas fa-sun';
        themeIcon.style.color = '#FFFFFF';
      }
    } else {
      document.body.classList.remove('dark-mode');
      if (themeSwitch) themeSwitch.checked = false;
      if (themeLabel) themeLabel.textContent = 'Modo Oscuro';
      if (themeIcon) {
        themeIcon.className = 'fas fa-moon';
        themeIcon.style.color = '#FFFFFF';
      }
    }
  }

  // Si el HTML ya traía dark-mode por preview o sesión previa, respetarlo
  const startDark = document.body.classList.contains('dark-mode') || savedTheme === 'dark';
  applyTheme(startDark);

  if (themeSwitch) {
    themeSwitch.onchange = () => {
      const isDark = themeSwitch.checked;
      applyTheme(isDark);
      localStorage.setItem('cei_theme', isDark ? 'dark' : 'light');
    };
  }
}

// 3. CÁPSULA SUPERIOR DERECHA Y MODAL DE ADMINISTRADOR UNIFICADO
function renderSharedAdminCapsule() {
  const mount = document.getElementById('adminCapsuleMount') || document.querySelector('.admin-capsule');
  if (!mount) return;

  const capsuleHtml = `
    <div class="admin-capsule admin-profile-card" id="globalAdminCapsule" title="Haga clic para ver o editar el perfil de administrador">
      <div class="admin-text-wrap">
        <span class="admin-name" id="globalAdminRole">Administrador</span>
        <span class="admin-email-sub" id="globalAdminEmail">admin@gmail.com</span>
      </div>
      <img src="/uploads/admin/default-admin.png" alt="Admin" class="admin-avatar-circle" id="globalAdminAvatar">
    </div>
  `;

  if (mount.id === 'adminCapsuleMount') {
    mount.innerHTML = capsuleHtml;
  } else {
    mount.outerHTML = `<div id="adminCapsuleMount">${capsuleHtml}</div>`;
  }

  // Inyectar modal si no existe
  injectAdminModal();

  // Consultar perfil de administrador
  fetchAdminProfile();

  // Evento clic para abrir el modal
  const capsuleEl = document.getElementById('globalAdminCapsule');
  if (capsuleEl) {
    capsuleEl.addEventListener('click', () => openAdminProfileModal('view'));
  }
}

async function fetchAdminProfile() {
  try {
    const res = await fetch('/api/admin/profile');
    const data = await res.json();
    if (data.success && data.profile) {
      currentAdminProfile = data.profile;
      updateAdminCapsuleUI(data.profile);
    }
  } catch (err) {
    console.error('Error al cargar perfil de administrador:', err);
  }
}

function updateAdminCapsuleUI(profile) {
  const roleEl = document.getElementById('globalAdminRole');
  const emailEl = document.getElementById('globalAdminEmail');
  const avatarEl = document.getElementById('globalAdminAvatar');

  if (roleEl) roleEl.textContent = profile.titulo || profile.rol || profile.nombre || 'Administrador';
  if (emailEl) emailEl.textContent = profile.email || 'admin@gmail.com';
  if (avatarEl && profile.foto) avatarEl.src = profile.foto;
}

// INYECTAR MODAL DE ADMINISTRADOR UNIFICADO
function injectAdminModal() {
  if (document.getElementById('adminProfileModalBackdrop')) return;

  const modalHtml = `
    <div id="adminProfileModalBackdrop" class="admin-modal-backdrop">
      <div class="admin-modal-card">
        <div class="admin-modal-header">
          <h3 class="admin-modal-title" id="adminModalMainTitle">Perfil de Administrador</h3>
          <button type="button" class="admin-modal-close" onclick="closeAdminProfileModal()">&times;</button>
        </div>

        <div class="admin-modal-body">
          <!-- VISTA 1: CONSULTA DE PERFIL -->
          <div id="adminViewMode" class="admin-view-profile-box">
            <img id="adminDetailAvatar" src="/uploads/admin/default-admin.png" alt="Admin" class="admin-view-avatar">
            <h4 id="adminDetailNombre" class="admin-view-name">Administrador</h4>
            <span id="adminDetailRolBadge" class="admin-view-role-badge">Administrador</span>

            <div class="admin-view-details-grid">
              <div class="admin-detail-item">
                <span class="admin-detail-label"><i class="fas fa-user" style="margin-right:6px;"></i> Usuario de Acceso:</span>
                <span id="adminDetailUsuario" class="admin-detail-value">admin</span>
              </div>
              <div class="admin-detail-item">
                <span class="admin-detail-label"><i class="fas fa-envelope" style="margin-right:6px;"></i> Correo Electrónico:</span>
                <span id="adminDetailEmail" class="admin-detail-value">admin@gmail.com</span>
              </div>
            </div>

            <div style="display: flex; gap: 12px; width: 100%; justify-content: flex-end;">
              <button type="button" class="btn-admin-outline" onclick="closeAdminProfileModal()">Cerrar</button>
              <button type="button" class="btn-admin-primary" onclick="openAdminProfileModal('edit')">
                <i class="fas fa-pencil-alt"></i> Editar Perfil
              </button>
            </div>
          </div>

          <!-- VISTA 2: FORMULARIO DE EDICIÓN -->
          <form id="adminProfileEditForm" style="display: none;" enctype="multipart/form-data">
            <div class="admin-avatar-upload-wrap">
              <img id="adminEditPhotoPreview" src="/uploads/admin/default-admin.png" alt="Admin Preview">
              <label for="adminPhotoFile" class="admin-camera-btn" title="Subir nueva foto de administrador">
                <i class="fas fa-camera"></i>
              </label>
              <button type="button" id="adminDeletePhotoBtn" class="admin-delete-photo-btn" title="Eliminar foto de administrador (restablecer por defecto)" style="display: none;">
                <i class="fas fa-trash-alt"></i>
              </button>
              <input type="file" id="adminPhotoFile" name="foto" accept="image/*" style="display: none;">
              <input type="hidden" id="adminEliminarFoto" name="eliminar_foto" value="0">
            </div>

            <div class="admin-form-group">
              <label for="adminEditTitulo" class="admin-form-label">Título / Cargo</label>
              <input type="text" id="adminEditTitulo" name="titulo" class="admin-form-input" placeholder="Ej. Administrador / Directora" required>
            </div>

            <div class="admin-form-group">
              <label for="adminEditNombre" class="admin-form-label">Nombre Completo</label>
              <input type="text" id="adminEditNombre" name="nombre" class="admin-form-input" placeholder="Ej. Administrador" required>
            </div>

            <div class="admin-form-group">
              <label for="adminEditUsuario" class="admin-form-label">Usuario de Acceso (Para Iniciar Sesión)</label>
              <input type="text" id="adminEditUsuario" name="usuario" class="admin-form-input" placeholder="Ej. admin" required>
            </div>

            <div class="admin-form-group">
              <label for="adminEditEmail" class="admin-form-label">Correo Electrónico (Para Iniciar Sesión)</label>
              <input type="email" id="adminEditEmail" name="email" class="admin-form-input" placeholder="admin@gmail.com" required>
            </div>

            <!-- SECCIÓN CAMBIO DE CONTRASEÑA -->
            <div class="admin-password-section">
              <label class="admin-form-label" style="display:block; margin-bottom: 8px;">
                <i class="fas fa-lock" style="margin-right:4px;"></i> Cambiar Contraseña <span style="font-size:0.72rem; font-weight:normal; color:#94A3B8;">(Opcional, dejar en blanco para no cambiar)</span>
              </label>

              <div class="admin-form-group">
                <label for="adminEditPassword" class="admin-form-label" style="font-weight:500; font-size:0.76rem;">Nueva Contraseña</label>
                <div class="password-input-wrap">
                  <input type="password" id="adminEditPassword" name="password" class="admin-form-input" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('adminEditPassword', this)" title="Ver / Ocultar">
                    <i class="far fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="admin-form-group">
                <label for="adminEditConfirmPassword" class="admin-form-label" style="font-weight:500; font-size:0.76rem;">Confirmar Nueva Contraseña</label>
                <div class="password-input-wrap">
                  <input type="password" id="adminEditConfirmPassword" name="password_confirm" class="admin-form-input" placeholder="Repita la nueva contraseña" autocomplete="new-password">
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('adminEditConfirmPassword', this)" title="Ver / Ocultar">
                    <i class="far fa-eye"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="admin-modal-footer" style="padding: 16px 0 0 0; margin-top: 16px;">
              <button type="button" class="btn-admin-outline" onclick="openAdminProfileModal('view')">Cancelar</button>
              <button type="submit" class="btn-admin-primary" id="btnAdminSave">
                <i class="fas fa-save"></i> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Evento para previsualizar foto y eliminar foto de administrador
  const fileInput = document.getElementById('adminPhotoFile');
  const previewImg = document.getElementById('adminEditPhotoPreview');
  const deleteAdminPhotoBtn = document.getElementById('adminDeletePhotoBtn');
  const elimAdminFoto = document.getElementById('adminEliminarFoto');

  if (fileInput && previewImg) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          previewImg.src = evt.target.result;
        };
        reader.readAsDataURL(file);
        if (deleteAdminPhotoBtn) deleteAdminPhotoBtn.style.display = 'flex';
        if (elimAdminFoto) elimAdminFoto.value = '0';
      }
    });
  }

  if (deleteAdminPhotoBtn) {
    deleteAdminPhotoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showConfirmDialog({
        title: '¿Eliminar Foto de Administrador?',
        message: '¿Está seguro de que desea eliminar su foto de perfil y restablecer la imagen por defecto? Debe presionar "Guardar Cambios" para confirmar.',
        confirmText: 'Sí, Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => {
          if (previewImg) previewImg.src = '/uploads/admin/default-admin.png';
          if (fileInput) fileInput.value = '';
          if (elimAdminFoto) elimAdminFoto.value = '1';
          deleteAdminPhotoBtn.style.display = 'none';
          showToast('Foto removida. Presione "Guardar Cambios" para aplicar.', 'info');
        }
      });
    });
  }

  // Evento submit de edición
  const form = document.getElementById('adminProfileEditForm');
  if (form) {
    form.addEventListener('submit', handleAdminProfileSave);
  }
}

function openAdminProfileModal(mode = 'view') {
  const modal = document.getElementById('adminProfileModalBackdrop');
  if (!modal) return;

  const viewModeEl = document.getElementById('adminViewMode');
  const editModeEl = document.getElementById('adminProfileEditForm');
  const titleEl = document.getElementById('adminModalMainTitle');

  const p = currentAdminProfile || {
    nombre: 'Administrador',
    titulo: 'Administrador',
    usuario: 'admin',
    email: 'admin@gmail.com',
    foto: '/uploads/admin/default-admin.png'
  };

  if (mode === 'view') {
    titleEl.textContent = 'Perfil de Administrador';
    viewModeEl.style.display = 'flex';
    editModeEl.style.display = 'none';

    document.getElementById('adminDetailAvatar').src = p.foto;
    document.getElementById('adminDetailNombre').textContent = p.nombre;
    document.getElementById('adminDetailRolBadge').textContent = p.titulo || p.rol || 'Administrador';
    document.getElementById('adminDetailUsuario').textContent = `@${p.usuario}`;
    document.getElementById('adminDetailEmail').textContent = p.email;
  } else {
    titleEl.textContent = 'Editar Perfil de Administrador';
    viewModeEl.style.display = 'none';
    editModeEl.style.display = 'block';

    document.getElementById('adminEditPhotoPreview').src = p.foto;
    const hasAdminPhoto = p.foto && !p.foto.includes('default-admin');
    const deleteAdminPhotoBtn = document.getElementById('adminDeletePhotoBtn');
    const elimAdminFoto = document.getElementById('adminEliminarFoto');
    if (elimAdminFoto) elimAdminFoto.value = '0';
    if (deleteAdminPhotoBtn) deleteAdminPhotoBtn.style.display = hasAdminPhoto ? 'flex' : 'none';

    document.getElementById('adminEditTitulo').value = p.titulo || p.rol || 'Administrador';
    document.getElementById('adminEditNombre').value = p.nombre || '';
    document.getElementById('adminEditUsuario').value = p.usuario || '';
    document.getElementById('adminEditEmail').value = p.email || '';
    document.getElementById('adminEditPassword').value = '';
    document.getElementById('adminEditConfirmPassword').value = '';
  }

  modal.classList.add('show');
}

function closeAdminProfileModal() {
  const modal = document.getElementById('adminProfileModalBackdrop');
  if (modal) modal.classList.remove('show');
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = isPass ? 'far fa-eye-slash' : 'far fa-eye';
  }
}

async function handleAdminProfileSave(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('btnAdminSave');

  const pass = document.getElementById('adminEditPassword').value.trim();
  const passConfirm = document.getElementById('adminEditConfirmPassword').value.trim();

  if (pass !== '' && pass !== passConfirm) {
    showToast('Las contraseñas no coinciden. Por favor verifique.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

  const formData = new FormData(form);

  try {
    const res = await fetch('/api/admin/profile', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      currentAdminProfile = {
        ...currentAdminProfile,
        ...data.user,
        titulo: data.user.rol
      };
      updateAdminCapsuleUI(currentAdminProfile);
      showToast('Perfil de administrador actualizado con éxito.', 'success');
      openAdminProfileModal('view');
    } else {
      showToast(data.message || 'Error al actualizar el perfil.', 'error');
    }
  } catch (err) {
    console.error('Error al guardar perfil de administrador:', err);
    showToast('Error de conexión con el servidor.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
  }
}

// 4. FECHA Y RELOJ EN VIVO (FORMATO VENEZUELA)
function initDateAndClock() {
  const dateElements = document.querySelectorAll('.current-date');
  const clockElement = document.getElementById('liveClock');

  function update() {
    const now = new Date();
    
    // Formatear Fecha: Ej: "Sábado, 24 de Octubre de 2026"
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const diaSemana = dias[now.getDay()];
    const diaMes = now.getDate();
    const mes = meses[now.getMonth()];
    const anio = now.getFullYear();
    const fechaTexto = `${diaSemana}, ${diaMes} de ${mes} de ${anio}`;

    dateElements.forEach(el => {
      el.textContent = fechaTexto;
    });

    if (clockElement) {
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strH = hours < 10 ? '0' + hours : hours;
      const strM = minutes < 10 ? '0' + minutes : minutes;
      clockElement.textContent = `${strH}:${strM} ${ampm}`;
    }
  }

  update();
  setInterval(update, 1000);
}

// 3. PERFIL DE ADMINISTRADOR Y EDICIÓN DE FOTO
function initAdminProfile() {
  const adminCard = document.querySelector('.admin-profile-card');
  const avatarImg = document.querySelector('.admin-avatar');
  const roleNameEl = document.querySelector('.admin-role-name');
  const emailEl = document.querySelector('.admin-email');

  // Cargar datos actuales desde el backend
  fetch('/api/admin/profile')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.profile) {
        if (avatarImg) avatarImg.src = data.profile.foto;
        if (roleNameEl) roleNameEl.textContent = data.profile.nombre;
        if (emailEl) emailEl.textContent = data.profile.email;
      }
    })
    .catch(() => {});

  if (adminCard) {
    adminCard.addEventListener('click', openAdminModal);
  }

  // Inyectar modal si no existe
  if (!document.getElementById('adminModalBackdrop')) {
    const modalHtml = `
      <div id="adminModalBackdrop" class="modal-backdrop">
        <div class="modal-card" style="max-width: 450px;">
          <div class="modal-header">
            <h3 class="modal-title">Perfil de Administrador</h3>
            <button class="modal-close-btn" onclick="closeAdminModal()">&times;</button>
          </div>
          <form id="adminProfileForm" enctype="multipart/form-data">
            <div class="modal-body" style="text-align: center;">
              <div style="position: relative; width: 110px; height: 110px; margin: 0 auto 16px;">
                <img id="adminModalPreview" src="/uploads/admin/default-admin.png" alt="Admin" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary-color);">
                <label for="adminPhotoInput" style="position: absolute; bottom: 0; right: 0; background: var(--primary-color); color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                  <i class="fas fa-camera"></i>
                </label>
                <input type="file" id="adminPhotoInput" name="foto" accept="image/*" style="display: none;">
              </div>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 18px;">Haga clic en la cámara para cambiar la foto de administrador</p>
              
              <div class="form-group" style="text-align: left; margin-bottom: 14px;">
                <label class="form-label">Nombre de Administrador</label>
                <input type="text" id="adminNameInput" name="nombre" class="form-control" value="Administrador" required>
              </div>

              <div class="form-group" style="text-align: left;">
                <label class="form-label">Correo Electrónico</label>
                <input type="email" id="adminEmailInput" name="email" class="form-control" value="admin@gmail.com" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" onclick="closeAdminModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="saveAdminBtn">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Eventos del formulario modal
    const photoInput = document.getElementById('adminPhotoInput');
    const previewImg = document.getElementById('adminModalPreview');
    const profileForm = document.getElementById('adminProfileForm');

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('saveAdminBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      const formData = new FormData(profileForm);

      try {
        const res = await fetch('/api/admin/profile', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          showToast('Foto y perfil actualizados exitosamente.', 'success');
          if (avatarImg) avatarImg.src = data.user.foto;
          if (roleNameEl) roleNameEl.textContent = data.user.nombre;
          if (emailEl) emailEl.textContent = data.user.email;
          closeAdminModal();
        } else {
          showToast(data.message || 'Error al actualizar', 'error');
        }
      } catch (err) {
        showToast('Error de conexión con el servidor', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Cambios';
      }
    });
  }
}

function openAdminModal() {
  const modal = document.getElementById('adminModalBackdrop');
  const avatarImg = document.querySelector('.admin-avatar');
  const roleNameEl = document.querySelector('.admin-role-name');
  const emailEl = document.querySelector('.admin-email');
  const previewImg = document.getElementById('adminModalPreview');
  const nameInput = document.getElementById('adminNameInput');
  const emailInput = document.getElementById('adminEmailInput');

  if (avatarImg && previewImg) previewImg.src = avatarImg.src;
  if (roleNameEl && nameInput) nameInput.value = roleNameEl.textContent;
  if (emailEl && emailInput) emailInput.value = emailEl.textContent;

  if (modal) modal.classList.add('show');
}

function closeAdminModal() {
  const modal = document.getElementById('adminModalBackdrop');
  if (modal) modal.classList.remove('show');
}

// 4. DROPDOWN DE EXPORTACIÓN (OPCIONES PDF Y EXCEL)
function initExportDropdowns() {
  document.addEventListener('click', (e) => {
    const isExportBtn = e.target.closest('.btn-export-trigger');
    const allDropdowns = document.querySelectorAll('.export-dropdown');

    if (isExportBtn) {
      e.stopPropagation();
      const dropdown = isExportBtn.parentElement.querySelector('.export-dropdown');
      allDropdowns.forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
      });
      if (dropdown) dropdown.classList.toggle('show');
    } else if (!e.target.closest('.export-container')) {
      allDropdowns.forEach(d => d.classList.remove('show'));
    }
  });
}

// 5. FUNCIONES DE EXPORTACIÓN A PDF Y EXCEL CON MEMBRETE Y ESCUDO OFICIAL
let _escudoBase64Cache = null;

async function getEscudoBase64() {
  if (_escudoBase64Cache) return _escudoBase64Cache;
  try {
    const res = await fetch('/assets/escudo.png');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _escudoBase64Cache = reader.result;
        resolve(_escudoBase64Cache);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('No se pudo cargar el escudo institucional:', err);
    return null;
  }
}

// Iniciar precarga del escudo al cargar la página
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    getEscudoBase64().catch(() => {});
  });
}

/**
 * membrete oficial institucional (escrito en texto) y el escudo 
 * identificador del reporte y metadatos.
 */
async function applyPdfHeader(doc, { title, subtitleLines = [] }) {
  const pageWidth = doc.internal.pageSize.width;

  // 1. Escudo a la izquierda en la parte superior
  const escudo = await getEscudoBase64();
  if (escudo) {
    try {
      doc.addImage(escudo, 'PNG', 14, 8, 18, 18);
    } catch (e) {
      console.warn('Aviso: no se pudo incrustar el escudo en el PDF:', e);
    }
  }

  // 2. Membrete Institucional Oficial (Centrado horizontalmente, texto formal)
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('República Bolivariana De Venezuela', pageWidth / 2, 9.5, { align: 'center' });
  doc.text('Ministerio Del Poder Popular Para La Educación', pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(8.5);
  doc.text('Centro De Educación Inicial Simón Diaz', pageWidth / 2, 16.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Municipio Sucre - Parroquia Valmore Rodrigues', pageWidth / 2, 20.3, { align: 'center' });
  doc.text('Estado Trujillo', pageWidth / 2, 23.8, { align: 'center' });

  // 3. Línea divisoria 
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.setLineWidth(0.35);
  doc.line(14, 27.5, pageWidth - 14, 27.5);

  // 4. Identificador del Documento y Metadatos debajo del membrete
  let currentY = 33.5;
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(1, 32, 96); // Azul institucional #012060
    doc.text(title, 14, currentY);
    currentY += 4.8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  for (const line of subtitleLines) {
    doc.text(line, 14, currentY);
    currentY += 4.2;
  }

  return currentY + 2.5;
}

function buildExcelInstitutionalData(title, subtitleLines, headers, rows) {
  return [
    ['República Bolivariana De Venezuela'],
    ['Ministerio Del Poder Popular Para La Educación'],
    ['Centro De Educación Inicial Simón Diaz'],
    ['Municipio Sucre - Parroquia Valmore Rodrigues'],
    ['Estado Trujillo'],
    [],
    [title.toUpperCase()],
    ...subtitleLines.map(line => [line]),
    [],
    headers,
    ...rows
  ];
}

async function exportData(format, options) {
  const { title, headers, rows, filename = 'reporte', dateText, subtitleLines = [] } = options;
  const lines = subtitleLines.length > 0
    ? subtitleLines
    : [dateText || `Fecha de Emisión: ${new Date().toLocaleDateString('es-VE')}`];

  if (format === 'excel') {
    if (typeof XLSX === 'undefined') {
      showToast('Cargando librería Excel...', 'info');
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    return runExcelExport(title, headers, rows, filename, lines);
  } else if (format === 'pdf') {
    if (typeof jspdf === 'undefined' || typeof window.jspdf === 'undefined') {
      showToast('Cargando librería PDF...', 'info');
      await new Promise((resolve) => {
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script1.onload = () => {
          const script2 = document.createElement('script');
          script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
          script2.onload = resolve;
          document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
      });
    }
    return await runPdfExport(title, headers, rows, filename, lines);
  }
}

function runExcelExport(title, headers, rows, filename, subtitleLines) {
  const data = buildExcelInstitutionalData(title, subtitleLines, headers, rows);
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`);
  showToast('Archivo Excel descargado con éxito.', 'success');
}

async function runPdfExport(title, headers, rows, filename, subtitleLines) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: rows[0] && rows[0].length > 5 ? 'landscape' : 'portrait' });

  const startY = await applyPdfHeader(doc, { title, subtitleLines });

  doc.autoTable({
    startY: startY,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [1, 32, 96],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`${filename}_${Date.now()}.pdf`);
  showToast('Archivo PDF generado con éxito.', 'success');
}

// 6. CERRAR SESIÓN
function initLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          window.location.href = '/';
        }
      } catch (err) {
        window.location.href = '/';
      }
    });
  }
}

// 7. TOAST NOTIFICACIONES
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fas fa-info-circle';
  if (type === 'success') iconClass = 'fas fa-check-circle';
  if (type === 'error') iconClass = 'fas fa-exclamation-circle';
  if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';

  toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// MODAL DE CONFIRMACIÓN UNIVERSAL
function showConfirmDialog({
  title = '¿Está seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Sí, Eliminar',
  cancelText = 'Cancelar',
  onConfirm
}) {
  let modal = document.getElementById('globalConfirmModalBackdrop');
  if (!modal) {
    const html = `
      <div id="globalConfirmModalBackdrop" class="global-confirm-backdrop">
        <div class="modal-warning-card">
          <div class="warning-icon-wrap">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="warning-title" id="globalConfirmTitle">¿Está seguro?</h3>
          <p class="warning-text" id="globalConfirmText">Esta acción no se puede deshacer.</p>
          <div class="warning-actions">
            <button type="button" id="globalConfirmBtnCancel" class="btn-modal-cancel">Cancelar</button>
            <button type="button" id="globalConfirmBtnOk" class="btn-modal-confirm-delete">Sí, Eliminar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    modal = document.getElementById('globalConfirmModalBackdrop');
  }

  document.getElementById('globalConfirmTitle').textContent = title;
  document.getElementById('globalConfirmText').innerHTML = message;
  const btnOk = document.getElementById('globalConfirmBtnOk');
  const btnCancel = document.getElementById('globalConfirmBtnCancel');
  btnOk.textContent = confirmText;
  btnCancel.textContent = cancelText;

  modal.classList.add('show');
  modal.style.display = 'flex';

  function closeDialog() {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }

  btnCancel.onclick = closeDialog;
  btnOk.onclick = () => {
    closeDialog();
    if (typeof onConfirm === 'function') onConfirm();
  };
}

// 8. INTERACCIÓN UNIVERSAL: APERTURA DE SELECTORES Y CALENDARIOS
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    // Al clickear la flecha o cualquier parte de la píldora select, enfocar y abrir
    const pill = e.target.closest('.filter-pill-select, .filter-select-wrapper, .form-select-wrapper');
    if (pill) {
      const sel = pill.querySelector('select');
      if (sel && e.target !== sel) {
        sel.focus();
        if (typeof sel.showPicker === 'function') {
          try { sel.showPicker(); } catch (err) {}
        }
      }
    }

    // Al clickear icono de calendario o botón, disparar showPicker()
    const calIcon = e.target.closest('.calendar-icon, .view-calendar-icon, .calendar-btn');
    if (calIcon) {
      const parent = calIcon.closest('.filter-pill-date, .date-input-wrapper, .date-input-pill-wrap, .date-box');
      if (parent) {
        const dateInput = parent.querySelector('input[type="date"]');
        if (dateInput && typeof dateInput.showPicker === 'function') {
          try { dateInput.showPicker(); } catch (err) { dateInput.focus(); }
        }
      }
    }
  });
});

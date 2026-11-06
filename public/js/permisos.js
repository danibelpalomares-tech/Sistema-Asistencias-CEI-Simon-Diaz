/* ==========================================================================
   LÓGICA DE LA PANTALLA DE PERMISOS
   C.E.I. SIMÓN DÍAZ
   ========================================================================== */

let currentPermisos = [];
let currentPage = 1;
let totalPages = 1;
let selectedDate = 'Hoy';
let allEmployees = [];
let activePermisoData = null;
let targetDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  setupCurrentDate();
  setupDatePicker();
  setupFilters();
  setupPaginationEvents();
  setupRightPanelEvents();
  setupDeleteModalEvents();
  loadEmployeesSelect();
  loadPermisos(1);
});

// Configurar fecha en el encabezado
function setupCurrentDate() {
  const dateLabel = document.getElementById('currentDateLabel');
  if (!dateLabel) return;
  const now = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const str = now.toLocaleDateString('es-VE', options);
  dateLabel.textContent = str.charAt(0).toUpperCase() + str.slice(1);
}

// Configurar selector de fecha de la barra de herramientas
function setupDatePicker() {
  const dateInput = document.getElementById('inputFechaPermiso');
  const dateLabel = document.getElementById('dateFilterLabel');
  if (!dateInput) return;

  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.value = todayStr;

  dateInput.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val || val === todayStr) {
      selectedDate = 'Hoy';
      if (dateLabel) dateLabel.textContent = 'Fecha: Hoy';
      setupCurrentDate();
    } else {
      selectedDate = val;
      const [year, month, day] = val.split('-');
      if (dateLabel) dateLabel.textContent = `Fecha: ${day}/${month}/${year}`;

      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const str = dateObj.toLocaleDateString('es-VE', options);
      const headerDate = document.getElementById('currentDateLabel');
      if (headerDate) {
        headerDate.textContent = str.charAt(0).toUpperCase() + str.slice(1);
      }
    }
    loadPermisos(1);
  });
}

// Cargar lista de empleados para el selector del formulario
async function loadEmployeesSelect() {
  try {
    const res = await fetch('/api/empleados?limit=all');
    const result = await res.json();
    if (result.success && result.data) {
      allEmployees = result.data;
      const select = document.getElementById('selectEmpleado');
      if (select) {
        select.innerHTML = '<option value="" disabled selected>Buscar Empleado...</option>' +
          allEmployees.map(emp => `
            <option value="${emp.id}">
              ${emp.nombres} ${emp.apellidos} (${emp.tipo_cedula}-${emp.cedula}) - ${emp.cargo}
            </option>
          `).join('');
      }
    }
  } catch (error) {
    console.error('Error al cargar empleados para select:', error);
  }
}

// Cargar permisos desde el servidor
async function loadPermisos(page = 1) {
  currentPage = page;
  const searchInput = document.getElementById('searchPermiso');
  const tipoSelect = document.getElementById('filterTipoPermiso');

  const search = searchInput ? searchInput.value.trim() : '';
  const tipo = tipoSelect ? tipoSelect.value : 'Todos';

  const url = `/api/permisos?search=${encodeURIComponent(search)}&tipo=${encodeURIComponent(tipo)}&fecha=${encodeURIComponent(selectedDate)}&page=${page}&limit=6`;

  try {
    const res = await fetch(url);
    const result = await res.json();

    if (result.success) {
      currentPermisos = result.data || [];
      totalPages = (result.pagination && result.pagination.totalPages) ? result.pagination.totalPages : 1;
      renderPermisosTable(currentPermisos);
      renderPagination(result.pagination);
    } else {
      showToast(result.message || 'Error al obtener permisos', 'error');
    }
  } catch (error) {
    console.error('Error al cargar permisos:', error);
    showToast('Ocurrió un error al cargar permisos', 'error');
  }
}

// Renderizar tabla con filas flotantes individuales (Exactamente 6)
function renderPermisosTable(records) {
  const container = document.getElementById('permisosListContainer');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-table-state">
        <i class="far fa-file-alt" style="font-size: 2rem; color: #94A3B8; margin-bottom: 8px;"></i>
        <span>No se encontraron registros de permisos para los criterios seleccionados.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = records.map(item => {
    const isSelected = activePermisoData && activePermisoData.id === item.id;
    const avatarHtml = `<img src="${item.foto || '/public/assets/default-avatar.png'}" alt="${item.nombreCompleto}" class="permiso-avatar-img" onerror="this.src='/public/assets/default-avatar.png'">`;

    return `
      <div class="permiso-floating-row ${isSelected ? 'selected-row' : ''}" onclick="openViewPermiso(${item.id})">
        <!-- Foto / Nombre -->
        <div class="permiso-user-cell">
          ${avatarHtml}
          <span class="permiso-name-text" title="${item.nombreCompleto}">${item.nombreCompleto}</span>
        </div>

        <!-- Tipo -->
        <div class="permiso-type-cell">
          ${item.tipo}
        </div>

        <!-- Desde -->
        <div class="permiso-date-cell">
          ${item.fecha_inicio_formato || item.fecha_inicio}
        </div>

        <!-- Hasta -->
        <div class="permiso-date-cell">
          ${item.fecha_fin_formato || item.fecha_fin}
        </div>

        <!-- Acciones -->
        <div class="permiso-actions-cell" onclick="event.stopPropagation();">
          <button type="button" class="action-sq-btn" title="Ver detalles" onclick="openViewPermiso(${item.id})">
            <i class="far fa-eye"></i>
          </button>
          <button type="button" class="action-sq-btn" title="Editar permiso" onclick="openEditPermiso(${item.id})">
            <i class="far fa-edit"></i>
          </button>
          <button type="button" class="action-sq-btn btn-del" title="Eliminar permiso" onclick="openDeleteModal(${item.id}, '${item.nombreCompleto}')">
            <i class="far fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar controles de paginación
function renderPagination(pagination) {
  const prevBtn = document.getElementById('btnPagePrev');
  const nextBtn = document.getElementById('btnPageNext');
  const capsule = document.getElementById('pageNumbersCapsule');

  if (!pagination) return;
  const { page, totalPages: total } = pagination;

  if (prevBtn) prevBtn.disabled = (page <= 1);
  if (nextBtn) nextBtn.disabled = (page >= total);

  if (capsule) {
    let html = '';
    for (let i = 1; i <= total; i++) {
      html += `<span class="page-number-pill ${i === page ? 'active' : ''}" onclick="loadPermisos(${i})">${i}</span>`;
    }
    capsule.innerHTML = html;
  }
}

// Configurar eventos de paginación
function setupPaginationEvents() {
  const prevBtn = document.getElementById('btnPagePrev');
  const nextBtn = document.getElementById('btnPageNext');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        loadPermisos(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        loadPermisos(currentPage + 1);
      }
    });
  }
}

// Configurar filtros de búsqueda y tipo
function setupFilters() {
  const searchInput = document.getElementById('searchPermiso');
  const tipoSelect = document.getElementById('filterTipoPermiso');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadPermisos(1);
      }, 300);
    });
  }

  if (tipoSelect) {
    tipoSelect.addEventListener('change', () => {
      loadPermisos(1);
    });
  }
}

// ==========================================================================
// CONTROL DEL PANEL DERECHO (ESTADOS: VACÍO, FORMULARIO, CONSULTAR)
// ==========================================================================
function switchPanelState(stateName) {
  const emptyState = document.getElementById('detailEmptyState');
  const formState = document.getElementById('detailFormState');
  const viewState = document.getElementById('detailViewState');

  if (emptyState) emptyState.classList.remove('active');
  if (formState) formState.classList.remove('active');
  if (viewState) viewState.classList.remove('active');

  if (stateName === 'empty' && emptyState) emptyState.classList.add('active');
  if (stateName === 'form' && formState) formState.classList.add('active');
  if (stateName === 'view' && viewState) viewState.classList.add('active');
}

function setupRightPanelEvents() {
  const btnAdd = document.getElementById('btnAddPermisoTrigger');
  const btnCancelForm = document.getElementById('btnCancelForm');
  const btnCloseView = document.getElementById('btnCloseView');
  const btnEditView = document.getElementById('btnEditView');
  const form = document.getElementById('permisoForm');
  const fileInput = document.getElementById('fileJustificativo');

  // Botón Añadir (Barra superior)
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      openAddPermiso();
    });
  }

  // Botón Cancelar (Formulario)
  if (btnCancelForm) {
    btnCancelForm.addEventListener('click', () => {
      activePermisoData = null;
      switchPanelState('empty');
      renderPermisosTable(currentPermisos);
    });
  }

  // Botón Cerrar (Vista de detalles)
  if (btnCloseView) {
    btnCloseView.addEventListener('click', () => {
      activePermisoData = null;
      switchPanelState('empty');
      renderPermisosTable(currentPermisos);
    });
  }

  // Botón Editar dentro de la vista de detalles (Pasar de Ver a Editar en el mismo lugar)
  if (btnEditView) {
    btnEditView.addEventListener('click', () => {
      if (activePermisoData) {
        openEditPermiso(activePermisoData.id);
      }
    });
  }

  // Nombre de archivo adjunto seleccionado
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const fileNameSpan = document.getElementById('fileAttachText');
      const fileActions = document.getElementById('formFileActions');
      const elimAdj = document.getElementById('permisoEliminarAdjunto');
      const file = e.target.files[0];
      if (file) {
        if (fileNameSpan) fileNameSpan.textContent = file.name;
        if (fileActions) fileActions.style.display = 'flex';
        if (elimAdj) elimAdj.value = '0';
      } else {
        if (fileNameSpan) fileNameSpan.textContent = 'Adjuntar Archivo...';
        if (fileActions) fileActions.style.display = 'none';
      }
    });
  }

  // Botón quitar archivo en formulario con confirmación previa
  const btnFormDeleteAdj = document.getElementById('btnFormDeleteAdjunto');
  if (btnFormDeleteAdj) {
    btnFormDeleteAdj.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showConfirmDialog({
        title: '¿Eliminar Justificativo?',
        message: '¿Está seguro de que desea eliminar el archivo adjunto de este permiso? Debe presionar "Guardar Cambios" para confirmar.',
        confirmText: 'Sí, Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => {
          const fileInput = document.getElementById('fileJustificativo');
          if (fileInput) fileInput.value = '';
          const fileNameSpan = document.getElementById('fileAttachText');
          if (fileNameSpan) fileNameSpan.textContent = 'Adjuntar Archivo...';
          const fileActions = document.getElementById('formFileActions');
          if (fileActions) fileActions.style.display = 'none';
          const elimAdj = document.getElementById('permisoEliminarAdjunto');
          if (elimAdj) elimAdj.value = '1';
          showToast('Justificativo removido. Presione "Guardar Cambios" para aplicar.', 'info');
        }
      });
    });
  }

  // Envío del Formulario (Añadir o Editar)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitPermisoForm();
    });
  }
}

// Abrir panel en modo: AÑADIR
function openAddPermiso() {
  activePermisoData = null;
  const form = document.getElementById('permisoForm');
  form.reset();

  document.getElementById('permisoFormId').value = '';
  document.getElementById('permisoFormMode').value = 'add';
  document.getElementById('permisoHiddenEmpId').value = '';

  const editHeader = document.getElementById('editEmpHeader');
  const addGroup = document.getElementById('addSelectEmpGroup');
  const selectEmp = document.getElementById('selectEmpleado');
  if (editHeader) editHeader.style.display = 'none';
  if (addGroup) addGroup.style.display = 'flex';
  if (selectEmp) {
    selectEmp.required = true;
    selectEmp.value = '';
  }

  document.getElementById('btnSaveForm').textContent = 'Guardar';
  document.getElementById('fileAttachText').textContent = 'Adjuntar Archivo...';

  const fileActions = document.getElementById('formFileActions');
  if (fileActions) fileActions.style.display = 'none';
  const elimAdj = document.getElementById('permisoEliminarAdjunto');
  if (elimAdj) elimAdj.value = '0';

  // Fechas en blanco para mostrar placeholder dd/mm/aaaa según requerimiento
  document.getElementById('inputFechaDesde').value = '';
  document.getElementById('inputFechaHasta').value = '';

  switchPanelState('form');
  renderPermisosTable(currentPermisos);
}

// Abrir panel en modo: CONSULTAR / VER DETALLES
async function openViewPermiso(id) {
  try {
    let permiso = currentPermisos.find(p => p.id == id);
    if (!permiso) {
      const res = await fetch(`/api/permisos/${id}`);
      const data = await res.json();
      if (data.success && data.data) permiso = data.data;
    }

    if (!permiso) return;
    activePermisoData = permiso;

    // Rellenar datos en la vista
    document.getElementById('viewEmpNombre').textContent = permiso.nombreCompleto || 'Empleado';
    document.getElementById('viewEmpCedula').textContent = permiso.cedula || '---';
    document.getElementById('viewEmpAvatar').src = permiso.foto || '/public/assets/default-avatar.png';

    document.getElementById('viewPermisoTipo').textContent = permiso.tipo || 'Médico';
    document.getElementById('viewPermisoDesde').textContent = permiso.fecha_inicio_formato || permiso.fecha_inicio;
    document.getElementById('viewPermisoHasta').textContent = permiso.fecha_fin_formato || permiso.fecha_fin;
    document.getElementById('viewPermisoMotivo').textContent = permiso.motivo || 'Sin detalles especificados.';

    // Justificativo adjunto (solo enlace en azul para consultar)
    const adjuntoLink = document.getElementById('viewPermisoAdjuntoLink');
    if (permiso.archivo_adjunto) {
      adjuntoLink.href = permiso.archivo_adjunto;
      const fileName = permiso.archivo_adjunto.split('/').pop();
      adjuntoLink.textContent = fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName;
      adjuntoLink.style.pointerEvents = 'auto';
    } else {
      adjuntoLink.href = '#';
      adjuntoLink.textContent = 'Ninguno';
      adjuntoLink.style.pointerEvents = 'none';
    }

    switchPanelState('view');
    renderPermisosTable(currentPermisos);
  } catch (error) {
    console.error('Error al ver permiso:', error);
  }
}

// Abrir panel en modo: EDITAR (El empleado no se cambia, muestra foto, nombre y cédula fijos)
async function openEditPermiso(id) {
  try {
    let permiso = currentPermisos.find(p => p.id == id);
    if (!permiso) {
      const res = await fetch(`/api/permisos/${id}`);
      const data = await res.json();
      if (data.success && data.data) permiso = data.data;
    }

    if (!permiso) return;
    activePermisoData = permiso;

    const form = document.getElementById('permisoForm');
    form.reset();

    document.getElementById('permisoFormId').value = permiso.id;
    document.getElementById('permisoFormMode').value = 'edit';
    document.getElementById('permisoHiddenEmpId').value = permiso.id_empleado;

    // Mostrar cabecera fija del empleado con foto, nombre y cédula
    const editHeader = document.getElementById('editEmpHeader');
    const addGroup = document.getElementById('addSelectEmpGroup');
    const selectEmp = document.getElementById('selectEmpleado');
    if (editHeader) editHeader.style.display = 'flex';
    if (addGroup) addGroup.style.display = 'none';
    if (selectEmp) {
      selectEmp.required = false;
      selectEmp.value = permiso.id_empleado;
    }

    document.getElementById('editEmpNombre').textContent = permiso.nombreCompleto || 'Empleado';
    document.getElementById('editEmpCedula').textContent = permiso.cedula || '---';
    document.getElementById('editEmpAvatar').src = permiso.foto || '/public/assets/default-avatar.png';

    // Rellenar campos editables (Tipo, Fechas, Motivo, Justificativo)
    document.getElementById('selectFormTipo').value = permiso.tipo;
    document.getElementById('inputFechaDesde').value = String(permiso.fecha_inicio).split('T')[0];
    document.getElementById('inputFechaHasta').value = String(permiso.fecha_fin).split('T')[0];
    document.getElementById('textareaMotivo').value = permiso.motivo || '';

    const fileNameSpan = document.getElementById('fileAttachText');
    const fileActions = document.getElementById('formFileActions');
    const elimAdj = document.getElementById('permisoEliminarAdjunto');
    if (elimAdj) elimAdj.value = '0';

    if (permiso.archivo_adjunto) {
      const fn = permiso.archivo_adjunto.split('/').pop();
      fileNameSpan.textContent = fn.length > 25 ? fn.substring(0, 22) + '...' : fn;
      if (fileActions) fileActions.style.display = 'flex';
    } else {
      fileNameSpan.textContent = 'Adjuntar Archivo...';
      if (fileActions) fileActions.style.display = 'none';
    }

    document.getElementById('btnSaveForm').textContent = 'Guardar Cambios';

    switchPanelState('form');
    renderPermisosTable(currentPermisos);
  } catch (error) {
    console.error('Error al editar permiso:', error);
  }
}

// Guardar permiso (POST o PUT)
async function submitPermisoForm() {
  const form = document.getElementById('permisoForm');
  const mode = document.getElementById('permisoFormMode').value;
  const id = document.getElementById('permisoFormId').value;

  let idEmpleado = (mode === 'edit')
    ? (document.getElementById('permisoHiddenEmpId').value || (activePermisoData && activePermisoData.id_empleado))
    : document.getElementById('selectEmpleado').value;

  const tipo = document.getElementById('selectFormTipo').value;
  const desde = document.getElementById('inputFechaDesde').value;
  const hasta = document.getElementById('inputFechaHasta').value;

  if (!idEmpleado) {
    showToast('Seleccione un empleado', 'warning');
    return;
  }
  if (!desde || !hasta) {
    showToast('Las fechas Desde y Hasta son obligatorias', 'warning');
    return;
  }
  if (desde > hasta) {
    showToast('La fecha "Desde" no puede ser posterior a la fecha "Hasta"', 'warning');
    return;
  }

  const formData = new FormData(form);
  if (mode === 'edit') {
    formData.set('id_empleado', idEmpleado);
  }

  const url = mode === 'edit' ? `/api/permisos/${id}` : '/api/permisos';
  const method = mode === 'edit' ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      body: formData
    });

    const result = await res.json();
    if (result.success) {
      showToast(result.message || 'Permiso guardado con éxito', 'success');
      activePermisoData = null;
      switchPanelState('empty');
      loadPermisos(currentPage);
    } else {
      showToast(result.message || 'Error al procesar la solicitud', 'error');
    }
  } catch (error) {
    console.error('Error al guardar permiso:', error);
    showToast('Ocurrió un error al guardar el permiso', 'error');
  }
}

// ==========================================================================
// MODAL FLOTANTE DE CONFIRMACIÓN PARA ELIMINAR
// ==========================================================================
function setupDeleteModalEvents() {
  const backdrop = document.getElementById('deleteConfirmBackdrop');
  const cancelBtn = document.getElementById('btnCancelDelete');
  const confirmBtn = document.getElementById('btnConfirmDelete');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDeleteModal);
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDeleteModal();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!targetDeleteId) return;

      try {
        const res = await fetch(`/api/permisos/${targetDeleteId}`, {
          method: 'DELETE'
        });
        const result = await res.json();

        if (result.success) {
          showToast(result.message || 'Permiso eliminado con éxito', 'success');
          closeDeleteModal();
          if (activePermisoData && activePermisoData.id == targetDeleteId) {
            activePermisoData = null;
            switchPanelState('empty');
          }
          loadPermisos(currentPage);
        } else {
          showToast(result.message || 'Error al eliminar el permiso', 'error');
        }
      } catch (error) {
        console.error('Error al eliminar permiso:', error);
        showToast('Ocurrió un error al eliminar', 'error');
      }
    });
  }
}

function openDeleteModal(id, nombre) {
  targetDeleteId = id;
  const nameEl = document.getElementById('deleteTargetName');
  if (nameEl) nameEl.textContent = nombre || 'este empleado';
  const backdrop = document.getElementById('deleteConfirmBackdrop');
  if (backdrop) backdrop.classList.add('show');
}

function closeDeleteModal() {
  targetDeleteId = null;
  const backdrop = document.getElementById('deleteConfirmBackdrop');
  if (backdrop) backdrop.classList.remove('show');
}

/* ==========================================================================
   LÓGICA DE LA PANTALLA DE EMPLEADOS
   C.E.I. SIMÓN DÍAZ
   ========================================================================== */

let currentEmployees = [];
let currentPage = 1;
let totalPages = 1;
let currentEmployeeData = null; // Para ver / editar
let employeeToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadEmployees();
  setupToolbarEvents();
  setupModalEvents();
  setupDeleteModalEvents();
  setupExportEvents();
});

// ==========================================================================
// 1. CARGA Y FILTRADO DE EMPLEADOS
// ==========================================================================
async function loadEmployees(page = 1) {
  currentPage = page;
  const search = document.getElementById('searchEmpleado').value.trim();
  const cargo = document.getElementById('filterCargo').value;
  const estado = document.getElementById('filterEstado').value;

  // LÍMITE ESTRICTO DE 6 EMPLEADOS POR PÁGINA
  const url = `/api/empleados?search=${encodeURIComponent(search)}&cargo=${encodeURIComponent(cargo)}&estado=${encodeURIComponent(estado)}&page=${page}&limit=6`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      currentEmployees = data.data || [];
      totalPages = data.pagination?.totalPages || 1;
      renderEmployeeTable(currentEmployees);
      renderPagination(data.pagination);
    }
  } catch (error) {
    console.error('Error al cargar empleados:', error);
  }
}

// Renderizar tabla con filas flotantes individuales 
function renderEmployeeTable(employees) {
  const container = document.getElementById('empleadosListContainer');
  if (!container) return;

  if (employees.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--app-text-muted); padding: 40px 20px; font-weight: 500;">
        No se encontraron empleados registrados con los criterios seleccionados.
      </div>
    `;
    return;
  }

  container.innerHTML = employees.map(emp => {
    const avatarHtml = `<img src="${emp.foto || '/public/assets/default-avatar.png'}" alt="${emp.nombres}" class="emp-avatar-img" onerror="this.src='/public/assets/default-avatar.png'">`;

    const estadoLower = (emp.estado || 'Activo').toLowerCase();
    const estadoClass = estadoLower === 'inactivo' ? 'inactivo' : 'activo';
    const estadoTexto = estadoLower === 'inactivo' ? 'Inactivo' : 'Activo';

    return `
      <div class="employee-floating-row">
        <div class="emp-user-cell">
          ${avatarHtml}
          <span class="emp-name-text">${emp.nombres} ${emp.apellidos}</span>
        </div>
        <div class="emp-cedula-cell">${emp.tipo_cedula}-${emp.cedula}</div>
        <div class="emp-cargo-cell">${emp.cargo}</div>
        <div class="emp-status-cell">
          <span class="badge-status-pill ${estadoClass}">${estadoTexto}</span>
        </div>
        <div class="emp-actions-cell">
          <button type="button" class="action-sq-btn" title="Ver información" onclick="openViewModal(${emp.id})">
            <i class="far fa-eye"></i>
          </button>
          <button type="button" class="action-sq-btn" title="Editar empleado" onclick="openEditModal(${emp.id})">
            <i class="far fa-edit"></i>
          </button>
          <button type="button" class="action-sq-btn btn-del" title="Eliminar empleado" onclick="openDeleteConfirmModal(${emp.id}, '${emp.nombres} ${emp.apellidos}', '${emp.tipo_cedula}-${emp.cedula}')">
            <i class="far fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar widget de paginación 
function renderPagination(pagination) {
  const prevBtn = document.getElementById('btnPagePrev');
  const nextBtn = document.getElementById('btnPageNext');
  const capsule = document.getElementById('pageNumbersCapsule');

  if (!capsule) return;

  const page = pagination?.page || 1;
  const total = pagination?.totalPages || 1;

  if (prevBtn) prevBtn.disabled = (page <= 1);
  if (nextBtn) nextBtn.disabled = (page >= total);

  let pillsHtml = '';
  for (let i = 1; i <= total; i++) {
    pillsHtml += `
      <span class="page-number-pill ${i === page ? 'active' : ''}" onclick="loadEmployees(${i})">
        ${i}
      </span>
    `;
  }

  capsule.innerHTML = pillsHtml;
}

// ==========================================================================
// 2. CONFIGURACIÓN DE FILTROS Y EVENTOS DE LA BARRA DE HERRAMIENTAS
// ==========================================================================
function setupToolbarEvents() {
  const searchInput = document.getElementById('searchEmpleado');
  const filterCargo = document.getElementById('filterCargo');
  const filterEstado = document.getElementById('filterEstado');

  let debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadEmployees(1), 300);
    });
  }

  if (filterCargo) {
    filterCargo.addEventListener('change', () => loadEmployees(1));
  }

  if (filterEstado) {
    filterEstado.addEventListener('change', () => loadEmployees(1));
  }

  // Paginación anterior / siguiente
  const prevBtn = document.getElementById('btnPagePrev');
  const nextBtn = document.getElementById('btnPageNext');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) loadEmployees(currentPage - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) loadEmployees(currentPage + 1);
    });
  }
}

// ==========================================================================
// 3. MODAL UNIFICADO (AÑADIR / VER / EDITAR) CON SPLIT PANEL
// ==========================================================================
function setupModalEvents() {
  const btnAdd = document.getElementById('btnAddEmpleado');
  const modalBackdrop = document.getElementById('employeeModalBackdrop');
  const btnSecondary = document.getElementById('modalBtnSecondary');
  const form = document.getElementById('employeeForm');

  // Pestañas del modal
  const tabBtnPersonal = document.getElementById('tabBtnPersonal');
  const tabBtnInstitucional = document.getElementById('tabBtnInstitucional');
  const tabContentPersonal = document.getElementById('tabContentPersonal');
  const tabContentInstitucional = document.getElementById('tabContentInstitucional');
  const modalRightTitle = document.getElementById('modalRightTitle');

  // Abrir modal en modo Añadir
  if (btnAdd) {
    btnAdd.addEventListener('click', () => openAddModal());
  }

  // Cerrar modal al hacer clic en Cancelar o fuera del modal
  if (btnSecondary) {
    btnSecondary.addEventListener('click', () => closeEmployeeModal());
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeEmployeeModal();
    });
  }

  // Cambio de pestañas (Personal <-> Institucional)
  if (tabBtnPersonal && tabBtnInstitucional) {
    tabBtnPersonal.addEventListener('click', () => {
      tabBtnPersonal.classList.add('active');
      tabBtnInstitucional.classList.remove('active');
      tabContentPersonal.classList.add('active');
      tabContentInstitucional.classList.remove('active');
      modalRightTitle.textContent = 'Información Personal';
    });

    tabBtnInstitucional.addEventListener('click', () => {
      tabBtnInstitucional.classList.add('active');
      tabBtnPersonal.classList.remove('active');
      tabContentInstitucional.classList.add('active');
      tabContentPersonal.classList.remove('active');
      modalRightTitle.textContent = 'Información Institucional';
    });
  }

  // Previsualización de foto al seleccionarla y botón de eliminar foto
  const photoInput = document.getElementById('modalPhotoInput');
  const avatarPreview = document.getElementById('modalAvatarPreview');
  const deletePhotoBtn = document.getElementById('modalDeletePhotoBtn');
  const elimFotoInput = document.getElementById('modalEliminarFoto');

  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && avatarPreview) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          avatarPreview.src = evt.target.result;
        };
        reader.readAsDataURL(file);
        if (deletePhotoBtn) deletePhotoBtn.style.display = 'flex';
        if (elimFotoInput) elimFotoInput.value = '0';
      }
    });
  }

  if (deletePhotoBtn) {
    deletePhotoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showConfirmDialog({
        title: '¿Eliminar Foto de Perfil?',
        message: '¿Está seguro de que desea eliminar la foto de perfil de este empleado? Debe presionar "Guardar Cambios" para confirmar.',
        confirmText: 'Sí, Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => {
          if (avatarPreview) avatarPreview.src = '/public/assets/default-avatar.png';
          if (photoInput) photoInput.value = '';
          if (elimFotoInput) elimFotoInput.value = '1';
          deletePhotoBtn.style.display = 'none';
          showToast('Foto removida. Presione "Guardar Cambios" para aplicar.', 'info');
        }
      });
    });
  }

  // Enviar formulario (Añadir o Editar)
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

// Abrir Modal en Modo: AÑADIR
function openAddModal() {
  const form = document.getElementById('employeeForm');
  form.reset();
  document.getElementById('empFormId').value = '';
  document.getElementById('empFormMode').value = 'add';

  // Configurar elementos del panel izquierdo
  document.getElementById('modalLeftName').textContent = 'Nombre';
  document.getElementById('modalCameraBtn').style.display = 'flex';
  document.getElementById('modalAvatarPreview').src = '/public/assets/default-avatar.png';
  const addDeleteBtn = document.getElementById('modalDeletePhotoBtn');
  if (addDeleteBtn) addDeleteBtn.style.display = 'none';
  const addElimFoto = document.getElementById('modalEliminarFoto');
  if (addElimFoto) addElimFoto.value = '0';
  const addPhotoInput = document.getElementById('modalPhotoInput');
  if (addPhotoInput) addPhotoInput.value = '';
  document.getElementById('modalSectionLabel').textContent = 'Sección Añadir Empleado';

  // Limpiar campos de fecha explícitamente para mostrar placeholder dd/mm/aaaa
  document.getElementById('inputNacimiento').value = '';
  document.getElementById('inputFechaIngreso').value = '';

  // Configurar campos (Cédula habilitada y editable)
  setFormInputsReadOnly(false);
  document.getElementById('selectTipoCedula').disabled = false;
  document.getElementById('selectTipoCedula').classList.remove('is-readonly');
  document.getElementById('inputCedula').readOnly = false;
  document.getElementById('inputCedula').classList.remove('is-readonly');

  // Botones de acción
  document.getElementById('modalBtnSecondary').textContent = 'Cancelar';
  const primaryBtn = document.getElementById('modalBtnPrimary');
  primaryBtn.textContent = 'Registrar';
  primaryBtn.style.display = 'block';
  primaryBtn.type = 'button';
  primaryBtn.onclick = (e) => {
    e.preventDefault();
    submitEmployeeForm();
  };

  // Activar pestaña inicial
  switchModalTab('personal');
  document.getElementById('employeeModalBackdrop').classList.add('show');
}

// Abrir Modal en Modo: VER INFORMACIÓN
async function openViewModal(id) {
  try {
    let emp = (currentEmployees && currentEmployees.find(e => e.id == id));
    if (!emp) {
      if (id == 2) {
        emp = {
          id: 2,
          tipo_cedula: 'V',
          cedula: '27889799',
          nombres: 'Miguel Ángel',
          apellidos: 'Ramírez López',
          genero: 'Masculino',
          fecha_nacimiento: '2001-10-29',
          telefono: '04247438437',
          email: 'miguelrlopez@gmail.com',
          direccion: 'jihrghrui...',
          cargo: 'Administrativo',
          estado: 'Activo',
          nivel_academico: 'Bachiller',
          fecha_ingreso: '2023-12-01',
          foto: null
        };
      } else {
        const res = await fetch(`/api/empleados/${id}`);
        const data = await res.json();
        if (data.success && data.data) emp = data.data;
      }
    }
    if (!emp) return;

    currentEmployeeData = emp;
    fillModalData(currentEmployeeData);

    document.getElementById('empFormId').value = emp.id;
    document.getElementById('empFormMode').value = 'view';
    document.getElementById('modalCameraBtn').style.display = 'none';
    const viewDeleteBtn = document.getElementById('modalDeletePhotoBtn');
    if (viewDeleteBtn) viewDeleteBtn.style.display = 'none';
    document.getElementById('modalSectionLabel').textContent = 'Sección Ver Información del Empleado';

    // Todos los campos bloqueados en solo lectura
    setFormInputsReadOnly(true);

    // Botones: "Cerrar" y "Editar"
    document.getElementById('modalBtnSecondary').textContent = 'Cerrar';
    const primaryBtn = document.getElementById('modalBtnPrimary');
    primaryBtn.textContent = 'Editar';
    primaryBtn.style.display = 'block';
    primaryBtn.type = 'button';
    primaryBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Conmuta directamente a edición en la misma ventana para editar al instante
      switchToEditMode(id);
    };

    switchModalTab('personal');
    document.getElementById('employeeModalBackdrop').classList.add('show');
  } catch (error) {
    console.error('Error al ver empleado:', error);
  }
}

// Conmutar a modo EDITAR dentro del mismo modal o desde la tabla
function switchToEditMode(id) {
  let emp = (currentEmployeeData && currentEmployeeData.id == id)
    ? currentEmployeeData
    : (currentEmployees && currentEmployees.find(e => e.id == id));

  if (!emp && id == 2) {
    emp = {
      id: 2,
      tipo_cedula: 'V',
      cedula: '27889799',
      nombres: 'Miguel Ángel',
      apellidos: 'Ramírez López',
      genero: 'Masculino',
      fecha_nacimiento: '2001-10-29',
      telefono: '04247438437',
      email: 'miguelrlopez@gmail.com',
      direccion: 'jihrghrui...',
      cargo: 'Administrativo',
      estado: 'Activo',
      nivel_academico: 'Bachiller',
      fecha_ingreso: '2023-12-01',
      foto: null
    };
  }

  if (!emp) return;
  currentEmployeeData = emp;

  document.getElementById('empFormId').value = emp.id;
  document.getElementById('empFormMode').value = 'edit';
  document.getElementById('modalCameraBtn').style.display = 'flex';
  const editDeleteBtn = document.getElementById('modalDeletePhotoBtn');
  const editElimFoto = document.getElementById('modalEliminarFoto');
  if (editElimFoto) editElimFoto.value = '0';
  const hasRealPhoto = emp.foto && !emp.foto.includes('default-avatar');
  if (editDeleteBtn) editDeleteBtn.style.display = hasRealPhoto ? 'flex' : 'none';
  document.getElementById('modalSectionLabel').textContent = 'Sección Editar Empleado';

  // Habilitar todos los campos para edición inmediata
  setFormInputsReadOnly(false);

  // REQUISITO ESTRICTO: En modo editar la CI NO es editable
  document.getElementById('selectTipoCedula').disabled = true;
  document.getElementById('selectTipoCedula').classList.add('is-readonly');
  document.getElementById('inputCedula').readOnly = true;
  document.getElementById('inputCedula').classList.add('is-readonly');

  // Actualizar botones inferiores
  const secondaryBtn = document.getElementById('modalBtnSecondary');
  secondaryBtn.textContent = 'Cancelar';
  secondaryBtn.onclick = () => closeEmployeeModal();

  const primaryBtn = document.getElementById('modalBtnPrimary');
  primaryBtn.textContent = 'Guardar Cambios';
  primaryBtn.style.display = 'block';
  primaryBtn.type = 'button';
  primaryBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    submitEmployeeForm();
  };

  // Asegurar que el modal esté visible y en foco
  document.getElementById('employeeModalBackdrop').classList.add('show');
  showToast('Modo edición activado. Puede modificar la información y presionar Guardar Cambios.', 'info');
}

// Abrir Modal en Modo: EDITAR directamente desde el botón de la fila
async function openEditModal(id) {
  try {
    let emp = (currentEmployees && currentEmployees.find(e => e.id == id));
    if (!emp) {
      const res = await fetch(`/api/empleados/${id}`);
      const data = await res.json();
      if (data.success && data.data) emp = data.data;
    }
    if (!emp) return;

    currentEmployeeData = emp;
    fillModalData(emp);
    switchToEditMode(emp.id);
    switchModalTab('personal');
    document.getElementById('employeeModalBackdrop').classList.add('show');
  } catch (error) {
    console.error('Error al abrir modal editar:', error);
  }
}

// Llenar datos del empleado en los campos del formulario
function toInputDateFormat(val) {
  if (!val) return '';
  return String(val).split('T')[0].split(' ')[0];
}

function fillModalData(emp) {
  document.getElementById('empFormId').value = emp.id;
  document.getElementById('modalLeftName').textContent = `${emp.nombres} ${emp.apellidos}`;
  document.getElementById('modalAvatarPreview').src = emp.foto || '/public/assets/default-avatar.png';

  document.getElementById('inputNombres').value = emp.nombres || '';
  document.getElementById('inputApellidos').value = emp.apellidos || '';
  document.getElementById('selectTipoCedula').value = emp.tipo_cedula || 'V';
  document.getElementById('inputCedula').value = emp.cedula || '';
  document.getElementById('selectGenero').value = emp.genero || 'Femenino';
  document.getElementById('inputNacimiento').value = toInputDateFormat(emp.fecha_nacimiento);
  document.getElementById('inputTelefono').value = emp.telefono || '';
  document.getElementById('inputEmail').value = emp.email || '';
  document.getElementById('inputDireccion').value = emp.direccion || '';

  // Información Institucional (SOLO 3 CARGOS)
  document.getElementById('selectCargo').value = emp.cargo || 'Docente';
  document.getElementById('selectEstado').value = emp.estado || 'Activo';
  document.getElementById('inputNivelAcademico').value = emp.nivel_academico || 'Bachiller';
  document.getElementById('inputFechaIngreso').value = toInputDateFormat(emp.fecha_ingreso);
}

// Activar o desactivar campos en solo lectura
function setFormInputsReadOnly(isReadOnly) {
  const inputs = document.querySelectorAll('#employeeForm input, #employeeForm select, #employeeForm textarea');
  inputs.forEach(input => {
    if (input.id === 'empFormId' || input.id === 'empFormMode') return;
    if (input.tagName === 'SELECT' || input.type === 'date') {
      input.disabled = isReadOnly;
    } else {
      input.readOnly = isReadOnly;
    }
    if (isReadOnly) {
      input.classList.add('is-readonly');
    } else {
      input.classList.remove('is-readonly');
    }
  });
}

// Alternar entre pestañas del modal
function switchModalTab(tabName) {
  const tabBtnPersonal = document.getElementById('tabBtnPersonal');
  const tabBtnInstitucional = document.getElementById('tabBtnInstitucional');
  const tabContentPersonal = document.getElementById('tabContentPersonal');
  const tabContentInstitucional = document.getElementById('tabContentInstitucional');
  const modalRightTitle = document.getElementById('modalRightTitle');

  if (tabName === 'personal') {
    tabBtnPersonal.classList.add('active');
    tabBtnInstitucional.classList.remove('active');
    tabContentPersonal.classList.add('active');
    tabContentInstitucional.classList.remove('active');
    modalRightTitle.textContent = 'Información Personal';
  } else {
    tabBtnInstitucional.classList.add('active');
    tabBtnPersonal.classList.remove('active');
    tabContentInstitucional.classList.add('active');
    tabContentPersonal.classList.remove('active');
    modalRightTitle.textContent = 'Información Institucional';
  }
}

function closeEmployeeModal() {
  document.getElementById('employeeModalBackdrop').classList.remove('show');
}

// Guardar empleado (Añadir o Editar)
async function submitEmployeeForm() {
  const form = document.getElementById('employeeForm');
  const mode = document.getElementById('empFormMode').value;
  const id = document.getElementById('empFormId').value;

  const nombres = document.getElementById('inputNombres').value.trim();
  const apellidos = document.getElementById('inputApellidos').value.trim();
  const cargo = document.getElementById('selectCargo').value;

  if (!nombres || !apellidos) {
    showToast('Los campos Nombres y Apellidos son obligatorios', 'warning');
    switchModalTab('personal');
    return;
  }

  const formData = new FormData(form);

  // Asegurar tipo_cedula y cedula si estaban bloqueados
  if (mode === 'edit') {
    formData.set('tipo_cedula', document.getElementById('selectTipoCedula').value);
    formData.set('cedula', document.getElementById('inputCedula').value);
  }

  const url = mode === 'edit' ? `/api/empleados/${id}` : '/api/empleados';
  const method = mode === 'edit' ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      body: formData
    });

    const result = await res.json();
    if (result.success) {
      showToast(result.message || 'Empleado guardado exitosamente', 'success');
      closeEmployeeModal();
      loadEmployees(currentPage);
    } else {
      showToast(result.message || 'Error al procesar la solicitud', 'error');
    }
  } catch (error) {
    console.error('Error en submit de empleado:', error);
    showToast('Ocurrió un error al guardar el empleado', 'error');
  }
}

// Manejar registro o edición desde evento submit nativo
async function handleFormSubmit(e) {
  e.preventDefault();
  submitEmployeeForm();
}

// ==========================================================================
// 4. MODAL FLOTANTE DE ADVERTENCIA PARA ELIMINAR
// ==========================================================================
function setupDeleteModalEvents() {
  const backdrop = document.getElementById('deleteConfirmBackdrop');
  const btnCancel = document.getElementById('btnCancelDelete');
  const btnConfirm = document.getElementById('btnConfirmDelete');

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      backdrop.classList.remove('show');
      employeeToDeleteId = null;
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('show');
        employeeToDeleteId = null;
      }
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener('click', async () => {
      if (!employeeToDeleteId) return;

      try {
        const res = await fetch(`/api/empleados/${employeeToDeleteId}`, {
          method: 'DELETE'
        });
        const result = await res.json();

        if (result.success) {
          showToast('Empleado eliminado exitosamente', 'success');
          backdrop.classList.remove('show');
          employeeToDeleteId = null;
          loadEmployees(currentPage);
        } else {
          showToast(result.message || 'Error al eliminar', 'error');
        }
      } catch (error) {
        console.error('Error al eliminar empleado:', error);
        showToast('Error de comunicación con el servidor', 'error');
      }
    });
  }
}

// Abrir modal flotante de confirmación de eliminación en el centro
function openDeleteConfirmModal(id, nombre, cedula) {
  employeeToDeleteId = id;
  const nameEl = document.getElementById('deleteEmpName');
  const cedulaEl = document.getElementById('deleteEmpCedula');

  if (nameEl) nameEl.textContent = nombre;
  if (cedulaEl) cedulaEl.textContent = cedula;

  document.getElementById('deleteConfirmBackdrop').classList.add('show');
}

// ==========================================================================
// 5. EXPORTACIÓN COMPLETA A PDF Y EXCEL (TODOS LOS REGISTROS Y CAMPOS)
// ==========================================================================
function setupExportEvents() {
  const triggerBtn = document.getElementById('btnExportarTrigger');
  const exportMenu = document.getElementById('exportMenu');
  const btnPDF = document.getElementById('btnExportPDF');
  const btnExcel = document.getElementById('btnExportExcel');

  if (triggerBtn && exportMenu) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!exportMenu.contains(e.target) && e.target !== triggerBtn) {
        exportMenu.classList.remove('show');
      }
    });
  }

  if (btnPDF) {
    btnPDF.addEventListener('click', () => {
      exportMenu.classList.remove('show');
      exportAllEmployeesToPDF();
    });
  }

  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      exportMenu.classList.remove('show');
      exportAllEmployeesToExcel();
    });
  }
}

// Formateador de fechas al estándar DD/MM/YYYY
function formatDateDMY(val) {
  if (!val) return '';
  const str = String(val).split('T')[0].split(' ')[0];
  const parts = str.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

// Obtener los empleados respetando los filtros activos (búsqueda, cargo y estado)
async function fetchAllEmployeesData() {
  const searchInput = document.getElementById('searchEmpleado');
  const cargoSelect = document.getElementById('filterCargo');
  const estadoSelect = document.getElementById('filterEstado');

  const search = searchInput ? searchInput.value.trim() : '';
  const cargo = cargoSelect ? cargoSelect.value : 'Todos';
  const estado = estadoSelect ? estadoSelect.value : 'Todos';

  const url = `/api/empleados?search=${encodeURIComponent(search)}&cargo=${encodeURIComponent(cargo)}&estado=${encodeURIComponent(estado)}&limit=all`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.success && json.data) {
    return json.data;
  }
  return [];
}

// EXPORTAR A EXCEL (.xlsx) CON MEMBRETE INSTITUCIONAL
async function exportAllEmployeesToExcel() {
  showToast('Generando archivo Excel con los empleados filtrados...', 'info');

  try {
    const allEmployees = await fetchAllEmployeesData();
    if (allEmployees.length === 0) {
      showToast('No hay empleados para exportar con los filtros seleccionados', 'warning');
      return;
    }

    const today = new Date().toLocaleDateString('es-VE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const headers = [
      'Cédula de Identidad', 'Nombres', 'Apellidos', 'Género', 'Fecha de Nacimiento',
      'Teléfono', 'Correo Electrónico', 'Dirección', 'Cargo', 'Estado',
      'Nivel Académico', 'Fecha de Ingreso'
    ];

    const rows = allEmployees.map(emp => [
      `${emp.tipo_cedula || 'V'}-${emp.cedula}`,
      emp.nombres || '',
      emp.apellidos || '',
      emp.genero || '',
      formatDateDMY(emp.fecha_nacimiento),
      emp.telefono || '',
      emp.email || '',
      emp.direccion || '',
      emp.cargo || '',
      emp.estado || '',
      emp.nivel_academico || '',
      formatDateDMY(emp.fecha_ingreso)
    ]);

    const subtitleLines = [
      `Fecha de emisión: ${today}  |  Total registros: ${allEmployees.length}`
    ];

    const data = (typeof buildExcelInstitutionalData === 'function')
      ? buildExcelInstitutionalData('LISTADO DE EMPLEADOS', subtitleLines, headers, rows)
      : [
          ['República Bolivariana De Venezuela'],
          ['Ministerio Del Poder Popular Para La Educación'],
          ['Centro De Educación Inicial Simón Diaz'],
          ['Municipio Sucre - Parroquia Valmore Rodrigues'],
          ['Estado Trujillo'],
          [],
          ['LISTADO DE EMPLEADOS'],
          [`Fecha de emisión: ${today}  |  Total registros: ${allEmployees.length}`],
          [],
          headers,
          ...rows
        ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados');

    // Ajustar ancho de columnas automáticamente
    const colWidths = [
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
      { wch: 20 }, { wch: 16 }, { wch: 26 }, { wch: 30 },
      { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 16 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'C.E.I._Simon_Diaz_Listado_Empleados.xlsx');
    showToast('Archivo Excel descargado exitosamente', 'success');
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    showToast('Error al exportar a Excel', 'error');
  }
}

// EXPORTAR A PDF (.pdf) CON AUTO-TABLE HORIZONTAL, ESCUDO Y MEMBRETE
async function exportAllEmployeesToPDF() {
  showToast('Generando documento PDF...', 'info');

  try {
    const allEmployees = await fetchAllEmployeesData();
    if (allEmployees.length === 0) {
      showToast('No hay empleados para exportar con los filtros seleccionados', 'warning');
      return;
    }

    const { jsPDF } = window.jspdf;
    // Formato horizontal (landscape) para que quepan todas las columnas con claridad
    const doc = new jsPDF('landscape');

    const today = new Date().toLocaleDateString('es-VE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const startY = (typeof applyPdfHeader === 'function')
      ? await applyPdfHeader(doc, {
          title: 'LISTADO DE EMPLEADOS',
          subtitleLines: [
            `Fecha de emisión: ${today}  |  Total registros: ${allEmployees.length}`
          ]
        })
      : 34;

    // TABLA CON TODOS LOS CAMPOS INCLUYENDO FECHA DE NACIMIENTO
    const tableHeaders = [
      ['Cédula', 'Nombres', 'Apellidos', 'Género', 'F. Nacimiento', 'Teléfono', 'Email', 'Cargo', 'Estado', 'Nivel Académico', 'F. Ingreso']
    ];

    const tableRows = allEmployees.map(emp => [
      `${emp.tipo_cedula || 'V'}-${emp.cedula}`,
      emp.nombres || '',
      emp.apellidos || '',
      emp.genero || '',
      formatDateDMY(emp.fecha_nacimiento),
      emp.telefono || '',
      emp.email || '',
      emp.cargo || '',
      emp.estado || '',
      emp.nivel_academico || '',
      formatDateDMY(emp.fecha_ingreso)
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: startY,
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
      margin: { left: 10, right: 10 }
    });

    doc.save('C.E.I._Simon_Diaz_Listado_Empleados.pdf');
    showToast('Archivo PDF descargado exitosamente', 'success');
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    showToast('Error al exportar a PDF', 'error');
  }
}
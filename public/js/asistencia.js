/* ==========================================================================
   LÓGICA DE LA PANTALLA DE ASISTENCIA
   C.E.I. SIMÓN DÍAZ
   ========================================================================== */

let currentAttendance = [];
let currentPage = 1;
let totalPages = 1;
let selectedDate = 'Hoy'; // 'Hoy' o fecha 'YYYY-MM-DD'

document.addEventListener('DOMContentLoaded', () => {
  setupCurrentDate();
  setupDatePicker();
  setupFilters();
  setupPaginationEvents();
  setupExport();
  loadAttendance(1);
});

// Configurar fecha en el encabezado
function setupCurrentDate() {
  const dateLabel = document.getElementById('currentDateLabel');
  if (!dateLabel) return;
  const now = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const str = now.toLocaleDateString('es-VE', options);
  // Capitalizar primera letra: "Sábado, 24 de Octubre de 2026"
  dateLabel.textContent = str.charAt(0).toUpperCase() + str.slice(1);
}

// Configurar selector de fecha / calendario
function setupDatePicker() {
  const dateInput = document.getElementById('inputFechaAsistencia');
  const dateLabel = document.getElementById('dateFilterLabel');
  if (!dateInput) return;

  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.max = todayStr; // Solo hoy o días anteriores
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

      // Actualizar subtítulo en header con la fecha seleccionada
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const str = dateObj.toLocaleDateString('es-VE', options);
      const headerDate = document.getElementById('currentDateLabel');
      if (headerDate) {
        headerDate.textContent = str.charAt(0).toUpperCase() + str.slice(1);
      }
    }
    loadAttendance(1);
  });
}

// Cargar asistencias desde el servidor
async function loadAttendance(page = 1) {
  currentPage = page;
  const searchInput = document.getElementById('searchAsistencia');
  const estadoSelect = document.getElementById('filterEstadoAsistencia');

  const search = searchInput ? searchInput.value.trim() : '';
  const estado = estadoSelect ? estadoSelect.value : 'Presentes';

  const url = `/api/asistencia?search=${encodeURIComponent(search)}&estado=${encodeURIComponent(estado)}&fecha=${encodeURIComponent(selectedDate)}&page=${page}&limit=6`;

  try {
    const res = await fetch(url);
    const result = await res.json();

    if (result.success) {
      currentAttendance = result.data || [];
      totalPages = (result.pagination && result.pagination.totalPages) ? result.pagination.totalPages : 1;
      renderAttendanceTable(currentAttendance);
      renderPagination(result.pagination);
    } else {
      showToast(result.message || 'Error al obtener asistencias', 'error');
    }
  } catch (error) {
    console.error('Error al cargar lista de asistencia:', error);
    showToast('Ocurrió un error al cargar la asistencia', 'error');
  }
}

// Renderizar tabla con filas flotantes individuales (Exactamente 6)
function renderAttendanceTable(records) {
  const container = document.getElementById('asistenciaListContainer');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-table-state">
        <i class="far fa-calendar-times" style="font-size: 2rem; color: #94A3B8; margin-bottom: 8px;"></i>
        <span>No se encontraron registros de asistencia para los criterios seleccionados.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = records.map(item => {
    let dotClass = 'dot-absent';
    let dotTitle = 'Ausente';

    if (item.estado === 'Presente') {
      dotClass = 'dot-present';
      dotTitle = 'Presente';
    } else if (item.estado === 'Permiso') {
      dotClass = 'dot-permiso';
      dotTitle = item.tipo_permiso ? `De Permiso (${item.tipo_permiso})` : 'De Permiso';
    }

    const avatarHtml = `<img src="${item.foto || '/public/assets/default-avatar.png'}" alt="${item.nombreCompleto}" class="asistencia-avatar-img" onerror="this.src='/public/assets/default-avatar.png'">`;

    return `
      <div class="asistencia-floating-row">
        <!-- Foto / Nombre -->
        <div class="asistencia-user-cell">
          ${avatarHtml}
          <span class="asistencia-name-text" title="${item.nombreCompleto}">${item.nombreCompleto}</span>
        </div>

        <!-- Cédula de Identidad -->
        <div class="asistencia-cedula-cell">
          ${item.cedula}
        </div>

        <!-- Hora de Entrada -->
        <div class="asistencia-time-cell">
          ${item.hora_entrada}
        </div>

        <!-- Hora de Salida -->
        <div class="asistencia-time-cell">
          ${item.hora_salida}
        </div>

        <!-- Estado (Punto Verde para Presente / Rojo para Ausente / Amarillo para Permiso) -->
        <div class="asistencia-status-cell">
          <span class="attendance-dot ${dotClass}" title="${dotTitle}"></span>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar controles de paginación inferiores
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
      html += `<span class="page-number-pill ${i === page ? 'active' : ''}" onclick="loadAttendance(${i})">${i}</span>`;
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
        loadAttendance(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        loadAttendance(currentPage + 1);
      }
    });
  }
}

// Configurar filtros de búsqueda y estado
function setupFilters() {
  const searchInput = document.getElementById('searchAsistencia');
  const estadoSelect = document.getElementById('filterEstadoAsistencia');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadAttendance(1);
      }, 300);
    });
  }

  if (estadoSelect) {
    estadoSelect.addEventListener('change', () => {
      loadAttendance(1);
    });
  }
}

// Configurar botón y menú de exportación
function setupExport() {
  const trigger = document.getElementById('btnExportarTrigger');
  const menu = document.getElementById('exportMenu');
  const btnPDF = document.getElementById('btnExportPDF');
  const btnExcel = document.getElementById('btnExportExcel');

  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== trigger) {
        menu.classList.remove('show');
      }
    });
  }

  // Exportar a PDF
  if (btnPDF) {
    btnPDF.addEventListener('click', async () => {
      menu.classList.remove('show');
      await executeAttendanceExport('pdf');
    });
  }

  // Exportar a Excel
  if (btnExcel) {
    btnExcel.addEventListener('click', async () => {
      menu.classList.remove('show');
      await executeAttendanceExport('excel');
    });
  }
}

// Ejecutar exportación con todas las páginas y agregando la columna CARGO requerida
async function executeAttendanceExport(format) {
  const searchInput = document.getElementById('searchAsistencia');
  const estadoSelect = document.getElementById('filterEstadoAsistencia');
  const search = searchInput ? searchInput.value.trim() : '';
  const estado = estadoSelect ? estadoSelect.value : 'Presentes';

  showToast('Preparando datos para la exportación...', 'info');

  try {
    // Solicitar la totalidad de registros con limit=all
    const url = `/api/asistencia?search=${encodeURIComponent(search)}&estado=${encodeURIComponent(estado)}&fecha=${encodeURIComponent(selectedDate)}&limit=all`;
    const res = await fetch(url);
    const result = await res.json();

    if (!result.success || !result.data || result.data.length === 0) {
      showToast('No hay datos para exportar con los filtros seleccionados', 'warning');
      return;
    }

    const allData = result.data;

    // Formatear columnas: La Cédula de Identidad en primer lugar como estándar unificado
    const headers = [
      'Cédula de Identidad',
      'Nombres',
      'Apellidos',
      'Cargo',
      'Hora de Entrada',
      'Hora de Salida',
      'Estado'
    ];

    const rows = allData.map(item => {
      let cedulaFmt = item.cedula || '';
      if (cedulaFmt && !cedulaFmt.startsWith('V-') && !cedulaFmt.startsWith('E-')) {
        cedulaFmt = `V-${cedulaFmt}`;
      }
      return [
        cedulaFmt,
        item.nombres || item.nombreCompleto || '',
        item.apellidos || '',
        item.cargo || 'Docente',
        item.hora_entrada,
        item.hora_salida,
        item.estado
      ];
    });

    function formatToDDMMYYYY(val) {
      if (!val || val === 'Hoy') return new Date().toLocaleDateString('es-VE');
      const parts = String(val).split('T')[0].split(' ')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return val;
    }

    const fechaFmt = formatToDDMMYYYY(selectedDate);
    const todayStr = new Date().toLocaleDateString('es-VE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    await exportData(format, {
      title: 'Control Diario de Asistencias',
      subtitleLines: [
        `Fecha de Registro: ${fechaFmt}`,
        `Fecha de Emisión: ${todayStr}  |  Total registros: ${allData.length}`
      ],
      dateText: `Fecha: ${fechaFmt}`,
      headers: headers,
      rows: rows,
      filename: `control_diario_asistencia_${fechaFmt.replace(/[\/\-]/g, '_')}`
    });
  } catch (error) {
    console.error('Error al exportar datos de asistencia:', error);
    showToast('Ocurrió un error al generar la exportación', 'error');
  }
}

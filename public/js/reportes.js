/* ==========================================================================
   LÓGICA DE LA PANTALLA DE REPORTES - C.E.I. SIMÓN DÍAZ
   ========================================================================== */

let reportChart = null;
let currentReportData = null;
let allEmployees = [];
let selectedEmployee = null;
let reportMode = 'general'; // 'general' | 'individual'
let hasGeneratedReport = false; // Estado inicial en cero hasta pulsar "Generar Reporte"

// Paginación en cliente 
let currentPage = 1;
const itemsPerPage = 3;
let currentDataset = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupCurrentDateHeader();
  setupDatePickers();
  await loadEmployeesList();
  setupFilterControls();
  setupExportDropdown();
  setupAdminProfileModal();

  // Estado inicial: TODO EN CERO y vacío
  renderInitialZeroState();
});

// 1. Fecha formateada en la cabecera
function setupCurrentDateHeader() {
  const headerDateDisplay = document.getElementById('headerDateDisplay');
  if (headerDateDisplay) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = today.toLocaleDateString('es-ES', options);
    headerDateDisplay.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }
}

// 2. Selectores de fecha con calendario funcional
function setupDatePickers() {
  const btnCalInicio = document.getElementById('btnCalInicio');
  const btnCalFin = document.getElementById('btnCalFin');
  const nativeInicio = document.getElementById('inputFechaInicioNative');
  const nativeFin = document.getElementById('inputFechaFinNative');
  const displayInicio = document.getElementById('inputFechaInicioDisplay');
  const displayFin = document.getElementById('inputFechaFinDisplay');

  function openPicker(input) {
    try {
      if (input.showPicker) {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch (e) {
      input.focus();
    }
  }

  if (btnCalInicio) btnCalInicio.addEventListener('click', () => openPicker(nativeInicio));
  if (displayInicio) displayInicio.addEventListener('click', () => openPicker(nativeInicio));

  if (btnCalFin) btnCalFin.addEventListener('click', () => openPicker(nativeFin));
  if (displayFin) displayFin.addEventListener('click', () => openPicker(nativeFin));

  if (nativeInicio) {
    nativeInicio.addEventListener('change', () => {
      displayInicio.value = formatDateToDDMMYYYY(nativeInicio.value);
      if (hasGeneratedReport) updateTotalDiasEvaluados();
    });
  }

  if (nativeFin) {
    nativeFin.addEventListener('change', () => {
      displayFin.value = formatDateToDDMMYYYY(nativeFin.value);
      if (hasGeneratedReport) updateTotalDiasEvaluados();
    });
  }
}

function formatDateToDDMMYYYY(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoStr;
}

function calculateDiffDays(startVal, endVal) {
  if (!startVal || !endVal) return 0;
  const d1 = new Date(startVal + 'T00:00:00');
  const d2 = new Date(endVal + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)) + 1);
}

function updateTotalDiasEvaluados() {
  const startVal = document.getElementById('inputFechaInicioNative').value;
  const endVal = document.getElementById('inputFechaFinNative').value;
  const diffDays = calculateDiffDays(startVal, endVal);
  const kpiElem = document.getElementById('kpiTotalDias');
  if (kpiElem) {
    kpiElem.textContent = diffDays;
  }
}

// 3. Cargar empleados para la búsqueda / selector individual
async function loadEmployeesList() {
  try {
    const res = await fetch('/api/empleados?limit=100');
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allEmployees = data.data;
      if (allEmployees.length > 0) {
        selectedEmployee = allEmployees[0];
      }
    }
  } catch (err) {
    console.error('Error al cargar empleados:', err);
  }
}

// 4. Configurar controles de filtro
function setupFilterControls() {
  const tipoSelect = document.getElementById('filterTipoReporte');
  const inputEmp = document.getElementById('inputEmpleado');
  const selectCargo = document.getElementById('filterCargo');
  const selectEstado = document.getElementById('filterEstado');
  const btnGenerar = document.getElementById('btnGenerarReporte');
  const empWrapper = document.getElementById('empInputWrapper');

  // Menú desplegable flotante de empleados
  const dropdownList = document.createElement('div');
  dropdownList.className = 'emp-select-dropdown';
  dropdownList.style.display = 'none';
  empWrapper.appendChild(dropdownList);

  function renderEmployeeDropdownItems(items = allEmployees) {
    if (items.length === 0) {
      dropdownList.innerHTML = `<div style="padding: 10px 12px; color: #64748B; font-size: 0.85rem;">No se encontraron empleados</div>`;
      return;
    }
    dropdownList.innerHTML = items.map(emp => `
      <div class="export-item" style="cursor: pointer; padding: 8px 12px;" data-id="${emp.id}">
        <strong>${emp.nombres} ${emp.apellidos}</strong>
        <span style="font-size: 0.75rem; color: #64748B; margin-left: auto;">${emp.cargo}</span>
      </div>
    `).join('');

    dropdownList.querySelectorAll('.export-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const chosen = allEmployees.find(e => e.id == id);
        if (chosen) {
          selectedEmployee = chosen;
          inputEmp.value = `${chosen.nombres} ${chosen.apellidos}`;

          // Requisito: Cargo y Estado se colocan automáticamente según la información del empleado
          selectCargo.value = chosen.cargo || 'Todos';
          selectEstado.value = (chosen.estado === 'Activo' || chosen.estado === 'Activos') ? 'Activos' : 'Inactivos';

          dropdownList.style.display = 'none';
        }
      });
    });
  }

  // Búsqueda en tiempo real al escribir en el campo empleado
  inputEmp.addEventListener('input', () => {
    if (tipoSelect.value === 'individual') {
      const term = inputEmp.value.trim().toLowerCase();
      const filtered = allEmployees.filter(e => 
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(term) ||
        (e.cedula && String(e.cedula).includes(term))
      );
      renderEmployeeDropdownItems(filtered);
      dropdownList.style.display = 'block';
    }
  });

  // Cambio entre Consolidado General e Individual
  tipoSelect.addEventListener('change', () => {
    const selectedMode = tipoSelect.value;

    if (selectedMode === 'general') {
      inputEmp.disabled = true;
      inputEmp.value = '';
      inputEmp.placeholder = 'Buscar Empleado...';
      dropdownList.style.display = 'none';
    } else {
      inputEmp.disabled = false;
      renderEmployeeDropdownItems();

      if (!selectedEmployee && allEmployees.length > 0) {
        selectedEmployee = allEmployees[0];
      }
      if (selectedEmployee) {
        inputEmp.value = `${selectedEmployee.nombres} ${selectedEmployee.apellidos}`;
        selectCargo.value = selectedEmployee.cargo || 'Todos';
        selectEstado.value = (selectedEmployee.estado === 'Activo' || selectedEmployee.estado === 'Activos') ? 'Activos' : 'Inactivos';
      }
    }
  });

  inputEmp.addEventListener('click', (e) => {
    if (tipoSelect.value === 'individual') {
      e.stopPropagation();
      renderEmployeeDropdownItems();
      dropdownList.style.display = dropdownList.style.display === 'none' ? 'block' : 'none';
    }
  });

  document.addEventListener('click', (e) => {
    if (!empWrapper.contains(e.target)) {
      dropdownList.style.display = 'none';
    }
  });

  btnGenerar.addEventListener('click', () => {
    const startVal = document.getElementById('inputFechaInicioNative').value;
    const endVal = document.getElementById('inputFechaFinNative').value;
    const startDisp = document.getElementById('inputFechaInicioDisplay').value;
    const endDisp = document.getElementById('inputFechaFinDisplay').value;

    if (!startVal || !endVal || !startDisp.trim() || !endDisp.trim()) {
      showToast('Debe seleccionar la Fecha de Inicio y la Fecha de fin para generar el reporte.', 'warning');
      return;
    }

    reportMode = tipoSelect.value;
    hasGeneratedReport = true;
    currentPage = 1;
    generateReport();
  });
}

// 5. Estado Inicial en CERO (Todo en cero hasta presionar Generar Reporte)
function renderInitialZeroState() {
  document.getElementById('kpiTotalDias').textContent = '0';
  document.getElementById('kpiFaltas').textContent = '0';
  document.getElementById('kpiPermisos').textContent = '0';
  document.getElementById('kpiPorcentaje').textContent = '0%';
  const kpiInactivos = document.getElementById('kpiInactivos');
  if (kpiInactivos) kpiInactivos.textContent = '0';

  document.getElementById('chartBadgePct').textContent = '0%';
  document.getElementById('chartCenterNum').textContent = '0';
  document.getElementById('chartCenterSub').textContent = reportMode === 'individual' ? 'Días' : 'Registros';

  renderTableHeaders(reportMode);

  const rowsContainer = document.getElementById('reporteRowsContainer');
  if (rowsContainer) {
    rowsContainer.innerHTML = `
      <div class="reporte-empty-state" id="reporteEmptyState">
        <i class="fas fa-chart-pie empty-icon"></i>
        <p class="empty-title">Sin reporte generado</p>
        <p class="empty-desc">Seleccione los criterios de búsqueda y haga clic en «Generar Reporte» para visualizar las estadísticas y registros.</p>
      </div>
    `;
  }

  const paginationFooter = document.getElementById('reportePaginationFooter');
  if (paginationFooter) {
    paginationFooter.style.display = 'none';
  }

  // Gráfica de dona vacía (anillo neutro en gris/azul oscuro)
  const ctx = document.getElementById('reportChartCanvas');
  if (ctx) {
    if (reportChart) reportChart.destroy();
    const isDark = document.body.classList.contains('dark-mode');
    reportChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sin Datos'],
        datasets: [{
          data: [100],
          backgroundColor: [isDark ? '#334155' : '#E2E8F0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }
}

// 6. Consultar reporte a la API y renderizar con datos reales
async function generateReport() {
  const tipo = document.getElementById('filterTipoReporte').value;
  const fechaInicio = document.getElementById('inputFechaInicioNative').value;
  const fechaFin = document.getElementById('inputFechaFinNative').value;
  const cargo = document.getElementById('filterCargo').value;
  const estado = document.getElementById('filterEstado').value;

  if (!fechaInicio || !fechaFin) {
    showToast('Debe seleccionar la Fecha de Inicio y la Fecha de fin para generar el reporte.', 'warning');
    return;
  }

  let empIdParam = '';
  if (tipo === 'individual') {
    if (!selectedEmployee && inputEmp.value.trim() && allEmployees.length > 0) {
      const term = inputEmp.value.trim().toLowerCase();
      selectedEmployee = allEmployees.find(e => 
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(term) ||
        (e.cedula && String(e.cedula).includes(term))
      );
    }
    if (!selectedEmployee && allEmployees.length > 0) {
      selectedEmployee = allEmployees[0];
    }
    empIdParam = `&id_empleado=${selectedEmployee ? selectedEmployee.id : ''}`;
  }

  const url = `/api/reportes?tipo=${tipo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&cargo=${encodeURIComponent(cargo)}&estado=${encodeURIComponent(estado)}${empIdParam}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      currentReportData = data;
      reportMode = data.tipo;

      // Calcular días hábiles/evaluados exactos entre fechas
      const diffDays = calculateDiffDays(fechaInicio, fechaFin);

      renderKPIs(data.kpi, diffDays);
      renderChart(data.chartData, data.tipo, diffDays);

      if (data.tipo === 'individual') {
        currentDataset = data.registros || [];
      } else {
        currentDataset = data.filas || [];
      }

      renderTableHeaders(data.tipo);
      renderTableRows();
      renderPagination();

      const paginationFooter = document.getElementById('reportePaginationFooter');
      if (paginationFooter) {
        paginationFooter.style.display = 'flex';
      }
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
  }
}

// 7. Renderizar KPIs superiores con datos reales
function renderKPIs(kpi, diffDays) {
  if (!kpi) return;
  document.getElementById('kpiTotalDias').textContent = diffDays !== undefined ? diffDays : (kpi.totalDiasEvaluados || 0);
  document.getElementById('kpiFaltas').textContent = kpi.faltasInjustificadas !== undefined ? kpi.faltasInjustificadas : 0;
  document.getElementById('kpiPermisos').textContent = kpi.permisosAprobados !== undefined ? kpi.permisosAprobados : 0;
  document.getElementById('kpiPorcentaje').textContent = `${kpi.porcentajeAsistencia !== undefined ? kpi.porcentajeAsistencia : 0}%`;
  const kpiInactivos = document.getElementById('kpiInactivos');
  if (kpiInactivos) {
    kpiInactivos.textContent = kpi.personalInactivo !== undefined ? kpi.personalInactivo : 0;
  }
}

// 8. Renderizar Donut Chart (Chart.js) activo con datos reales
function renderChart(chartData, tipo, diffDays) {
  const ctx = document.getElementById('reportChartCanvas');
  if (!ctx) return;

  const isDark = document.body.classList.contains('dark-mode');
  const pct = (currentReportData && currentReportData.kpi && currentReportData.kpi.porcentajeAsistencia !== undefined) 
    ? currentReportData.kpi.porcentajeAsistencia 
    : 0;
  const badgePct = document.getElementById('chartBadgePct');
  if (badgePct) badgePct.textContent = `${pct}%`;

  const centerNum = document.getElementById('chartCenterNum');
  const centerSub = document.getElementById('chartCenterSub');

  const totalReg = (chartData && chartData.totalRegistros !== undefined) ? chartData.totalRegistros : 0;
  if (centerNum) centerNum.textContent = totalReg;
  if (centerSub) centerSub.textContent = 'Registros';

  if (reportChart) {
    reportChart.destroy();
  }

  const asistencias = chartData ? (chartData.asistencias || 0) : 0;
  const faltas = chartData ? (chartData.faltas || 0) : 0;
  const permisos = chartData ? (chartData.permisos || 0) : 0;
  const inactivos = chartData ? (chartData.inactivos || 0) : 0;

  let labels = ['Asistencias', 'Faltas', 'Permisos', 'Inactivos'];
  let dataValues = [asistencias, faltas, permisos, inactivos];
  let bgColors = ['#00A859', '#D32F2F', '#F59E0B', '#94A3B8'];

  if (totalReg === 0) {
    labels = ['Sin Datos'];
    dataValues = [1];
    bgColors = [isDark ? '#334155' : '#E2E8F0'];
  }

  reportChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: bgColors,
        borderWidth: 0,
        hoverOffset: totalReg > 0 ? 3 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: totalReg > 0,
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.raw}`;
            }
          }
        }
      }
    }
  });
}

// 9. Renderizar Encabezados de la Tabla
function renderTableHeaders(tipo) {
  const headersContainer = document.getElementById('reporteTableHeaders');
  if (!headersContainer) return;

  if (tipo === 'individual') {
    headersContainer.className = 'reporte-table-headers headers-individual';
    headersContainer.innerHTML = `
      <span>Fecha</span>
      <span>Día</span>
      <span>Hora de Entrada</span>
      <span>Hora de Salida</span>
      <span>Horas Cumplidas</span>
      <span>Estado/Observación</span>
    `;
  } else {
    headersContainer.className = 'reporte-table-headers headers-general';
    headersContainer.innerHTML = `
      <span>Cédula</span>
      <span>Nombre</span>
      <span>Cargo</span>
      <span>Días Asistidos</span>
      <span>Faltas Injustificadas</span>
      <span>Permisos Aprobados</span>
      <span>Horas Totales</span>
    `;
  }
}

// 10. Renderizar Filas Flotantes
function renderTableRows() {
  const rowsContainer = document.getElementById('reporteRowsContainer');
  if (!rowsContainer) return;

  if (!hasGeneratedReport || currentDataset.length === 0) {
    rowsContainer.innerHTML = `
      <div class="reporte-empty-state" id="reporteEmptyState">
        <i class="fas fa-chart-pie empty-icon"></i>
        <p class="empty-title">Sin reporte generado</p>
        <p class="empty-desc">Seleccione los criterios de búsqueda y haga clic en «Generar Reporte» para visualizar las estadísticas y registros.</p>
      </div>
    `;
    return;
  }

  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageRows = currentDataset.slice(startIdx, startIdx + itemsPerPage);

  if (reportMode === 'individual') {
    rowsContainer.innerHTML = pageRows.map(row => {
      let badgeClass = 'rep-badge-asistio';
      if (row.estado_observacion.includes('Falta')) badgeClass = 'rep-badge-falta';
      else if (row.estado_observacion.includes('Permiso')) badgeClass = 'rep-badge-permiso';
      else if (row.estado_observacion.includes('Inactivo')) badgeClass = 'rep-badge-inactivo';

      return `
        <div class="reporte-floating-row row-individual">
          <span class="cell-text cell-bold">${row.fecha}</span>
          <span class="cell-text cell-bold">${row.dia}</span>
          <span class="cell-text cell-center">${row.hora_entrada}</span>
          <span class="cell-text cell-center">${row.hora_salida}</span>
          <span class="cell-text cell-center">${row.horas_cumplidas}</span>
          <span class="cell-text cell-center ${badgeClass}">${row.estado_observacion}</span>
        </div>
      `;
    }).join('');
  } else {
    rowsContainer.innerHTML = pageRows.map(row => {
      const faltasDisplay = (row.faltas_injustificadas === 'Inactivo' || row.isInactivo)
        ? `<span class="rep-badge-inactivo">Inactivo</span>`
        : row.faltas_injustificadas;

      return `
        <div class="reporte-floating-row row-general">
          <span class="cell-text cell-bold">${row.cedula}</span>
          <span class="cell-text cell-bold" title="${row.nombre}">${row.nombre}</span>
          <span class="cell-text">${row.cargo}</span>
          <span class="cell-text cell-center">${row.dias_asistidos}</span>
          <span class="cell-text cell-center">${faltasDisplay}</span>
          <span class="cell-text cell-center">${row.permisos_aprobados}</span>
          <span class="cell-text cell-right">${row.horas_totales}</span>
        </div>
      `;
    }).join('');
  }
}

// 11. Renderizar Paginación
function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(currentDataset.length / itemsPerPage));
  const pageNumbersList = document.getElementById('pageNumbersList');
  const btnPrev = document.getElementById('btnPagePrev');
  const btnNext = document.getElementById('btnPageNext');

  btnPrev.disabled = (currentPage === 1);
  btnNext.disabled = (currentPage === totalPages);

  btnPrev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTableRows();
      renderPagination();
    }
  };

  btnNext.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTableRows();
      renderPagination();
    }
  };

  let pillsHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    pillsHtml += `
      <button type="button" class="page-pill ${i === currentPage ? 'active' : ''}" data-page="${i}">
        ${i}
      </button>
    `;
  }

  pageNumbersList.innerHTML = pillsHtml;

  pageNumbersList.querySelectorAll('.page-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const p = parseInt(pill.getAttribute('data-page'), 10);
      if (p <= totalPages) {
        currentPage = p;
        renderTableRows();
        renderPagination();
      }
    });
  });
}

// 12. Menú y Exportación (PDF y Excel) con Fechas de Inicio y Fin explícitas
function setupExportDropdown() {
  const btnExportTrigger = document.getElementById('btnExportarTrigger');
  const exportDropdown = document.getElementById('exportMenuDropdown');
  const btnPdf = document.getElementById('btnExportPdf');
  const btnExcel = document.getElementById('btnExportExcel');

  btnExportTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!hasGeneratedReport) {
      if (typeof showToast === 'function') {
        showToast('Primero debe generar un reporte antes de exportar los datos.', 'info');
      } else {
        alert('Primero debe generar un reporte antes de exportar los datos.');
      }
      return;
    }
    exportDropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!exportDropdown.contains(e.target)) {
      exportDropdown.classList.remove('show');
    }
  });

  btnPdf.addEventListener('click', () => {
    exportDropdown.classList.remove('show');
    exportCurrentData('pdf');
  });

  btnExcel.addEventListener('click', () => {
    exportDropdown.classList.remove('show');
    exportCurrentData('excel');
  });
}

async function exportCurrentData(format) {
  if (!hasGeneratedReport || !currentDataset || currentDataset.length === 0) {
    if (typeof showToast === 'function') {
      showToast('Primero debe generar un reporte antes de exportar los datos.', 'error');
    } else {
      alert('Primero debe generar un reporte antes de exportar los datos.');
    }
    return;
  }

  const fechaInicioDisplay = document.getElementById('inputFechaInicioDisplay').value || '01/11/2026';
  const fechaFinDisplay = document.getElementById('inputFechaFinDisplay').value || '22/11/2026';
  const fechaEmision = new Date().toLocaleDateString('es-VE');

  let title = 'Reporte Consolidado General de Asistencia';
  let subtitleLines = [];
  let headers = [];
  let rows = [];

  if (reportMode === 'individual') {
    const empName = selectedEmployee ? `${selectedEmployee.nombres} ${selectedEmployee.apellidos}` : 'Empleado';
    const empCed = selectedEmployee ? `${selectedEmployee.tipo_cedula || 'V'}-${selectedEmployee.cedula}` : '---';
    const empCargo = selectedEmployee ? (selectedEmployee.cargo || 'Docente') : 'Docente';

    title = 'Reporte Individual de Asistencia';
    subtitleLines = [
      `Empleado: ${empName}  |  Cédula: ${empCed}  |  Cargo: ${empCargo}`,
      `Período Evaluado: Desde ${fechaInicioDisplay} Hasta ${fechaFinDisplay}`,
      `Fecha de Emisión: ${fechaEmision}`
    ];
    headers = ['Fecha', 'Día', 'Hora Entrada', 'Hora Salida', 'Horas Cumplidas', 'Estado/Observación'];
    rows = currentDataset.map(r => [
      r.fecha, r.dia, r.hora_entrada, r.hora_salida, r.horas_cumplidas, r.estado_observacion
    ]);
  } else {
    title = 'Reporte Consolidado General de Asistencia';
    subtitleLines = [
      `Período Evaluado: Desde ${fechaInicioDisplay} Hasta ${fechaFinDisplay}`,
      `Fecha de Emisión: ${fechaEmision}  |  Total registros: ${currentDataset.length}`
    ];
    headers = ['Cédula', 'Nombre', 'Cargo', 'Días Asistidos', 'Faltas Injustificadas', 'Permisos Aprobados', 'Horas Totales'];
    rows = currentDataset.map(r => [
      r.cedula, r.nombre, r.cargo, r.dias_asistidos, r.faltas_injustificadas, r.permisos_aprobados, r.horas_totales
    ]);
  }

  if (format === 'pdf') {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      // Cabecera institucional con escudo y membrete oficial
      const startY = (typeof applyPdfHeader === 'function')
        ? await applyPdfHeader(doc, { title, subtitleLines })
        : 36;

      // Tabla de datos con líneas divisorias completas (theme: 'grid')
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: [1, 32, 96],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center'
        },
        styles: {
          fontSize: 8,
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

      doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      if (typeof showToast === 'function') showToast('Reporte PDF descargado correctamente.', 'success');
    } catch (e) {
      console.error('Error al generar PDF:', e);
      window.print();
    }
  } else if (format === 'excel') {
    try {
      const wb = XLSX.utils.book_new();
      const wsData = (typeof buildExcelInstitutionalData === 'function')
        ? buildExcelInstitutionalData(title, subtitleLines, headers, rows)
        : [
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

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
      XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
      if (typeof showToast === 'function') showToast('Reporte Excel descargado correctamente.', 'success');
    } catch (e) {
      console.error('Error al generar Excel:', e);
    }
  }
}

// 13. Modal de edición de perfil de administrador
function setupAdminProfileModal() {
  const trigger = document.getElementById('adminProfileTrigger');
  const modal = document.getElementById('adminProfileModal');
  const btnClose = document.getElementById('btnCloseAdminModal');
  const btnCancel = document.getElementById('btnCancelAdminModal');
  const btnSave = document.getElementById('btnSaveAdminProfile');
  const photoInput = document.getElementById('inputAdminPhotoFile');
  const avatarPreview = document.getElementById('modalAdminAvatarPreview');
  const headerAvatar = document.getElementById('headerAdminAvatar');

  if (!trigger || !modal) return;

  trigger.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  const closeModal = () => { modal.style.display = 'none'; };
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (avatarPreview) avatarPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      if (avatarPreview && headerAvatar) {
        headerAvatar.src = avatarPreview.src;
      }
      closeModal();
      if (typeof showToast === 'function') showToast('Perfil actualizado correctamente.', 'success');
    });
  }
}

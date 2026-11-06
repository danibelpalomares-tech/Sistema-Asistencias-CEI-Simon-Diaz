/* ==========================================================================
   LÓGICA DE LA PANTALLA DE INICIO (DASHBOARD)
   C.E.I. SIMÓN DÍAZ
   ========================================================================== */

let dailyChart = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  loadRegisteredEmployeeAvatars();
  setupQuickRegister();
});

// 1. Cargar avatares de empleados registrados para el Módulo de Registro

async function loadRegisteredEmployeeAvatars() {
  const container = document.getElementById('moduloAvatarsRow');
  if (!container) return;

  try {
    const res = await fetch('/api/empleados?limit=100');
    const data = await res.json();

    const empleados = (data && data.success && Array.isArray(data.data)) 
      ? data.data 
      : (Array.isArray(data.empleados) ? data.empleados : []);

    if (empleados.length === 0) {
      container.innerHTML = '';
      return;
    }

    const maxShow = 5;
    const displayList = empleados.slice(0, maxShow);
    let html = displayList.map(emp => {
      const fotoSrc = emp.foto || '/public/assets/default-avatar.png';
      return `<img src="${fotoSrc}" alt="${emp.nombres || 'Empleado'}" class="modulo-avatar-circle" title="${emp.nombres} ${emp.apellidos || ''}" onerror="this.onerror=null; this.src='/public/assets/default-avatar.png';">`;
    }).join('');

    if (empleados.length > maxShow) {
      html += '<span class="modulo-dots">...</span>';
    }

    container.innerHTML = html;
  } catch (error) {
    console.warn('Error al cargar avatares de empleados en inicio:', error);
    container.innerHTML = '';
  }
}

// 2. Cargar resumen del dashboard y últimos registros
async function loadDashboardData() {
  try {
    const res = await fetch('/api/asistencia/dashboard-summary');
    const data = await res.json();

    // Actualizar también los avatares por si se registraron nuevos empleados
    loadRegisteredEmployeeAvatars();

    if (data.success && data.summary) {
      renderDailyChart(data.summary);
      renderFloatingRows(data.summary.ultimosRegistros);
    } else {
      renderDailyChart({ totalActivos: 0, presentes: 0, ausentes: 0, permisos: 0, porcentaje: 0 });
      renderFloatingRows([]);
    }
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
    renderDailyChart({ totalActivos: 0, presentes: 0, ausentes: 0, permisos: 0, porcentaje: 0 });
    renderFloatingRows([]);
  }
}

// 3. Renderizar gráfico Donut con Chart.js
// - Si total empleados = 0: anillo neutro vacío, 0%.
// - Si 0 asistencias hoy: sólo ausentes (rojo) y permisos (amarillo, si coincide con hoy). 0%.
// - Si hay asistencias: presentes (verde), ausentes (rojo), permisos (amarillo), % asistencia.
function renderDailyChart(summary) {
  const canvas = document.getElementById('dailyChartCanvas');
  const calloutText = document.getElementById('calloutPercentText');

  if (!canvas) return;

  const totalActivos = summary.totalActivos || 0;
  const presentes = summary.presentes || 0;
  const ausentes = summary.ausentes || 0;
  const permisos = summary.permisos || 0;
  const isDark = document.body.classList.contains('dark-mode');

  let dataValues = [];
  let bgColors = [];
  let labels = [];
  let pctDisplay = '0%';

  if (totalActivos === 0) {
    // Caso 1: Cero empleados en el sistema
    pctDisplay = '0%';
    dataValues = [1];
    bgColors = [isDark ? '#334155' : '#E2E8F0'];
    labels = ['Sin empleados'];
  } else if (presentes === 0) {
    // Caso 2: Empleados registrados pero nadie ha asistido hoy
    pctDisplay = '0%';
    if (permisos > 0) {
      dataValues = [ausentes, permisos];
      bgColors = ['#C00000', '#FFBF00'];
      labels = ['Ausentes', 'Permisos'];
    } else {
      dataValues = [ausentes > 0 ? ausentes : totalActivos];
      bgColors = ['#C00000'];
      labels = ['Ausentes'];
    }
  } else {
    // Caso 3: Asistencias registradas hoy
    const pct = summary.porcentaje !== undefined 
      ? summary.porcentaje 
      : Math.round((presentes / totalActivos) * 100);
    pctDisplay = `${pct}%`;

    dataValues = [];
    bgColors = [];
    labels = [];

    if (presentes > 0) {
      dataValues.push(presentes);
      bgColors.push('#00A859');
      labels.push('Presentes');
    }
    if (ausentes > 0) {
      dataValues.push(ausentes);
      bgColors.push('#C00000');
      labels.push('Ausentes');
    }
    if (permisos > 0) {
      dataValues.push(permisos);
      bgColors.push('#FFBF00');
      labels.push('Permisos');
    }
  }

  if (calloutText) {
    calloutText.textContent = pctDisplay;
  }

  if (dailyChart) {
    dailyChart.destroy();
  }

  dailyChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: bgColors,
        borderWidth: 0,
        hoverOffset: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: '54%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: totalActivos > 0,
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

// 4. Renderizar filas flotantes (MÁXIMO 4 EMPLEADOS) o estado vacío
function renderFloatingRows(registros) {
  const container = document.getElementById('floatingRowsContainer');
  if (!container) return;

  const list = (registros && Array.isArray(registros)) ? registros.slice(0, 4) : [];

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-registros-box">
        <i class="far fa-calendar-check empty-registros-icon"></i>
        <p class="empty-registros-title">Sin asistencias registradas hoy</p>
        <span class="empty-registros-sub">Ingrese la cédula del empleado en el módulo de registro para marcar entrada</span>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="floating-employee-row">
      <div class="row-user-box">
        <img src="${item.foto || '/public/assets/default-avatar.png'}" alt="${item.nombre}" class="row-avatar-circle" onerror="this.src='/public/assets/default-avatar.png'">
        <span class="row-user-name">${item.nombre}</span>
      </div>
      <div class="row-time-text">${item.hora_entrada}</div>
      <div class="row-time-text">${item.hora_salida}</div>
      <div class="row-status-box">
        <span class="${item.estado && (item.estado.toLowerCase().includes('ausent') || item.estado.toLowerCase().includes('falta')) ? 'status-red-dot' : 'status-green-dot'}"></span>
      </div>
    </div>
  `).join('');
}

// 5. Módulo de Registro Rápido por Cédula
function setupQuickRegister() {
  const form = document.getElementById('quickRegisterForm');
  const cedulaInput = document.getElementById('quickCedulaInput');
  const cancelBtn = document.getElementById('btnQuickCancel');

  if (cancelBtn && cedulaInput) {
    cancelBtn.addEventListener('click', () => {
      cedulaInput.value = '';
      cedulaInput.focus();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cedula = cedulaInput.value.trim();

      if (!cedula) {
        showToast('Ingrese una cédula de identidad.', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
      }

      try {
        const res = await fetch('/api/asistencia/registro-rapido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          cedulaInput.value = '';
          loadDashboardData();
        } else {
          showToast(data.message || 'No se pudo registrar la asistencia.', 'error');
        }
      } catch (err) {
        showToast('Error de conexión con el servidor.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Registrar';
        }
      }
    });
  }
}

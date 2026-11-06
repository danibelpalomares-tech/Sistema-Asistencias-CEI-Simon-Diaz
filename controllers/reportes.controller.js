const dbHelper = require('../config/db');

function toDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0].split(' ')[0];
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return val.toISOString().split('T')[0];
  }
  return String(val);
}

function formatTimeToAMPM(timeStr) {
  if (!timeStr) return '--:--';
  const parts = String(timeStr).split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${minutes} ${ampm}`;
}

function formatDateToDMY(dateStr) {
  if (!dateStr) return '--/--/----';
  const str = toDateStr(dateStr);
  const parts = str.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

function calculateHoursWorked(horaEntrada, horaSalida) {
  if (!horaEntrada || !horaSalida || horaSalida === '--:--') {
    return { text: '--:--', minutes: 0 };
  }
  const parts1 = String(horaEntrada).split(':');
  const parts2 = String(horaSalida).split(':');
  const h1 = parseInt(parts1[0], 10) || 0;
  const m1 = parseInt(parts1[1], 10) || 0;
  const h2 = parseInt(parts2[0], 10) || 0;
  const m2 = parseInt(parts2[1], 10) || 0;

  let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMinutes < 0) diffMinutes = 0;

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hours > 0 && mins > 0) return { text: `${hours}h ${mins}min`, minutes: diffMinutes };
  if (hours > 0) return { text: `${hours}h`, minutes: diffMinutes };
  return { text: `${mins}min`, minutes: diffMinutes };
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const ReportesController = {
  async getReporte(req, res) {
    try {
      const {
        tipo = 'general', // 'general' | 'individual'
        id_empleado,
        cargo = 'Todos',
        estado = 'Todos',
        fecha_inicio,
        fecha_fin
      } = req.query;

      const empleadosTabla = dbHelper.tabla('empleados');
      const asistenciasTabla = dbHelper.tabla('asistencias');
      const permisosTabla = dbHelper.tabla('permisos');

      const empleados = await empleadosTabla.select();
      const asistencias = await asistenciasTabla.select();
      const permisos = await permisosTabla.select();

      // Fechas normalizadas en formato YYYY-MM-DD
      const todayStr = toDateStr(new Date());
      const start = fecha_inicio ? toDateStr(fecha_inicio) : '2026-11-01';
      const end = fecha_fin ? toDateStr(fecha_fin) : todayStr;

      // Calcular días en el rango exacto seleccionado (inclusivo)
      const d1 = new Date(start + 'T00:00:00');
      const d2 = new Date(end + 'T00:00:00');
      const diffTime = d2.getTime() - d1.getTime();
      const totalDiasEvaluados = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)) + 1);

      if (empleados.length === 0) {
        return res.json({
          success: true,
          tipo,
          kpi: {
            totalDiasEvaluados: totalDiasEvaluados || 0,
            faltasInjustificadas: 0,
            permisosAprobados: 0,
            porcentajeAsistencia: 0,
            personalInactivo: 0
          },
          chartData: {
            asistencias: 0,
            faltas: 0,
            permisos: 0,
            inactivos: 0,
            totalRegistros: 0
          },
          registros: [],
          filas: []
        });
      }

      if (tipo === 'individual') {
        // REPORTE INDIVIDUAL CON DESGLOSE DÍA A DÍA
        let emp = null;
        if (id_empleado) {
          emp = empleados.find(e => String(e.id) === String(id_empleado) || String(e.cedula) === String(id_empleado));
        }
        if (!emp && empleados.length > 0) {
          emp = empleados[0];
        }
        if (!emp) {
          return res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
        }

        // Asistencias reales del empleado en el rango (normalizando fechas a string YYYY-MM-DD)
        const empAsistencias = asistencias.filter(a => {
          if (a.id_empleado != emp.id) return false;
          const fStr = toDateStr(a.fecha);
          return fStr >= start && fStr <= end;
        });

        // Permisos aprobados del empleado que coinciden con el rango
        const empPermisos = permisos.filter(p => {
          if (p.id_empleado != emp.id) return false;
          if (p.estado && p.estado !== 'Aprobado') return false;
          const pStart = toDateStr(p.fecha_inicio);
          const pEnd = toDateStr(p.fecha_fin);
          return pStart <= end && pEnd >= start;
        });

        const isEmpInactivo = (emp.estado || 'Activo').toLowerCase() === 'inactivo';

        // Generar desglose para cada día en el rango de fechas evaluado [start, end]
        const registros = [];
        let curr = new Date(start + 'T00:00:00');
        const endDateObj = new Date(end + 'T00:00:00');

        let diasAsistidos = 0;
        let permisosAprobados = 0;
        let faltasInjustificadas = 0;
        let inactivosCount = 0;

        while (curr <= endDateObj) {
          const isoStr = toDateStr(curr);
          const dayName = dayNames[curr.getDay()];
          const fechaFmt = formatDateToDMY(isoStr);

          // Buscar asistencia en esta fecha específica
          const att = empAsistencias.find(a => toDateStr(a.fecha) === isoStr);
          // Buscar permiso aprobado en esta fecha específica
          const perm = empPermisos.find(p => {
            const pStart = toDateStr(p.fecha_inicio);
            const pEnd = toDateStr(p.fecha_fin);
            return isoStr >= pStart && isoStr <= pEnd;
          });

          if (att) {
            diasAsistidos++;
            const entradaFmt = formatTimeToAMPM(att.hora_entrada);
            const salidaFmt = att.hora_salida ? formatTimeToAMPM(att.hora_salida) : '--:--';
            const { text: horasCumplidas } = calculateHoursWorked(att.hora_entrada, att.hora_salida);
            registros.push({
              id: `att-${att.id || isoStr}`,
              fecha: fechaFmt,
              isoFecha: isoStr,
              dia: dayName,
              hora_entrada: entradaFmt,
              hora_salida: salidaFmt,
              horas_cumplidas: horasCumplidas,
              estado_observacion: att.estado || 'Asistió'
            });
          } else if (perm) {
            permisosAprobados++;
            registros.push({
              id: `perm-${perm.id || isoStr}`,
              fecha: fechaFmt,
              isoFecha: isoStr,
              dia: dayName,
              hora_entrada: '--:--',
              hora_salida: '--:--',
              horas_cumplidas: '0h',
              estado_observacion: `Permiso (${perm.tipo || 'Médico'})`
            });
          } else if (isEmpInactivo) {
            // Requisito: Si el empleado está inactivo, figura como Inactivo en lugar de Falta Injustificada
            inactivosCount++;
            registros.push({
              id: `inactivo-${isoStr}`,
              fecha: fechaFmt,
              isoFecha: isoStr,
              dia: dayName,
              hora_entrada: '--:--',
              hora_salida: '--:--',
              horas_cumplidas: '0h',
              estado_observacion: 'Inactivo'
            });
          } else {
            faltasInjustificadas++;
            registros.push({
              id: `falta-${isoStr}`,
              fecha: fechaFmt,
              isoFecha: isoStr,
              dia: dayName,
              hora_entrada: '--:--',
              hora_salida: '--:--',
              horas_cumplidas: '0h',
              estado_observacion: 'Falta Injustificada'
            });
          }

          curr.setDate(curr.getDate() + 1);
        }

        // Ordenar registros por fecha descendente (más reciente arriba)
        registros.sort((a, b) => b.isoFecha.localeCompare(a.isoFecha));

        // Porcentaje de asistencia del empleado (solo evalúa días en que estaba activo o en general)
        const totalDiasActivo = totalDiasEvaluados - inactivosCount;
        const porcentajeAsistencia = totalDiasActivo > 0 
          ? Math.min(100, Math.round((diasAsistidos / totalDiasActivo) * 100))
          : (totalDiasEvaluados > 0 ? Math.min(100, Math.round((diasAsistidos / totalDiasEvaluados) * 100)) : 0);

        return res.json({
          success: true,
          tipo: 'individual',
          empleado: {
            id: emp.id,
            nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
            cedula: `${emp.tipo_cedula || 'V'}-${emp.cedula}`,
            cargo: emp.cargo,
            estado: emp.estado,
            foto: emp.foto
          },
          kpi: {
            totalDiasEvaluados,
            faltasInjustificadas,
            permisosAprobados,
            porcentajeAsistencia,
            personalInactivo: isEmpInactivo ? 1 : 0
          },
          chartData: {
            asistencias: diasAsistidos,
            faltas: faltasInjustificadas,
            permisos: permisosAprobados,
            inactivos: inactivosCount,
            totalDias: totalDiasEvaluados,
            totalRegistros: totalDiasEvaluados
          },
          registros
        });
      } else {
        // REPORTE CONSOLIDADO GENERAL
        let filtrados = [...empleados];
        if (cargo && cargo !== 'Todos') {
          filtrados = filtrados.filter(e => (e.cargo || '').toLowerCase() === cargo.toLowerCase());
        }
        if (estado && estado !== 'Todos') {
          const st = estado.toLowerCase().startsWith('activo') ? 'activo' : 'inactivo';
          filtrados = filtrados.filter(e => (e.estado || 'Activo').toLowerCase() === st);
        }

        const totalInactivos = filtrados.filter(e => (e.estado || 'Activo').toLowerCase() === 'inactivo').length;

        const filas = filtrados.map(emp => {
          const empAtt = asistencias.filter(a => {
            if (a.id_empleado != emp.id) return false;
            const fStr = toDateStr(a.fecha);
            return fStr >= start && fStr <= end;
          });

          const empPerm = permisos.filter(p => {
            if (p.id_empleado != emp.id) return false;
            if (p.estado && p.estado !== 'Aprobado') return false;
            const pStart = toDateStr(p.fecha_inicio);
            const pEnd = toDateStr(p.fecha_fin);
            return pStart <= end && pEnd >= start;
          });

          let totalMinutes = 0;
          empAtt.forEach(a => {
            const { minutes } = calculateHoursWorked(a.hora_entrada, a.hora_salida);
            totalMinutes += minutes;
          });

          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          const horasFormatted = h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : (m > 0 ? `${m}min` : '0h');

          const diasAsistidos = empAtt.length;
          const permisosAprobados = empPerm.length;
          const isEmpInactivo = (emp.estado || 'Activo').toLowerCase() === 'inactivo';

          // Requisito: Si el empleado está inactivo, NO computa faltas injustificadas sino que se indica como Inactivo
          const faltasInjustificadas = isEmpInactivo 
            ? 'Inactivo' 
            : Math.max(0, totalDiasEvaluados - diasAsistidos - permisosAprobados);

          return {
            id: emp.id,
            cedula: `${emp.tipo_cedula || 'V'}-${emp.cedula}`,
            nombre: `${emp.nombres} ${emp.apellidos}`,
            cargo: emp.cargo || '---',
            estado: emp.estado || 'Activo',
            isInactivo: isEmpInactivo,
            dias_asistidos: diasAsistidos,
            faltas_injustificadas: faltasInjustificadas,
            permisos_aprobados: permisosAprobados,
            horas_totales: horasFormatted
          };
        });

        const totalAsistencias = filas.reduce((acc, f) => acc + f.dias_asistidos, 0);
        const totalFaltas = filas.reduce((acc, f) => acc + (typeof f.faltas_injustificadas === 'number' ? f.faltas_injustificadas : 0), 0);
        const totalPermisos = filas.reduce((acc, f) => acc + f.permisos_aprobados, 0);

        const activosFiltrados = filtrados.filter(e => (e.estado || 'Activo').toLowerCase() === 'activo');
        const totalPosible = activosFiltrados.length * totalDiasEvaluados;
        const porcentajeAsistencia = totalPosible > 0 
          ? Math.min(100, Math.round((totalAsistencias / totalPosible) * 100))
          : 0;

        return res.json({
          success: true,
          tipo: 'general',
          kpi: {
            totalDiasEvaluados,
            faltasInjustificadas: totalFaltas,
            permisosAprobados: totalPermisos,
            porcentajeAsistencia,
            personalInactivo: totalInactivos
          },
          chartData: {
            asistencias: totalAsistencias,
            faltas: totalFaltas,
            permisos: totalPermisos,
            inactivos: totalInactivos,
            totalRegistros: totalAsistencias + totalFaltas + totalPermisos + totalInactivos
          },
          filas
        });
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      return res.status(500).json({ success: false, message: 'Error interno al generar reporte.' });
    }
  }
};

module.exports = ReportesController;

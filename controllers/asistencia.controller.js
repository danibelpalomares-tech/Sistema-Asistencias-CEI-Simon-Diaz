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
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${minutes} ${ampm}`;
}

const AsistenciaController = {
  // Módulo de registro rápido por Cédula (Inicio / Dashboard)
  async registrarByCedula(req, res) {
    try {
      const { cedula } = req.body;

      if (!cedula || cedula.trim() === '') {
        return res.status(400).json({ success: false, message: 'Ingrese una cédula de identidad.' });
      }

      const cleanCedula = cedula.replace(/^[vVeE]-?/, '').trim();
      const empleadosTabla = dbHelper.tabla('empleados');
      const asistenciasTabla = dbHelper.tabla('asistencias');

      // Buscar empleado
      const empleados = await empleadosTabla.select();
      const empleado = empleados.find(e => e.cedula === cleanCedula || `${e.tipo_cedula}-${e.cedula}` === cedula.trim());

      if (!empleado) {
        return res.status(404).json({ success: false, message: `No se encontró ningún empleado con la cédula ${cedula}.` });
      }

      if (empleado.estado === 'Inactivo') {
        return res.status(400).json({ success: false, message: `El empleado ${empleado.nombres} ${empleado.apellidos} se encuentra Inactivo.` });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // 'HH:mm:ss'
      const timeFormatted = formatTimeToAMPM(currentTime);

      // Buscar asistencia de hoy
      const asistenciasHoy = await asistenciasTabla.select({ where: { id_empleado: empleado.id, fecha: todayStr } });
      let registroHoy = asistenciasHoy.length > 0 ? asistenciasHoy[0] : null;

      if (!registroHoy) {
        // Registrar Entrada puntual (en la institución no existe concepto de retardo)
        const estado = 'Presente';

        await asistenciasTabla.insert({
          id_empleado: empleado.id,
          fecha: todayStr,
          hora_entrada: currentTime,
          hora_salida: null,
          estado: estado,
          observaciones: 'Entrada puntual'
        });

        return res.json({
          success: true,
          action: 'entrada',
          message: `Entrada registrada: ${empleado.nombres} ${empleado.apellidos} (${timeFormatted})`,
          data: {
            empleado: `${empleado.nombres} ${empleado.apellidos}`,
            cedula: `${empleado.tipo_cedula}-${empleado.cedula}`,
            hora_entrada: timeFormatted,
            estado
          }
        });
      } else if (!registroHoy.hora_salida) {
        // Registrar Salida
        await asistenciasTabla.updateById({
          hora_salida: currentTime,
          observaciones: registroHoy.observaciones ? `${registroHoy.observaciones} - Salida registrada` : 'Salida registrada'
        }, registroHoy.id);

        return res.json({
          success: true,
          action: 'salida',
          message: `Salida registrada: ${empleado.nombres} ${empleado.apellidos} (${timeFormatted})`,
          data: {
            empleado: `${empleado.nombres} ${empleado.apellidos}`,
            cedula: `${empleado.tipo_cedula}-${empleado.cedula}`,
            hora_salida: timeFormatted,
            estado: registroHoy.estado
          }
        });
      } else {
        return res.json({
          success: false,
          action: 'completada',
          message: `${empleado.nombres} ${empleado.apellidos} ya completó su registro de entrada y salida por el día de hoy.`
        });
      }
    } catch (error) {
      console.error('Error al registrar asistencia rápida:', error);
      return res.status(500).json({ success: false, message: 'Error interno al registrar asistencia.' });
    }
  },

  // Obtener resumen diario para el dashboard de Inicio
  async getDashboardSummary(req, res) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const empleadosTabla = dbHelper.tabla('empleados');
      const asistenciasTabla = dbHelper.tabla('asistencias');
      const permisosTabla = dbHelper.tabla('permisos');

      const empleados = await empleadosTabla.select();
      const activos = empleados.filter(e => (e.estado || 'Activo').toLowerCase() === 'activo');
      const totalActivos = activos.length;

      // Obtener asistencias de hoy y asegurar que SOLO pertenezcan a empleados activos existentes
      const asistenciasRaw = await asistenciasTabla.select({ where: { fecha: todayStr } });
      const asistenciasHoy = asistenciasRaw.filter(a => activos.some(e => e.id === a.id_empleado));

      const permisos = await permisosTabla.select();

      // Permisos activos hoy que coinciden con la fecha de hoy (sólo empleados activos existentes)
      const permisosHoy = permisos.filter(p => {
        const empExiste = activos.some(e => e.id === p.id_empleado);
        const pStart = toDateStr(p.fecha_inicio);
        const pEnd = toDateStr(p.fecha_fin);
        return empExiste && (p.estado || '').toLowerCase() === 'aprobado' && pStart <= todayStr && pEnd >= todayStr;
      });

      const presentes = asistenciasHoy.length;
      const cantPermisos = permisosHoy.length;
      let ausentes = 0;
      let porcentaje = 0;

      if (totalActivos > 0) {
        ausentes = Math.max(0, totalActivos - presentes - cantPermisos);
        porcentaje = Math.min(100, Math.round((presentes / totalActivos) * 100));
      }

      // Últimos registros para la tabla del inicio (sólo de empleados existentes)
      const ultimosRegistros = asistenciasHoy.map(a => {
        const emp = empleados.find(e => e.id === a.id_empleado);
        if (!emp) return null;
        return {
          id: a.id,
          id_empleado: a.id_empleado,
          nombre: `${emp.nombres || ''} ${emp.apellidos || ''}`.trim(),
          cedula: `${emp.tipo_cedula || 'V'}-${emp.cedula || '---'}`,
          foto: emp.foto || '/public/assets/default-avatar.png',
          cargo: emp.cargo || 'General',
          hora_entrada: formatTimeToAMPM(a.hora_entrada),
          hora_salida: a.hora_salida ? formatTimeToAMPM(a.hora_salida) : '--:--',
          estado: a.estado || 'Presente'
        };
      }).filter(Boolean);

      return res.json({
        success: true,
        summary: {
          presentes,
          ausentes,
          permisos: cantPermisos,
          totalActivos,
          porcentaje,
          fecha: todayStr,
          ultimosRegistros
        }
      });
    } catch (error) {
      console.error('Error al obtener resumen de dashboard:', error);
      return res.status(500).json({ success: false, message: 'Error al cargar resumen diario.' });
    }
  },

  // Listar asistencias completas con filtros (Presentes, Ausentes, Permisos, Búsqueda, Fecha con Calendario)
  async getAll(req, res) {
    try {
      const { search, estado = 'Presentes', fecha, page = 1, limit = 6 } = req.query;
      const asistenciasTabla = dbHelper.tabla('asistencias');
      const empleadosTabla = dbHelper.tabla('empleados');
      const permisosTabla = dbHelper.tabla('permisos');

      const todayStr = new Date().toISOString().split('T')[0];
      const targetFecha = (fecha && fecha !== 'Hoy' && fecha !== 'Todos') ? fecha : todayStr;

      // Obtener todos los empleados
      const todosEmpleados = await empleadosTabla.select();

      // Obtener asistencias registradas para la fecha seleccionada (descartar huérfanas de eliminados)
      const asistenciasRaw = await asistenciasTabla.select({ where: { fecha: targetFecha } });
      const asistenciasDia = asistenciasRaw.filter(a => todosEmpleados.some(e => e.id === a.id_empleado));

      // Obtener permisos aprobados para la fecha seleccionada (sólo empleados existentes)
      const todosPermisos = await permisosTabla.select();
      const permisosDia = todosPermisos.filter(p => {
        const empExiste = todosEmpleados.some(e => e.id === p.id_empleado);
        const pStart = toDateStr(p.fecha_inicio);
        const pEnd = toDateStr(p.fecha_fin);
        return empExiste &&
          (p.estado || '').toLowerCase() === 'aprobado' &&
          pStart <= targetFecha &&
          pEnd >= targetFecha;
      });

      // Empleados a evaluar para esta fecha:
      // Todos los activos, más cualquier empleado inactivo que tenga registro histórico de asistencia o permiso en esta fecha
      const empleadosParaFecha = todosEmpleados.filter(e => {
        const isActivo = (e.estado || 'Activo').toLowerCase() === 'activo';
        const hasAsistencia = asistenciasDia.some(a => a.id_empleado === e.id);
        const hasPermiso = permisosDia.some(p => p.id_empleado === e.id);
        return isActivo || hasAsistencia || hasPermiso;
      });

      // Mapear cada empleado activo o con historial al estado de asistencia de esa fecha (Presente, Permiso o Ausente)
      let combined = empleadosParaFecha.map(emp => {
        const asis = asistenciasDia.find(a => a.id_empleado === emp.id);
        const permisoActivo = permisosDia.find(p => p.id_empleado === emp.id);

        let estadoCalculado = 'Ausente';
        let horaEntrada = '--:--';
        let horaSalida = '--:--';
        let observaciones = 'Sin registro de asistencia';

        if (asis) {
          estadoCalculado = 'Presente';
          horaEntrada = formatTimeToAMPM(asis.hora_entrada);
          horaSalida = asis.hora_salida ? formatTimeToAMPM(asis.hora_salida) : '--:--';
          observaciones = asis.observaciones || 'Jornada regular';
        } else if (permisoActivo) {
          // Si está de permiso, no puede aparecer como ausente; su estado es Permiso con horas --:--
          estadoCalculado = 'Permiso';
          horaEntrada = '--:--';
          horaSalida = '--:--';
          observaciones = `De permiso (${permisoActivo.tipo}): ${permisoActivo.motivo || ''}`.trim();
        }

        return {
          id: asis ? asis.id : (permisoActivo ? `permiso-${emp.id}` : `ausente-${emp.id}`),
          id_empleado: emp.id,
          nombres: emp.nombres || '',
          apellidos: emp.apellidos || '',
          nombreCompleto: `${emp.nombres || ''} ${emp.apellidos || ''}`.trim(),
          cedula: `${emp.tipo_cedula || 'V'}-${emp.cedula || '---'}`,
          foto: emp.foto || '/public/assets/default-avatar.png',
          cargo: emp.cargo || 'Docente',
          fecha: targetFecha,
          hora_entrada: horaEntrada,
          hora_salida: horaSalida,
          estado: estadoCalculado,
          tipo_permiso: permisoActivo ? permisoActivo.tipo : null,
          observaciones: observaciones
        };
      });

      // Filtrar por término de búsqueda (search)
      if (search && search.trim() !== '') {
        const term = search.trim().toLowerCase();
        combined = combined.filter(c => 
          c.nombreCompleto.toLowerCase().includes(term) ||
          c.cedula.toLowerCase().includes(term) ||
          c.cargo.toLowerCase().includes(term)
        );
      }

      // Filtrar por Estado: Presentes / Ausentes / Permisos (REQUISITO: sin opción 'Todos')
      if (estado) {
        const est = estado.toLowerCase();
        if (est.startsWith('presen')) {
          combined = combined.filter(c => c.estado === 'Presente');
        } else if (est.startsWith('ausen')) {
          combined = combined.filter(c => c.estado === 'Ausente');
        } else if (est.startsWith('permis')) {
          combined = combined.filter(c => c.estado === 'Permiso');
        }
      }

      const total = combined.length;

      // Si se solicita exportar todo sin paginación (para PDF / Excel)
      if (limit === 'all' || parseInt(limit, 10) === 0) {
        return res.json({
          success: true,
          data: combined,
          fechaSeleccionada: targetFecha,
          pagination: {
            total,
            page: 1,
            totalPages: 1,
            limit: total
          }
        });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 6; // Exactamente 6 empleados por página
      const totalPages = Math.ceil(total / limitNum) || 1;
      const offset = (pageNum - 1) * limitNum;
      const paginated = combined.slice(offset, offset + limitNum);

      return res.json({
        success: true,
        data: paginated,
        fechaSeleccionada: targetFecha,
        pagination: {
          total,
          page: pageNum,
          totalPages,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Error al obtener asistencias:', error);
      return res.status(500).json({ success: false, message: 'Error al listar asistencias.' });
    }
  },

  async create(req, res) {
    try {
      const { id_empleado, fecha, hora_entrada, hora_salida, estado, observaciones } = req.body;
      const asistenciasTabla = dbHelper.tabla('asistencias');

      const result = await asistenciasTabla.insert({
        id_empleado: parseInt(id_empleado, 10),
        fecha: fecha || new Date().toISOString().split('T')[0],
        hora_entrada: hora_entrada || '08:00:00',
        hora_salida: hora_salida || null,
        estado: estado || 'Presente',
        observaciones: observaciones || ''
      });

      return res.status(201).json({ success: true, message: 'Asistencia registrada con éxito.', id: result.insertId });
    } catch (error) {
      console.error('Error al crear asistencia:', error);
      return res.status(500).json({ success: false, message: 'Error interno al registrar asistencia.' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { hora_entrada, hora_salida, estado, observaciones } = req.body;
      const asistenciasTabla = dbHelper.tabla('asistencias');

      const updateData = {};
      if (hora_entrada) updateData.hora_entrada = hora_entrada;
      if (hora_salida !== undefined) updateData.hora_salida = hora_salida;
      if (estado) updateData.estado = estado;
      if (observaciones !== undefined) updateData.observaciones = observaciones;

      await asistenciasTabla.updateById(updateData, id);

      return res.json({ success: true, message: 'Asistencia actualizada con éxito.' });
    } catch (error) {
      console.error('Error al actualizar asistencia:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar asistencia.' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const asistenciasTabla = dbHelper.tabla('asistencias');
      await asistenciasTabla.deleteById(id);
      return res.json({ success: true, message: 'Asistencia eliminada con éxito.' });
    } catch (error) {
      console.error('Error al eliminar asistencia:', error);
      return res.status(500).json({ success: false, message: 'Error al eliminar asistencia.' });
    }
  }
};

module.exports = AsistenciaController;

const dbHelper = require('../config/db');
const fs = require('fs');
const path = require('path');

function toDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0].split(' ')[0];
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return val.toISOString().split('T')[0];
  }
  return String(val);
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

const PermisosController = {
  async getAll(req, res) {
    try {
      const { search, tipo, fecha, page = 1, limit = 10 } = req.query;
      const permisosTabla = dbHelper.tabla('permisos');
      const empleadosTabla = dbHelper.tabla('empleados');

      let permisos = await permisosTabla.select();
      const empleados = await empleadosTabla.select();

      // Combinar sólo con empleados que realmente existen en el sistema
      const validPermisos = permisos.filter(p => empleados.some(e => e.id === p.id_empleado));
      let combined = validPermisos.map(p => {
        const emp = empleados.find(e => e.id === p.id_empleado) || {};
        const fechaReg = p.fecha_registro ? toDateStr(p.fecha_registro) : (p.created_at ? toDateStr(p.created_at) : toDateStr(p.fecha_inicio));
        return {
          id: p.id,
          id_empleado: p.id_empleado,
          nombreCompleto: `${emp.nombres || 'Empleado'} ${emp.apellidos || ''}`.trim(),
          cedula: `${emp.tipo_cedula || 'V'}-${emp.cedula || '---'}`,
          foto: emp.foto || '/public/assets/default-avatar.png',
          cargo: emp.cargo || '---',
          tipo: p.tipo,
          fecha_inicio: toDateStr(p.fecha_inicio),
          fecha_fin: toDateStr(p.fecha_fin),
          fecha_registro: fechaReg,
          fecha_inicio_formato: formatDateToDMY(p.fecha_inicio),
          fecha_fin_formato: formatDateToDMY(p.fecha_fin),
          motivo: p.motivo || '',
          archivo_adjunto: p.archivo_adjunto,
          estado: p.estado || 'Aprobado'
        };
      });

      // Filtrar por término de búsqueda (nombre, cédula)
      if (search && search.trim() !== '') {
        const term = search.trim().toLowerCase();
        combined = combined.filter(c => 
          c.nombreCompleto.toLowerCase().includes(term) ||
          c.cedula.toLowerCase().includes(term) ||
          c.tipo.toLowerCase().includes(term)
        );
      }

      // Filtrar por tipo de permiso
      if (tipo && tipo !== 'Todos') {
        combined = combined.filter(c => c.tipo.toLowerCase() === tipo.toLowerCase());
      }

      // Filtrar por rango de vigencia del permiso (fecha dentro de Desde y Hasta)
      if (fecha && fecha !== 'Todos') {
        const targetFecha = (fecha === 'Hoy') ? toDateStr(new Date()) : toDateStr(fecha);
        combined = combined.filter(c => {
          const fInicio = toDateStr(c.fecha_inicio);
          const fFin = toDateStr(c.fecha_fin) || fInicio;
          return targetFecha >= fInicio && targetFecha <= fFin;
        });
      }

      const total = combined.length;

      // Si se solicita todo sin paginar
      if (limit === 'all' || parseInt(limit, 10) === 0) {
        return res.json({
          success: true,
          data: combined,
          pagination: {
            total,
            page: 1,
            totalPages: 1,
            limit: total
          }
        });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 6; // Máximo 6 por página según requerimiento
      const totalPages = Math.ceil(total / limitNum) || 1;
      const offset = (pageNum - 1) * limitNum;
      const paginated = combined.slice(offset, offset + limitNum);

      return res.json({
        success: true,
        data: paginated,
        pagination: {
          total,
          page: pageNum,
          totalPages,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      return res.status(500).json({ success: false, message: 'Error al listar permisos.' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const permisosTabla = dbHelper.tabla('permisos');
      const empleadosTabla = dbHelper.tabla('empleados');

      const permiso = await permisosTabla.selectById(id);
      if (!permiso) {
        return res.status(404).json({ success: false, message: 'Permiso no encontrado.' });
      }

      const emp = await empleadosTabla.selectById(permiso.id_empleado);

      return res.json({
        success: true,
        data: {
          ...permiso,
          fecha_inicio_formato: formatDateToDMY(permiso.fecha_inicio),
          fecha_fin_formato: formatDateToDMY(permiso.fecha_fin),
          empleado: emp ? {
            id: emp.id,
            nombreCompleto: `${emp.nombres} ${emp.apellidos}`,
            cedula: `${emp.tipo_cedula}-${emp.cedula}`,
            cargo: emp.cargo,
            foto: emp.foto
          } : null
        }
      });
    } catch (error) {
      console.error('Error al obtener permiso:', error);
      return res.status(500).json({ success: false, message: 'Error al consultar permiso.' });
    }
  },

  async create(req, res) {
    try {
      const { id_empleado, tipo, fecha_inicio, fecha_fin, motivo, estado } = req.body;

      if (!id_empleado || !tipo || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Empleado, tipo de permiso, fecha de inicio y fecha fin son obligatorios.'
        });
      }

      const permisosTabla = dbHelper.tabla('permisos');

      let archivoUrl = null;
      if (req.file) {
        archivoUrl = `/uploads/justificativos/${req.file.filename}`;
      }

      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const sqlTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const nuevoPermiso = {
        id_empleado: parseInt(id_empleado, 10),
        tipo: tipo.trim(),
        fecha_inicio: toDateStr(fecha_inicio),
        fecha_fin: toDateStr(fecha_fin),
        motivo: motivo ? motivo.trim() : '',
        archivo_adjunto: archivoUrl,
        estado: estado || 'Aprobado',
        created_at: sqlTimestamp
      };

      const result = await permisosTabla.insert(nuevoPermiso);

      return res.status(201).json({
        success: true,
        message: 'Permiso registrado exitosamente.',
        data: { id: result.insertId, ...nuevoPermiso, fecha_inicio_formato: formatDateToDMY(nuevoPermiso.fecha_inicio), fecha_fin_formato: formatDateToDMY(nuevoPermiso.fecha_fin) }
      });
    } catch (error) {
      console.error('Error al registrar permiso:', error);
      return res.status(500).json({ success: false, message: 'Error interno al registrar permiso.' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const permisosTabla = dbHelper.tabla('permisos');

      const existing = await permisosTabla.selectById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Permiso no encontrado.' });
      }

      const { id_empleado, tipo, fecha_inicio, fecha_fin, motivo, estado } = req.body;

      const updateData = {};
      if (id_empleado) updateData.id_empleado = parseInt(id_empleado, 10);
      if (tipo) updateData.tipo = tipo.trim();
      if (fecha_inicio) updateData.fecha_inicio = fecha_inicio;
      if (fecha_fin) updateData.fecha_fin = fecha_fin;
      if (motivo !== undefined) updateData.motivo = motivo.trim();
      if (estado) updateData.estado = estado;

      if (req.body.eliminar_adjunto === '1' || req.body.eliminar_adjunto === 'true') {
        updateData.archivo_adjunto = null;
        if (existing.archivo_adjunto) {
          const filePath = path.join(__dirname, '..', existing.archivo_adjunto);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { console.error('Error al borrar justificativo físico:', e); }
          }
        }
      } else if (req.file) {
        updateData.archivo_adjunto = `/uploads/justificativos/${req.file.filename}`;
      }

      await permisosTabla.updateById(updateData, id);

      return res.json({
        success: true,
        message: 'Permiso actualizado exitosamente.'
      });
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar permiso.' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const permisosTabla = dbHelper.tabla('permisos');
      await permisosTabla.deleteById(id);
      return res.json({ success: true, message: 'Permiso eliminado exitosamente.' });
    } catch (error) {
      console.error('Error al eliminar permiso:', error);
      return res.status(500).json({ success: false, message: 'Error al eliminar permiso.' });
    }
  }
};

module.exports = PermisosController;

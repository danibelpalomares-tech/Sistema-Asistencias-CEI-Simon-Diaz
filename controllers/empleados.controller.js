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

const EmpleadosController = {
  async getAll(req, res) {
    try {
      const { search, cargo, estado, page = 1, limit = 6 } = req.query;
      const empleadosTabla = dbHelper.tabla('empleados');

      let empleados = await empleadosTabla.select();

      // Normalizar fechas de la base de datos a formato YYYY-MM-DD
      empleados = empleados.map(emp => ({
        ...emp,
        fecha_nacimiento: toDateStr(emp.fecha_nacimiento),
        fecha_ingreso: toDateStr(emp.fecha_ingreso)
      }));

      // Filtrar por término de búsqueda (nombre, apellido, cédula)
      if (search && search.trim() !== '') {
        const term = search.trim().toLowerCase();
        empleados = empleados.filter(emp => {
          const fullCedula = `${emp.tipo_cedula}-${emp.cedula}`.toLowerCase();
          const fullName = `${emp.nombres} ${emp.apellidos}`.toLowerCase();
          return fullCedula.includes(term) ||
                 emp.cedula.toLowerCase().includes(term) ||
                 fullName.includes(term) ||
                 emp.cargo.toLowerCase().includes(term);
        });
      }

      // Filtrar por cargo (Docente, Administrativo, Mantenimiento)
      if (cargo && cargo !== 'Todos') {
        empleados = empleados.filter(emp => emp.cargo.toLowerCase() === cargo.toLowerCase());
      }

      // Filtrar por estado (Activo, Inactivo)
      if (estado && estado !== 'Todos') {
        empleados = empleados.filter(emp => emp.estado.toLowerCase() === estado.toLowerCase());
      }

      const total = empleados.length;

      // Si se solicita exportar todo sin paginación
      if (limit === 'all' || parseInt(limit, 10) === 0) {
        return res.json({
          success: true,
          data: empleados,
          pagination: {
            total,
            page: 1,
            totalPages: 1,
            limit: total
          }
        });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 6;
      const totalPages = Math.ceil(total / limitNum) || 1;
      const offset = (pageNum - 1) * limitNum;
      const paginated = empleados.slice(offset, offset + limitNum);

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
      console.error('Error al obtener empleados:', error);
      return res.status(500).json({ success: false, message: 'Error al listar empleados.' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const empleadosTabla = dbHelper.tabla('empleados');
      const empleado = await empleadosTabla.selectById(id);

      if (!empleado) {
        return res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
      }

      return res.json({
        success: true,
        data: {
          ...empleado,
          fecha_nacimiento: toDateStr(empleado.fecha_nacimiento),
          fecha_ingreso: toDateStr(empleado.fecha_ingreso)
        }
      });
    } catch (error) {
      console.error('Error al buscar empleado:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener empleado.' });
    }
  },

  async create(req, res) {
    try {
      const {
        tipo_cedula = 'V',
        cedula,
        nombres,
        apellidos,
        genero,
        fecha_nacimiento,
        telefono,
        email,
        direccion,
        cargo,
        estado = 'Activo',
        nivel_academico,
        fecha_ingreso
      } = req.body;

      if (!cedula || !nombres || !apellidos || !cargo) {
        return res.status(400).json({
          success: false,
          message: 'Cédula, Nombres, Apellidos y Cargo son obligatorios.'
        });
      }

      const empleadosTabla = dbHelper.tabla('empleados');

      // Validar cédula única
      const existing = await empleadosTabla.selectOne({ where: { cedula: cedula.trim() } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Ya existe un empleado registrado con la cédula ${tipo_cedula}-${cedula}.`
        });
      }

      let fotoUrl = '/public/assets/default-avatar.png';
      if (req.file) {
        fotoUrl = `/uploads/empleados/${req.file.filename}`;
      }

      const nuevoEmpleado = {
        tipo_cedula: tipo_cedula.toUpperCase(),
        cedula: cedula.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        genero: genero || 'No especificado',
        fecha_nacimiento: fecha_nacimiento || null,
        telefono: telefono ? telefono.trim() : '',
        email: email ? email.trim() : '',
        direccion: direccion ? direccion.trim() : '',
        cargo: cargo.trim(),
        estado: estado || 'Activo',
        nivel_academico: nivel_academico || 'Bachiller',
        fecha_ingreso: fecha_ingreso || new Date().toISOString().split('T')[0],
        foto: fotoUrl
      };

      const result = await empleadosTabla.insert(nuevoEmpleado);

      return res.status(201).json({
        success: true,
        message: 'Empleado registrado exitosamente.',
        data: { id: result.insertId, ...nuevoEmpleado }
      });
    } catch (error) {
      console.error('Error al registrar empleado:', error);
      return res.status(500).json({ success: false, message: 'Error interno al registrar empleado.' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const empleadosTabla = dbHelper.tabla('empleados');

      const empleado = await empleadosTabla.selectById(id);
      if (!empleado) {
        return res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
      }

      const {
        tipo_cedula,
        cedula,
        nombres,
        apellidos,
        genero,
        fecha_nacimiento,
        telefono,
        email,
        direccion,
        cargo,
        estado,
        nivel_academico,
        fecha_ingreso
      } = req.body;

      const updateData = {};
      if (tipo_cedula) updateData.tipo_cedula = tipo_cedula.toUpperCase();
      if (cedula) updateData.cedula = cedula.trim();
      if (nombres) updateData.nombres = nombres.trim();
      if (apellidos) updateData.apellidos = apellidos.trim();
      if (genero) updateData.genero = genero;
      if (fecha_nacimiento) updateData.fecha_nacimiento = fecha_nacimiento;
      if (telefono !== undefined) updateData.telefono = telefono.trim();
      if (email !== undefined) updateData.email = email.trim();
      if (direccion !== undefined) updateData.direccion = direccion.trim();
      if (cargo) updateData.cargo = cargo.trim();
      if (estado) updateData.estado = estado;
      if (nivel_academico) updateData.nivel_academico = nivel_academico;
      if (fecha_ingreso) updateData.fecha_ingreso = fecha_ingreso;

      if (req.body.eliminar_foto === '1' || req.body.eliminar_foto === 'true') {
        updateData.foto = '/public/assets/default-avatar.png';
        if (empleado.foto && empleado.foto.startsWith('/uploads/empleados/')) {
          const filePath = path.join(__dirname, '..', empleado.foto);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { console.error('Error al borrar foto física de empleado:', e); }
          }
        }
      } else if (req.file) {
        updateData.foto = `/uploads/empleados/${req.file.filename}`;
      }

      await empleadosTabla.updateById(updateData, id);

      const updated = await empleadosTabla.selectById(id);

      return res.json({
        success: true,
        message: 'Empleado actualizado exitosamente.',
        data: updated
      });
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      return res.status(500).json({ success: false, message: 'Error interno al actualizar empleado.' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const numId = parseInt(id, 10);
      const empleadosTabla = dbHelper.tabla('empleados');

      const empleado = await empleadosTabla.selectById(id);
      if (!empleado) {
        return res.status(404).json({ success: false, message: 'Empleado no encontrado.' });
      }

      await empleadosTabla.deleteById(id);

      // Borrado en cascada en memoria (fallback)
      if (dbHelper.memoryStore) {
        if (Array.isArray(dbHelper.memoryStore.asistencias)) {
          dbHelper.memoryStore.asistencias = dbHelper.memoryStore.asistencias.filter(
            a => a.id_empleado != id && a.id_empleado != numId
          );
        }
        if (Array.isArray(dbHelper.memoryStore.permisos)) {
          dbHelper.memoryStore.permisos = dbHelper.memoryStore.permisos.filter(
            p => p.id_empleado != id && p.id_empleado != numId
          );
        }
      }

      // Borrado en cascada en MariaDB si está conectado
      if (dbHelper.isMariaDBConnected()) {
        try {
          await dbHelper.query('DELETE FROM asistencias WHERE id_empleado = ?', [id]);
          await dbHelper.query('DELETE FROM permisos WHERE id_empleado = ?', [id]);
        } catch (dbErr) {
          console.warn('Advertencia en borrado cascada MariaDB:', dbErr.message);
        }
      }

      return res.json({
        success: true,
        message: 'Empleado eliminado del sistema con éxito.'
      });
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      return res.status(500).json({ success: false, message: 'Error al eliminar empleado.' });
    }
  }
};

module.exports = EmpleadosController;

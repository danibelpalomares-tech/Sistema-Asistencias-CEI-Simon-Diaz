const dbHelper = require('../config/db');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const AdminController = {
  async getProfile(req, res) {
    try {
      const configTabla = dbHelper.tabla('configuracion');
      const usuariosTabla = dbHelper.tabla('usuarios');

      const adminFoto = await configTabla.selectOne({ where: { clave: 'admin_foto' } });
      const adminNombre = await configTabla.selectOne({ where: { clave: 'admin_nombre' } });
      const adminTitulo = await configTabla.selectOne({ where: { clave: 'admin_titulo' } });
      const adminEmail = await configTabla.selectOne({ where: { clave: 'admin_email' } });

      // Buscar usuario en DB
      let userInDb = null;
      if (req.user?.id) {
        userInDb = await usuariosTabla.selectOne({ where: { id: req.user.id } });
      }
      if (!userInDb) {
        userInDb = await usuariosTabla.selectOne({ where: { usuario: req.user?.usuario || 'admin' } });
      }

      const rol = adminTitulo?.valor || userInDb?.rol || req.user?.rol || 'Administrador';
      const nombre = adminNombre?.valor || userInDb?.nombre || req.user?.nombre || 'Administrador';
      const email = adminEmail?.valor || userInDb?.email || req.user?.email || 'admin@gmail.com';
      const usuario = userInDb?.usuario || req.user?.usuario || 'admin';
      const foto = adminFoto?.valor || userInDb?.foto || req.user?.foto || '/uploads/admin/default-admin.png';

      return res.json({
        success: true,
        profile: {
          id: userInDb?.id || req.user?.id || 1,
          nombre,
          titulo: rol,
          rol,
          email,
          usuario,
          foto
        }
      });
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener perfil de administrador.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { nombre, titulo, email, usuario, password } = req.body;
      const configTabla = dbHelper.tabla('configuracion');
      const usuariosTabla = dbHelper.tabla('usuarios');

      let fotoUrl = null;
      if (req.file) {
        fotoUrl = `/uploads/admin/${req.file.filename}`;
      }

      // 1. Actualizar Nombre
      if (nombre && nombre.trim()) {
        const existing = await configTabla.selectOne({ where: { clave: 'admin_nombre' } });
        if (existing) {
          await configTabla.updateById({ valor: nombre.trim() }, existing.id);
        } else {
          await configTabla.insert({ clave: 'admin_nombre', valor: nombre.trim() });
        }
      }

      // 2. Actualizar Título / Rol
      if (titulo && titulo.trim()) {
        const existing = await configTabla.selectOne({ where: { clave: 'admin_titulo' } });
        if (existing) {
          await configTabla.updateById({ valor: titulo.trim() }, existing.id);
        } else {
          await configTabla.insert({ clave: 'admin_titulo', valor: titulo.trim() });
        }
      }

      // 3. Actualizar Correo Electrónico
      if (email && email.trim()) {
        const existing = await configTabla.selectOne({ where: { clave: 'admin_email' } });
        if (existing) {
          await configTabla.updateById({ valor: email.trim() }, existing.id);
        } else {
          await configTabla.insert({ clave: 'admin_email', valor: email.trim() });
        }
      }

      // 4. Actualizar Foto
      if (req.body.eliminar_foto === '1' || req.body.eliminar_foto === 'true') {
        const defaultAdminFoto = '/uploads/admin/default-admin.png';
        const existing = await configTabla.selectOne({ where: { clave: 'admin_foto' } });
        if (existing) {
          if (existing.valor && existing.valor.startsWith('/uploads/admin/') && !existing.valor.includes('default-admin')) {
            const oldPath = path.join(__dirname, '..', existing.valor);
            if (fs.existsSync(oldPath)) {
              try { fs.unlinkSync(oldPath); } catch (e) { console.error('Error al borrar foto física de admin:', e); }
            }
          }
          await configTabla.updateById({ valor: defaultAdminFoto }, existing.id);
        } else {
          await configTabla.insert({ clave: 'admin_foto', valor: defaultAdminFoto });
        }
        fotoUrl = defaultAdminFoto;
      } else if (fotoUrl) {
        const existing = await configTabla.selectOne({ where: { clave: 'admin_foto' } });
        if (existing) {
          await configTabla.updateById({ valor: fotoUrl }, existing.id);
        } else {
          await configTabla.insert({ clave: 'admin_foto', valor: fotoUrl });
        }
      }

      // 5. Actualizar en tabla `usuarios`
      const userId = req.user?.id || 1;
      const userUpdateFields = {};
      if (nombre && nombre.trim()) userUpdateFields.nombre = nombre.trim();
      if (titulo && titulo.trim()) userUpdateFields.rol = titulo.trim();
      if (email && email.trim()) userUpdateFields.email = email.trim();
      if (usuario && usuario.trim()) userUpdateFields.usuario = usuario.trim();
      if (req.body.eliminar_foto === '1' || req.body.eliminar_foto === 'true') {
        userUpdateFields.foto = '/uploads/admin/default-admin.png';
      } else if (fotoUrl) {
        userUpdateFields.foto = fotoUrl;
      }

      // 6. Cambio de Contraseña (si se envió una nueva contraseña)
      if (password && password.trim() !== '') {
        const hashedPassword = CryptoJS.SHA256(password.trim()).toString();
        userUpdateFields.password = hashedPassword;
      }

      if (Object.keys(userUpdateFields).length > 0) {
        let existingUser = await usuariosTabla.selectOne({ where: { id: userId } });
        if (existingUser) {
          await usuariosTabla.updateById(userUpdateFields, userId);
        } else {
          // Si no existe por id, buscar por 'admin'
          existingUser = await usuariosTabla.selectOne({ where: { usuario: 'admin' } });
          if (existingUser) {
            await usuariosTabla.updateById(userUpdateFields, existingUser.id);
          }
        }
      }

      // Obtener datos finales
      const finalFoto = fotoUrl || (await configTabla.selectOne({ where: { clave: 'admin_foto' } }))?.valor || req.user?.foto || '/uploads/admin/default-admin.png';
      const finalNombre = (nombre && nombre.trim()) || (await configTabla.selectOne({ where: { clave: 'admin_nombre' } }))?.valor || req.user?.nombre || 'Administrador';
      const finalTitulo = (titulo && titulo.trim()) || (await configTabla.selectOne({ where: { clave: 'admin_titulo' } }))?.valor || req.user?.rol || 'Administrador';
      const finalEmail = (email && email.trim()) || (await configTabla.selectOne({ where: { clave: 'admin_email' } }))?.valor || req.user?.email || 'admin@gmail.com';
      const finalUsuario = (usuario && usuario.trim()) || req.user?.usuario || 'admin';

      // Actualizar el token con los nuevos datos
      const updatedPayload = {
        id: userId,
        usuario: finalUsuario,
        rol: finalTitulo,
        nombre: finalNombre,
        email: finalEmail,
        foto: finalFoto
      };

      const token = jwt.sign(updatedPayload, JWT_SECRET, { expiresIn: '30d' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      return res.json({
        success: true,
        message: 'Perfil de administrador actualizado exitosamente.',
        user: updatedPayload
      });
    } catch (error) {
      console.error('Error al actualizar perfil de administrador:', error);
      return res.status(500).json({ success: false, message: 'Error interno al actualizar perfil.' });
    }
  }
};

module.exports = AdminController;

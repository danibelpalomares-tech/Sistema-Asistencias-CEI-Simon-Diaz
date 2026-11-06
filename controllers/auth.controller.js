const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const dbHelper = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const AuthController = {
  async login(req, res) {
    try {
      const { usuario, password, recordar } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos.' });
      }

      // Hash de la contraseña con CryptoJS según el documento del profesor
      const hashedPassword = CryptoJS.SHA256(password).toString();

      const usuariosTabla = dbHelper.tabla('usuarios');
      
      // Buscar usuario por nombre de usuario o por email
      let user = await usuariosTabla.selectOne({ where: { usuario: usuario } });
      if (!user) {
        user = await usuariosTabla.selectOne({ where: { email: usuario } });
      }

      // Permitir login si coincide el hash o para pruebas si coincide la clave por defecto
      if (!user) {
        // En caso de que sea primer inicio de sesión con admin por defecto
        if ((usuario === 'admin' || usuario === 'admin@gmail.com') && (password === 'admin123' || password === 'admin')) {
          user = {
            id: 1,
            nombre: 'Administrador',
            email: 'admin@gmail.com',
            usuario: 'admin',
            rol: 'Administrador',
            foto: '/uploads/admin/default-admin.png'
          };
        } else {
          return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }
      } else {
        const passMatch = (user.password === hashedPassword) || 
                          (user.password === password) || 
                          ((password === 'admin123' || password === 'admin') && user.usuario === 'admin');
        if (!passMatch) {
          return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
        }
      }

      // Obtener foto y título actualizados si existen en configuración
      const configTabla = dbHelper.tabla('configuracion');
      const adminFotoConfig = await configTabla.selectOne({ where: { clave: 'admin_foto' } });
      const adminNombreConfig = await configTabla.selectOne({ where: { clave: 'admin_nombre' } });
      const adminTituloConfig = await configTabla.selectOne({ where: { clave: 'admin_titulo' } });

      const foto = adminFotoConfig?.valor || user.foto || '/uploads/admin/default-admin.png';
      const nombre = adminNombreConfig?.valor || user.nombre || 'Administrador';
      const rol = adminTituloConfig?.valor || user.rol || 'Administrador';

      const payload = {
        id: user.id,
        nombre: nombre,
        email: user.email,
        usuario: user.usuario,
        rol: rol,
        foto: foto
      };

      const expiresIn = recordar ? '30d' : '24h';
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: recordar ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      };

      res.cookie('token', token, cookieOptions);

      return res.json({
        success: true,
        message: 'Bienvenido al C.E.I. Simón Díaz',
        user: payload,
        redirect: '/inicio'
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ success: false, message: 'Error interno en el servidor.' });
    }
  },

  async logout(req, res) {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Sesión cerrada exitosamente.', redirect: '/' });
  },

  async me(req, res) {
    try {
      const configTabla = dbHelper.tabla('configuracion');
      const adminFotoConfig = await configTabla.selectOne({ where: { clave: 'admin_foto' } });
      const adminNombreConfig = await configTabla.selectOne({ where: { clave: 'admin_nombre' } });

      const user = {
        ...req.user,
        foto: adminFotoConfig?.valor || req.user.foto || '/uploads/admin/default-admin.png',
        nombre: adminNombreConfig?.valor || req.user.nombre || 'Administrador'
      };

      return res.json({ success: true, user });
    } catch (error) {
      return res.json({ success: true, user: req.user });
    }
  }
};

module.exports = AuthController;

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'cei_simon_diaz_super_secure_token_secret_2026';

function verifyToken(req, res, next) {
  let token = req.cookies?.token || req.headers['authorization']?.replace('Bearer ', '');

  // En entorno local/desarrollo, si no hay token aún, autenticar por defecto como Administrador
  if (!token && (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production')) {
    req.user = { id: 1, usuario: 'admin', rol: 'Administrador', nombre: 'Administrador', email: 'admin@gmail.com' };
    return next();
  }

  if (!token) {
    if (req.accepts('html') && !req.originalUrl.startsWith('/api')) {
      return res.redirect('/');
    }
    return res.status(401).json({ success: false, message: 'Acceso no autorizado. Inicie sesión.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    if (req.accepts('html') && !req.originalUrl.startsWith('/api')) {
      return res.redirect('/');
    }
    return res.status(401).json({ success: false, message: 'Sesión expirada o token inválido.' });
  }
}

module.exports = { verifyToken, JWT_SECRET };

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Prevención de caídas por reconexión asíncrona de socket
process.on('uncaughtException', (err) => {
  if (err && (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED'))) {
    return;
  }
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason) => {
  if (reason && (reason.code === 'ECONNREFUSED' || reason.message?.includes('ECONNREFUSED'))) {
    return;
  }
  console.error('Rechazo no manejado:', reason);
});

const { verifyToken } = require('./middleware/auth.middleware');

// Rutas de la API
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const empleadosRoutes = require('./routes/empleados.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const permisosRoutes = require('./routes/permisos.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos de la carpeta public y uploads
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Rutas de API REST
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/reportes', reportesRoutes);

// Vistas Frontend separadas y modulares
app.get('/', (req, res) => {
  // Si ya tiene sesión activa, redirigir a inicio
  const token = req.cookies?.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(token, process.env.JWT_SECRET || 'cei_simon_diaz_super_secure_token_secret_2026');
      return res.redirect('/inicio');
    } catch (e) {
      // Token inválido, continuar al login
    }
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/inicio', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

// Rutas de previsualización directa con auto-autenticación para desarrollo
function setDevTokenIfMissing(req, res) {
  if (!req.cookies?.token) {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('./middleware/auth.middleware');
    const devToken = jwt.sign({ id: 1, usuario: 'admin', rol: 'Administrador' }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', devToken, { httpOnly: true });
  }
}

app.get('/preview-inicio', (req, res) => {
  setDevTokenIfMissing(req, res);
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

app.get('/preview-inicio-dark', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'inicio.html'), 'utf8');
  html = html.replace('<body class="inicio-body">', '<body class="inicio-body dark-mode">');
  res.send(html);
});

app.get('/preview-admin-modal', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'inicio.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { if (typeof openAdminProfileModal === "function") openAdminProfileModal("view"); }, 300);</script></body>');
  res.send(html);
});

app.get('/preview-admin-modal-edit', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'inicio.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { if (typeof openAdminProfileModal === "function") openAdminProfileModal("edit"); }, 300);</script></body>');
  res.send(html);
});

app.get('/preview-empleados', (req, res) => {
  setDevTokenIfMissing(req, res);
  res.sendFile(path.join(__dirname, 'public', 'empleados.html'));
});

// Rutas de prueba visual de modales para verificación de alta fidelidad
app.get('/preview-modal-add', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'empleados.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => openAddModal(), 150);</script></body>');
  res.send(html);
});

app.get('/preview-modal-institucional', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'empleados.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { openAddModal(); switchModalTab("institucional"); }, 150);</script></body>');
  res.send(html);
});

app.get('/preview-modal-view', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'empleados.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => openViewModal(2), 150);</script></body>');
  res.send(html);
});

app.get('/preview-modal-edit', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'empleados.html'), 'utf8');
  html = html.replace('</body>', `<script>
    window.addEventListener('load', () => {
      const poll = setInterval(() => {
        const btn = document.querySelector('button[title="Editar empleado"]');
        if (btn) {
          clearInterval(poll);
          btn.click();
        }
      }, 50);
    });
  </script></body>`);
  res.send(html);
});

app.get('/preview-permisos-view-danibel', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', `<script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const rows = document.querySelectorAll('.permiso-floating-row');
        if (rows.length > 1) {
          const btn = rows[1].querySelector('button[title="Ver detalles"]') || rows[1];
          if (btn) btn.click();
        }
      }, 800);
    });
  </script></body>`);
  res.send(html);
});

app.get('/preview-permisos-edit-danibel', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', `<script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const rows = document.querySelectorAll('.permiso-floating-row');
        if (rows.length > 1) {
          const btn = rows[1].querySelector('button[title="Editar permiso"]');
          if (btn) btn.click();
        }
      }, 800);
    });
  </script></body>`);
  res.send(html);
});

app.get('/preview-modal-view-click', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'empleados.html'), 'utf8');
  html = html.replace('</body>', `
    <script>
      setTimeout(async () => {
        await openViewModal(2);
        setTimeout(() => {
          const btn = document.getElementById('modalBtnPrimary');
          if (btn) btn.click();
        }, 300);
      }, 300);
    </script>
  </body>`);
  res.send(html);
});

app.get('/preview-modal-delete', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'empleados.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => openDeleteConfirmModal(1, "María Pérez", "V-32026099"), 150);</script></body>');
  res.send(html);
});

app.get('/empleados', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'empleados.html'));
});

app.get('/preview-asistencia', (req, res) => {
  setDevTokenIfMissing(req, res);
  res.sendFile(path.join(__dirname, 'public', 'asistencia.html'));
});

app.get('/preview-asistencia-permisos', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'asistencia.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { const sel = document.getElementById("filterEstadoAsistencia"); sel.value = "Permisos"; sel.dispatchEvent(new Event("change")); }, 350);</script></body>');
  res.send(html);
});

app.get('/preview-asistencia-export', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'asistencia.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { document.getElementById("btnExportarTrigger").click(); }, 350);</script></body>');
  res.send(html);
});

app.get('/preview-asistencia-ausentes', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'asistencia.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { const sel = document.getElementById("filterEstadoAsistencia"); sel.value = "Ausentes"; sel.dispatchEvent(new Event("change")); }, 350);</script></body>');
  res.send(html);
});

app.get('/preview-asistencia-dark', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'asistencia.html'), 'utf8');
  html = html.replace('<body class="asistencia-body">', '<body class="asistencia-body dark-mode">');
  res.send(html);
});

app.get('/asistencia', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'asistencia.html'));
});

app.get('/preview-permisos', (req, res) => {
  setDevTokenIfMissing(req, res);
  res.sendFile(path.join(__dirname, 'public', 'permisos.html'));
});

app.get('/preview-permisos-add', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => openAddPermiso(), 300);</script></body>');
  res.send(html);
});

app.get('/preview-permisos-view', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => openViewPermiso(1), 300);</script></body>');
  res.send(html);
});

app.get('/preview-permisos-delete', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => openDeleteModal(1, "María Pérez"), 300);</script></body>');
  res.send(html);
});

app.get('/preview-permisos-add', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => openAddPermiso(), 350);</script></body>');
  res.send(html);
});

app.get('/preview-permisos-view', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { if (typeof openViewPermiso === "function") openViewPermiso(4); }, 400);</script></body>');
  res.send(html);
});

app.get('/preview-permisos-edit', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('</body>', '<script>setTimeout(() => { if (typeof openEditPermiso === "function") openEditPermiso(4); }, 400);</script></body>');
  res.send(html);
});

app.get('/preview-permisos-dark', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'permisos.html'), 'utf8');
  html = html.replace('<body class="permisos-body">', '<body class="permisos-body dark-mode">');
  res.send(html);
});

app.get('/permisos', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'permisos.html'));
});

app.get('/preview-reportes', (req, res) => {
  setDevTokenIfMissing(req, res);
  res.sendFile(path.join(__dirname, 'public', 'reportes.html'));
});

app.get('/preview-reportes-generated', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'reportes.html'), 'utf8');
  html = html.replace('</body>', `<script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.getElementById('inputFechaInicioNative').value = '2026-11-01';
        document.getElementById('inputFechaInicioDisplay').value = '01/11/2026';
        document.getElementById('inputFechaFinNative').value = '2026-11-04';
        document.getElementById('inputFechaFinDisplay').value = '04/11/2026';
        const btn = document.getElementById('btnGenerarReporte');
        if (btn) btn.click();
      }, 150);
    });
  </script></body>`);
  res.send(html);
});

app.get('/preview-reportes-individual', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'reportes.html'), 'utf8');
  html = html.replace('</body>', `<script>
    setTimeout(() => {
      document.getElementById('inputFechaInicioNative').value = '2026-11-01';
      document.getElementById('inputFechaInicioDisplay').value = '01/11/2026';
      document.getElementById('inputFechaFinNative').value = '2026-11-04';
      document.getElementById('inputFechaFinDisplay').value = '04/11/2026';
      const sel = document.getElementById('filterTipoReporte');
      if (sel) {
        sel.value = 'individual';
        sel.dispatchEvent(new Event('change'));
      }
      setTimeout(() => {
        const btn = document.getElementById('btnGenerarReporte');
        if (btn) btn.click();
      }, 200);
    }, 300);
  </script></body>`);
  res.send(html);
});

app.get('/preview-reportes-dark', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'reportes.html'), 'utf8');
  html = html.replace('<body class="reportes-body">', '<body class="reportes-body dark-mode">');
  res.send(html);
});

app.get('/preview-reportes-dark-generated', (req, res) => {
  setDevTokenIfMissing(req, res);
  let html = fs.readFileSync(path.join(__dirname, 'public', 'reportes.html'), 'utf8');
  html = html.replace('<body class="reportes-body">', '<body class="reportes-body dark-mode">');
  html = html.replace('</body>', `<script>
    setTimeout(() => {
      const btn = document.getElementById('btnGenerarReporte');
      if (btn) btn.click();
    }, 300);
  </script></body>`);
  res.send(html);
});

app.get('/reportes', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reportes.html'));
});

// Ruta 404 para URLs no encontradas
app.use((req, res) => {
  if (req.accepts('html')) {
    res.redirect('/inicio');
  } else {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor C.E.I. Simón Díaz en ejecución`);
  console.log(`🌐 Acceso local: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

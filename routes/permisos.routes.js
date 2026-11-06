const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const PermisosController = require('../controllers/permisos.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'justificativos'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `permiso_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', verifyToken, PermisosController.getAll);
router.get('/:id', verifyToken, PermisosController.getById);
router.post('/', verifyToken, upload.single('archivo'), PermisosController.create);
router.put('/:id', verifyToken, upload.single('archivo'), PermisosController.update);
router.delete('/:id', verifyToken, PermisosController.delete);

module.exports = router;

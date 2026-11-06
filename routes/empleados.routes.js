const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const EmpleadosController = require('../controllers/empleados.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'empleados'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `emp_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes.'));
    }
  }
});

router.get('/', verifyToken, EmpleadosController.getAll);
router.get('/:id', verifyToken, EmpleadosController.getById);
router.post('/', verifyToken, upload.single('foto'), EmpleadosController.create);
router.put('/:id', verifyToken, upload.single('foto'), EmpleadosController.update);
router.delete('/:id', verifyToken, EmpleadosController.delete);

module.exports = router;

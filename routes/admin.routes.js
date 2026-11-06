const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const AdminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'admin'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `admin_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (PNG, JPG, JPEG).'));
    }
  }
});

router.get('/profile', verifyToken, AdminController.getProfile);
router.post('/profile', verifyToken, upload.single('foto'), AdminController.updateProfile);

module.exports = router;

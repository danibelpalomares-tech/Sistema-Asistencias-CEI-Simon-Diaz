const express = require('express');
const router = express.Router();
const AsistenciaController = require('../controllers/asistencia.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/registro-rapido', verifyToken, AsistenciaController.registrarByCedula);
router.get('/dashboard-summary', verifyToken, AsistenciaController.getDashboardSummary);
router.get('/', verifyToken, AsistenciaController.getAll);
router.post('/', verifyToken, AsistenciaController.create);
router.put('/:id', verifyToken, AsistenciaController.update);
router.delete('/:id', verifyToken, AsistenciaController.delete);

module.exports = router;

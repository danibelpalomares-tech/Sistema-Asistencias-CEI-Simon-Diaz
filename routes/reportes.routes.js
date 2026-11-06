const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportes.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, ReportesController.getReporte);

module.exports = router;

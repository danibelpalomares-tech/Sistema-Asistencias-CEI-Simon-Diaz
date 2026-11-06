const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', verifyToken, AuthController.me);

module.exports = router;

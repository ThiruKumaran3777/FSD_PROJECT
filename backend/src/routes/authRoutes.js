const express = require('express');
const { signup, login, getMe, logout, deleteMe, updateMe } = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authRequired, getMe);
router.put('/me', authRequired, updateMe);
router.post('/logout', authRequired, logout);
router.delete('/me', authRequired, deleteMe);

module.exports = router;


const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me, registerValidators, loginValidators } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true });

router.post('/register', limiter, registerValidators, register);
router.post('/login', limiter, loginValidators, login);
router.get('/me', auth, me);

module.exports = router;

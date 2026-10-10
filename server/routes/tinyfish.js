const express = require('express');
const { auth } = require('../middleware/auth');
const { searchExternal } = require('../controllers/tinyfishController');

const router = express.Router();

router.post('/search', auth, searchExternal);

module.exports = router;
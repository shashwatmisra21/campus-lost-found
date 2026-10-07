const express = require('express');
const { createClaim, myClaims, getClaim } = require('../controllers/claimController');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.post('/', auth, upload.single('evidence'), createClaim);
router.get('/my', auth, myClaims);
router.get('/:id', auth, getClaim);

module.exports = router;

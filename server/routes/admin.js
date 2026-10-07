const express = require('express');
const {
  listClaims,
  listItems,
  approveClaim,
  rejectClaim,
  markReturned,
  removeItem,
} = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(auth, adminOnly);

router.get('/claims', listClaims);
router.get('/items', listItems);
router.put('/claims/:id/approve', approveClaim);
router.put('/claims/:id/reject', rejectClaim);
router.put('/items/:id/returned', markReturned);
router.put('/items/:id/close', removeItem);

module.exports = router;

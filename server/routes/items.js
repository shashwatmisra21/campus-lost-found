const express = require('express');
const {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  myItems,
  itemMatches,
  myMatches,
  claimQuestions,
  meta,
  itemValidators,
} = require('../controllers/itemController');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.get('/meta', meta);
router.get('/mine', auth, myItems);
router.get('/matches/mine', auth, myMatches);
router.get('/', listItems);
router.get('/:id/matches', auth, itemMatches);
router.get('/:id/claim-questions', auth, claimQuestions);
router.get('/:id', getItem);
router.post('/', auth, upload.single('image'), itemValidators, createItem);
router.put('/:id', auth, upload.single('image'), updateItem);
router.delete('/:id', auth, deleteItem);

module.exports = router;

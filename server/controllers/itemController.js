const { body, query, validationResult } = require('express-validator');
const Item = require('../models/Item');
const { toPublicItem, CATEGORIES } = require('../models/Item');
const { uploadImage } = require('../services/imageService');
const { findMatchesForItem, findMatchesForUser } = require('../services/matchingService');
const { CLAIM_QUESTIONS } = require('../services/claimVerificationService');
const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');

const itemValidators = [
  body('type').isIn(['lost', 'found']),
  body('title').trim().isLength({ min: 2, max: 120 }),
  body('category').isIn(CATEGORIES),
  body('description').trim().isLength({ min: 8, max: 2000 }),
  body('date').notEmpty(),
  body('location').trim().notEmpty(),
];

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fail(res, errors.array()[0].msg, 400, { details: errors.array() });
    return false;
  }
  return true;
}

function parsePrivate(body) {
  return {
    uniqueMarks: body.uniqueMarks || body.privateUniqueMarks || '',
    contents: body.contents || body.privateContents || '',
    hiddenDetails: body.hiddenDetails || body.privateHiddenDetails || '',
    extraNotes: body.extraNotes || body.privateExtraNotes || '',
  };
}

const listItems = asyncHandler(async (req, res) => {
  const { type, category, location, status, keyword, from, to } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (location) filter.location = new RegExp(location, 'i');
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (keyword) {
    filter.$or = [
      { title: new RegExp(keyword, 'i') },
      { description: new RegExp(keyword, 'i') },
      { publicFeatures: new RegExp(keyword, 'i') },
      { location: new RegExp(keyword, 'i') },
      { brand: new RegExp(keyword, 'i') },
      { color: new RegExp(keyword, 'i') },
    ];
  }

  const items = await Item.find(filter)
    .populate('reporter', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

  return ok(res, { items: items.map(toPublicItem) });
});

const getItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate('reporter', 'name');
  if (!item) return fail(res, 'Item not found', 404);
  return ok(res, { item: toPublicItem(item) });
});

const createItem = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const imageUrl = req.file ? await uploadImage(req.file) : req.body.imageUrl || '';
  const item = await Item.create({
    type: req.body.type,
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    date: req.body.date,
    approximateTime: req.body.approximateTime || '',
    location: req.body.location,
    color: req.body.color || '',
    brand: req.body.brand || '',
    publicFeatures: req.body.publicFeatures || '',
    contactPreference: req.body.contactPreference || 'in-app',
    storageInfo: req.body.storageInfo || '',
    imageUrl,
    reporter: req.user._id,
    privateVerificationData: parsePrivate(req.body),
  });

  const matches = await findMatchesForItem(item);
  if (matches.length && item.type === 'lost') {
    item.status = 'matched';
    item.matchedItem = matches[0].item.id;
    await item.save();
  }

  return ok(
    res,
    {
      item: toPublicItem(item),
      matches,
    },
    201
  );
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return fail(res, 'Item not found', 404);
  const isOwner = String(item.reporter) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') return fail(res, 'Not allowed', 403);

  const allowed = [
    'title',
    'category',
    'description',
    'date',
    'approximateTime',
    'location',
    'color',
    'brand',
    'publicFeatures',
    'contactPreference',
    'storageInfo',
    'status',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });
  if (req.file) item.imageUrl = await uploadImage(req.file);
  if (isOwner) {
    item.privateVerificationData = {
      ...item.privateVerificationData,
      ...parsePrivate(req.body),
    };
  }
  await item.save();
  return ok(res, { item: toPublicItem(item) });
});

const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return fail(res, 'Item not found', 404);
  const isOwner = String(item.reporter) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') return fail(res, 'Not allowed', 403);
  await item.deleteOne();
  return ok(res, { message: 'Item removed' });
});

const myItems = asyncHandler(async (req, res) => {
  const items = await Item.find({ reporter: req.user._id }).sort({ createdAt: -1 });
  return ok(res, { items: items.map(toPublicItem) });
});

const itemMatches = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return fail(res, 'Item not found', 404);
  const matches = await findMatchesForItem(item);
  return ok(res, { matches });
});

const myMatches = asyncHandler(async (req, res) => {
  const matches = await findMatchesForUser(req.user._id);
  return ok(res, { matches });
});

const claimQuestions = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return fail(res, 'Item not found', 404);
  if (item.type !== 'found') return fail(res, 'Claims can only be submitted for found items', 400);
  return ok(res, { questions: CLAIM_QUESTIONS });
});

const meta = (req, res) => {
  return ok(res, {
    categories: CATEGORIES,
    locations: [
      'Central Library',
      'Block A',
      'Block B',
      'Cafeteria',
      'Sports Complex',
      'Hostel',
      'Parking Lot',
      'Auditorium',
      'Lab Complex',
      'Main Gate',
    ],
  });
};

module.exports = {
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
};

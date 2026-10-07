const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');

const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional({ values: 'falsy' }).trim(),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fail(res, errors.array()[0].msg, 400, { details: errors.array() });
    return false;
  }
  return true;
}

const register = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const { name, email, password, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return fail(res, 'An account with that email already exists', 409);

  const user = await User.create({ name, email, password, phone: phone || '' });
  const token = signToken(user);
  return ok(res, { user: user.toSafeJSON(), token }, 201);
});

const login = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return fail(res, 'Invalid email or password', 401);
  }
  const token = signToken(user);
  return ok(res, { user: user.toSafeJSON(), token });
});

const me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toSafeJSON() });
});

module.exports = { register, login, me, registerValidators, loginValidators };

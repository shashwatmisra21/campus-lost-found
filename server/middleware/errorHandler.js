const { fail } = require('../utils/apiResponse');

function notFound(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.name === 'MulterError') {
    return fail(res, err.message, 400);
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return fail(res, 'Validation failed', 400, { details });
  }

  if (err.code === 11000) {
    return fail(res, 'A record with that unique value already exists', 409);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return fail(res, 'Invalid or expired token', 401);
  }

  console.error(err);
  return fail(res, err.message || 'Server error', err.status || 500);
}

module.exports = { notFound, errorHandler };

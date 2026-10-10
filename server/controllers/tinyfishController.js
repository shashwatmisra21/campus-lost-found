const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');
const { searchExternalItems } = require('../services/tinyfishService');

const searchExternal = asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (typeof query !== 'string' || query.trim().length < 3) {
    return fail(res, 'Enter a search query of at least 3 characters.', 400);
  }

  if (query.length > 300) {
    return fail(res, 'Search query is too long.', 400);
  }

  const results = await searchExternalItems(query);

  return ok(res, {
    results,
    count: results.length,
  });
});

module.exports = { searchExternal };
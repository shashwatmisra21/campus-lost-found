const Claim = require('../models/Claim');
const Item = require('../models/Item');
const { toPublicItem } = require('../models/Item');
const { evaluateClaim } = require('../services/claimVerificationService');
const { uploadImage } = require('../services/imageService');
const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');

// Prepare a safe claim response.
function claimPayload(claim) {
  const obj = claim.toObject ? claim.toObject() : { ...claim };
  obj.id = obj._id;

  const sanitizeItem = (source) => {
    if (!source || typeof source !== 'object') {
      return source;
    }

    const item = source.privateVerificationData
      ? toPublicItem(source)
      : { ...source };

    if (item.reporter && typeof item.reporter === 'object') {
      item.reporter = {
        _id: item.reporter._id,
        name: item.reporter.name,
      };
    }

    return item;
  };

  return {
    id: obj._id,
    claimant: obj.claimant,
    item: sanitizeItem(obj.item),
    lostItem: sanitizeItem(obj.lostItem),
    answers: obj.answers,
    evidenceUrl: obj.evidenceUrl,
    confidenceScore: obj.confidenceScore,
    riskLevel: obj.riskLevel,
    matchedFields: obj.matchedFields,
    suspiciousFields: obj.suspiciousFields,
    status: obj.status,
    adminNotes: obj.adminNotes,
    createdAt: obj.createdAt,
  };
}

// Create a new claim.
const createClaim = asyncHandler(async (req, res) => {
  const foundItem = await Item.findById(
    req.body.itemId || req.body.item
  );

  if (!foundItem) {
    return fail(res, 'Found item not found', 404);
  }

  if (foundItem.type !== 'found') {
    return fail(res, 'You can only claim a found item', 400);
  }

  if (['claimed', 'returned', 'closed'].includes(foundItem.status)) {
    return fail(res, 'This item is no longer available to claim', 400);
  }

  if (String(foundItem.reporter) === String(req.user._id)) {
    return fail(res, 'You cannot claim an item you reported as found', 400);
  }

  const existing = await Claim.findOne({
    claimant: req.user._id,
    item: foundItem._id,
    status: { $in: ['pending', 'under_review', 'suspicious'] },
  });

  if (existing) {
    return fail(res, 'You already have an open claim on this item', 409);
  }

  const answers = {
    uniqueMarks: req.body.uniqueMarks || '',
    contents: req.body.contents || '',
    hiddenDetails: req.body.hiddenDetails || '',
    extraNotes: req.body.extraNotes || '',
  };

  const evaluation = evaluateClaim({
    privateVerificationData: foundItem.privateVerificationData,
    answers,
  });

  const evidenceUrl = req.file
    ? await uploadImage(req.file)
    : req.body.evidenceUrl || '';

  const claim = await Claim.create({
    claimant: req.user._id,
    item: foundItem._id,
    lostItem: req.body.lostItemId || null,
    answers,
    evidenceUrl,
    confidenceScore: evaluation.score,
    riskLevel: evaluation.riskLevel,
    matchedFields: evaluation.matchedFields,
    suspiciousFields: evaluation.suspiciousFields,
    status: evaluation.suggestedStatus,
  });

  foundItem.status = 'claim_pending';
  await foundItem.save();

  if (req.body.lostItemId) {
    await Item.findByIdAndUpdate(req.body.lostItemId, {
      status: 'matched',
      matchedItem: foundItem._id,
    });
  }

  const populated = await Claim.findById(claim._id)
    .populate('item')
    .populate('claimant', 'name email');

  return ok(
    res,
    {
      claim: claimPayload(populated),
      evaluation: {
        score: evaluation.score,
        riskLevel: evaluation.riskLevel,
        matchedFields: evaluation.matchedFields,
        suspiciousFields: evaluation.suspiciousFields,
      },
    },
    201
  );
});

// Get claims submitted by the user OR linked to their lost-item reports.
const myClaims = asyncHandler(async (req, res) => {
  const lostItems = await Item.find({
    reporter: req.user._id,
    type: 'lost',
  }).select('_id');

  const lostItemIds = lostItems.map((item) => item._id);

  const claims = await Claim.find({
    $or: [
      { claimant: req.user._id },
      { lostItem: { $in: lostItemIds } },
    ],
  })
    .populate('item')
    .populate('claimant', 'name')
    .populate('lostItem')
    .sort({ createdAt: -1 });

  const result = await Promise.all(
    claims.map(async (claim) => {
      const payload = claimPayload(claim);

      const isClaimant =
        String(claim.claimant?._id || claim.claimant) ===
        String(req.user._id);

      const isLostItemReporter =
        claim.lostItem &&
        String(claim.lostItem.reporter) === String(req.user._id);

      // Only approved claims can reveal contact information.
      if (
        claim.status === 'approved' &&
        isClaimant &&
        claim.item
      ) {
        const itemId = claim.item._id || claim.item;

        const foundItem = await Item.findById(itemId)
          .populate('reporter', 'name email');

        if (foundItem?.reporter) {
          payload.reporterContact = {
            name: foundItem.reporter.name,
            email: foundItem.reporter.email,
          };
        }
      }

      // A lost-item reporter can see the outcome of their linked claim,
      // but does not automatically receive the found reporter's email here.
      if (isLostItemReporter) {
        payload.lostItemStatus = claim.lostItem.status;
      }

      return payload;
    })
  );

  return ok(res, { claims: result });
});

// Get one claim.
// Only the claimant or an admin can access it.
const getClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id)
    .populate('item')
    .populate('claimant', 'name email')
    .populate('lostItem');

  if (!claim) {
    return fail(res, 'Claim not found', 404);
  }

  const claimantId = claim.claimant?._id || claim.claimant;

  const isOwner =
    String(claimantId) === String(req.user._id);

  const isAdmin = req.user.role === 'admin';

  const isLostItemReporter =
    claim.lostItem &&
    String(claim.lostItem.reporter) === String(req.user._id);

  if (!isOwner && !isAdmin && !isLostItemReporter) {
    return fail(res, 'Not allowed', 403);
  }

  const payload = claimPayload(claim);

  if (claim.status === 'approved' && (isOwner || isAdmin)) {
    const itemId = claim.item?._id || claim.item;

    const foundItem = await Item.findById(itemId)
      .populate('reporter', 'name email');

    if (foundItem?.reporter) {
      payload.reporterContact = {
        name: foundItem.reporter.name,
        email: foundItem.reporter.email,
      };
    }
  }

  return ok(res, { claim: payload });
});

module.exports = {
  createClaim,
  myClaims,
  getClaim,
  claimPayload,
};
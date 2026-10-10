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

  const item =
    obj.item && obj.item.privateVerificationData
      ? toPublicItem(obj.item)
      : obj.item;

  // Remove the reporter's email from the general item response.
  if (item && typeof item === 'object' && item.reporter) {
    if (typeof item.reporter === 'object') {
      item.reporter = {
        _id: item.reporter._id,
        name: item.reporter.name,
      };
    }
  }

  // Also prevent reporter-email exposure through a populated lost item.
  const lostItem =
    obj.lostItem && obj.lostItem.privateVerificationData
      ? toPublicItem(obj.lostItem)
      : obj.lostItem;

  if (lostItem && typeof lostItem === 'object' && lostItem.reporter) {
    if (typeof lostItem.reporter === 'object') {
      lostItem.reporter = {
        _id: lostItem.reporter._id,
        name: lostItem.reporter.name,
      };
    }
  }

  return {
    id: obj._id,
    claimant: obj.claimant,
    item,
    lostItem,
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

// Get the current user's claims.
// Reporter contact details are included only for approved claims.
const myClaims = asyncHandler(async (req, res) => {
  const claims = await Claim.find({
    claimant: req.user._id,
  })
    .populate('item')
    .sort({ createdAt: -1 });

  const result = await Promise.all(
    claims.map(async (claim) => {
      const payload = claimPayload(claim);

      if (claim.status === 'approved' && claim.item) {
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
    .populate('claimant', 'name email');

  if (!claim) {
    return fail(res, 'Claim not found', 404);
  }

  const claimantId = claim.claimant?._id || claim.claimant;

  const isOwner =
    String(claimantId) === String(req.user._id);

  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return fail(res, 'Not allowed', 403);
  }

  const payload = claimPayload(claim);

  // Only approved claims reveal the found-item reporter's contact details.
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
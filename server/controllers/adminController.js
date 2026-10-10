const Claim = require('../models/Claim');
const Item = require('../models/Item');
const { sendClaimApprovedEmail } = require('../services/emailService');
const { toPublicItem } = require('../models/Item');
const { claimPayload } = require('./claimController');
const asyncHandler = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/apiResponse');

const listClaims = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};

  if (status) filter.status = status;

  const claims = await Claim.find(filter)
    .populate('item')
    .populate('claimant', 'name email')
    .sort({ createdAt: -1 });

  return ok(res, {
    claims: claims.map(claimPayload),
  });
});

const listItems = asyncHandler(async (req, res) => {
  const items = await Item.find()
    .populate('reporter', 'name email')
    .sort({ createdAt: -1 });

  return ok(res, {
    items: items.map(toPublicItem),
  });
});

async function resolveLinkedLost(foundItem, recovered) {
  if (!foundItem) return;

  const linked = await Item.find({
    type: 'lost',
    $or: [
      { matchedItem: foundItem._id },
      { title: foundItem.title, category: foundItem.category },
    ],
    status: { $in: ['lost', 'matched'] },
  });

  await Promise.all(
    linked.map((lost) => {
      lost.status = recovered ? 'recovered' : lost.status;
      return lost.save();
    })
  );
}

const approveClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id).populate('item');

  if (!claim) {
    return fail(res, 'Claim not found', 404);
  }

  claim.status = 'approved';
  claim.adminNotes = req.body.adminNotes || claim.adminNotes;
  claim.reviewedBy = req.user._id;

  await claim.save();

  const itemId = claim.item?._id || claim.item;
  const item = await Item.findById(itemId);

  if (!item) {
    return fail(res, 'Found item not found', 404);
  }

  item.status = 'returned';
  await item.save();

  let lostItem = null;

  // Update only the explicitly linked lost-item report.
  if (claim.lostItem) {
    lostItem = await Item.findOne({
      _id: claim.lostItem,
      type: 'lost',
    });

    if (lostItem) {
      lostItem.status = 'recovered';
      lostItem.matchedItem = item._id;
      await lostItem.save();
    }
  }

  // Close other open claims on this found item.
  await Claim.updateMany(
    {
      item: item._id,
      _id: { $ne: claim._id },
      status: { $in: ['pending', 'under_review', 'suspicious'] },
    },
    {
      status: 'rejected',
      adminNotes: 'Closed because another claim was approved.',
    }
  );

  // Fetch the approved claim with the claimant's name.
  const populated = await Claim.findById(claim._id)
    .populate('item')
    .populate('claimant', 'name email');

  // Send the notification to the person who reported the lost item.
  // Do not send email to the claimant by mistake.
  if (lostItem) {
    try {
      const lostReporterId = lostItem.reporter;

      const lostReporter = await require('../models/User').findById(
        lostReporterId
      ).select('name email');

      const foundItem = await Item.findById(item._id)
        .populate('reporter', 'name email');

      if (lostReporter?.email && foundItem?.reporter?.email) {
        await sendClaimApprovedEmail({
          recipientEmail: lostReporter.email,
          recipientName: lostReporter.name,
          foundItemTitle: foundItem.title,
          reporterName: foundItem.reporter.name,
          reporterEmail: foundItem.reporter.email,
        });

        console.log(
          'Claim approval email sent to lost-item reporter:',
          lostReporter.email
        );
      } else {
        console.warn(
          'Claim approved, but one or more email addresses were unavailable.'
        );
      }
    } catch (emailError) {
      // An email failure must not undo an approved claim.
      console.error(
        'Failed to send claim approval email:',
        emailError.message
      );
    }
  } else {
    console.warn(
      'Claim approved without an explicitly linked lost-item report; no notification sent.'
    );
  }

  return ok(res, {
    claim: claimPayload(populated),
  });
});

const rejectClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);

  if (!claim) {
    return fail(res, 'Claim not found', 404);
  }

  claim.status = 'rejected';
  claim.adminNotes = req.body.adminNotes || 'Rejected by moderator.';
  claim.reviewedBy = req.user._id;

  await claim.save();

  const open = await Claim.countDocuments({
    item: claim.item,
    status: { $in: ['pending', 'under_review', 'suspicious'] },
  });

  if (!open) {
    await Item.findByIdAndUpdate(claim.item, {
      status: 'found',
    });
  }

  const populated = await Claim.findById(claim._id)
    .populate('item')
    .populate('claimant', 'name email');

  return ok(res, {
    claim: claimPayload(populated),
  });
});

const markReturned = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return fail(res, 'Item not found', 404);
  }

  if (item.type === 'found') {
    item.status = 'returned';
    await resolveLinkedLost(item, true);
  } else {
    item.status = 'recovered';
  }

  await item.save();

  return ok(res, {
    item: toPublicItem(item),
  });
});

const removeItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (!item) {
    return fail(res, 'Item not found', 404);
  }

  item.status = 'closed';
  await item.save();

  return ok(res, {
    item: toPublicItem(item),
    message: 'Report closed',
  });
});

module.exports = {
  listClaims,
  listItems,
  approveClaim,
  rejectClaim,
  markReturned,
  removeItem,
};
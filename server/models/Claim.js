const mongoose = require('mongoose');

const CLAIM_STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'suspicious'];

const claimSchema = new mongoose.Schema(
  {
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    lostItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
    answers: {
      uniqueMarks: { type: String, default: '' },
      contents: { type: String, default: '' },
      hiddenDetails: { type: String, default: '' },
      extraNotes: { type: String, default: '' },
    },
    evidenceUrl: { type: String, default: '' },
    confidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ['strong', 'likely', 'needs_review', 'suspicious'],
      default: 'needs_review',
    },
    matchedFields: [{ type: String }],
    suspiciousFields: [{ type: String }],
    status: { type: String, enum: CLAIM_STATUSES, default: 'pending' },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

claimSchema.index({ claimant: 1, createdAt: -1 });
claimSchema.index({ item: 1, status: 1 });

module.exports = mongoose.model('Claim', claimSchema);
module.exports.CLAIM_STATUSES = CLAIM_STATUSES;

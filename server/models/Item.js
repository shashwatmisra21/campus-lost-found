const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Wallet & IDs',
  'Keys',
  'Bags',
  'Clothing',
  'Books',
  'Accessories',
  'Documents',
  'Other',
];

const LOST_STATUSES = ['lost', 'matched', 'recovered', 'closed'];
const FOUND_STATUSES = ['found', 'claim_pending', 'claimed', 'returned', 'closed'];

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['lost', 'found'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    date: { type: Date, required: true },
    approximateTime: { type: String, default: '', trim: true },
    location: { type: String, required: true, trim: true },
    color: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    publicFeatures: { type: String, default: '', trim: true, maxlength: 1000 },
    contactPreference: { type: String, default: 'in-app', trim: true },
    storageInfo: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '' },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true },
    privateVerificationData: {
      uniqueMarks: { type: String, default: '' },
      contents: { type: String, default: '' },
      hiddenDetails: { type: String, default: '' },
      extraNotes: { type: String, default: '' },
    },
    matchedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  },
  { timestamps: true }
);

itemSchema.pre('validate', function setDefaultStatus() {
  if (!this.status) {
    this.status = this.type === 'lost' ? 'lost' : 'found';
  }
});

itemSchema.index({ type: 1, status: 1, category: 1, date: -1 });
itemSchema.index({ title: 'text', description: 'text', location: 'text', publicFeatures: 'text' });

function publicItem(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj.privateVerificationData;
  obj.id = obj._id;
  return obj;
}

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.LOST_STATUSES = LOST_STATUSES;
module.exports.FOUND_STATUSES = FOUND_STATUSES;
module.exports.toPublicItem = publicItem;

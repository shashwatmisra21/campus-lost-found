const Item = require('../models/Item');
const { includesScore, daysBetween } = require('../utils/text');

const WEIGHTS = {
  category: 20,
  name: 20,
  color: 10,
  brand: 10,
  location: 15,
  date: 10,
  description: 10,
  image: 5,
};

const MATCH_THRESHOLD = 50;

function dateScore(lostDate, foundDate) {
  const days = daysBetween(lostDate, foundDate);
  if (!Number.isFinite(days)) return 0;
  if (days <= 1) return 1;
  if (days <= 3) return 0.8;
  if (days <= 7) return 0.5;
  if (days <= 14) return 0.25;
  return 0;
}

function scorePair(lost, found) {
  const breakdown = {
    category: lost.category === found.category ? WEIGHTS.category : 0,
    name: Math.round(includesScore(lost.title, found.title) * WEIGHTS.name),
    color: Math.round(includesScore(lost.color, found.color) * WEIGHTS.color),
    brand: Math.round(includesScore(lost.brand, found.brand) * WEIGHTS.brand),
    location: Math.round(includesScore(lost.location, found.location) * WEIGHTS.location),
    date: Math.round(dateScore(lost.date, found.date) * WEIGHTS.date),
    description: Math.round(
      includesScore(
        `${lost.description} ${lost.publicFeatures}`,
        `${found.description} ${found.publicFeatures}`
      ) * WEIGHTS.description
    ),
    image: lost.imageUrl && found.imageUrl ? WEIGHTS.image : 0,
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { score: Math.min(100, score), breakdown };
}

async function findMatchesForItem(item, { threshold = MATCH_THRESHOLD } = {}) {
  if (!item) return [];

  const oppositeType = item.type === 'lost' ? 'found' : 'lost';
  const openStatuses =
    oppositeType === 'found'
      ? ['found', 'claim_pending']
      : ['lost', 'matched'];

  const candidates = await Item.find({
    type: oppositeType,
    status: { $in: openStatuses },
    _id: { $ne: item._id },
  }).populate('reporter', 'name email');

  return candidates
    .map((candidate) => {
      const pair = item.type === 'lost' ? [item, candidate] : [candidate, item];
      const { score, breakdown } = scorePair(pair[0], pair[1]);
      return {
        item: require('../models/Item').toPublicItem(candidate),
        score,
        percent: score,
        breakdown,
        label: 'Potential Match — system recommendation, not proof of ownership',
      };
    })
    .filter((entry) => entry.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

async function findMatchesForUser(userId) {
  const lostItems = await Item.find({
    reporter: userId,
    type: 'lost',
    status: { $in: ['lost', 'matched'] },
  });

  const results = [];
  for (const lost of lostItems) {
    const matches = await findMatchesForItem(lost);
    matches.forEach((match) => {
      results.push({
        lostItem: require('../models/Item').toPublicItem(lost),
        foundItem: match.item,
        score: match.score,
        percent: match.score,
        breakdown: match.breakdown,
        label: match.label,
      });
    });
  }
  return results.sort((a, b) => b.score - a.score);
}

module.exports = {
  WEIGHTS,
  MATCH_THRESHOLD,
  scorePair,
  findMatchesForItem,
  findMatchesForUser,
};

const { includesScore, tokens } = require('../utils/text');

const FIELDS = [
  { key: 'uniqueMarks', label: 'Unique marks' },
  { key: 'contents', label: 'Contents / accessories' },
  { key: 'hiddenDetails', label: 'Hidden details' },
  { key: 'extraNotes', label: 'Other ownership details' },
];

function fieldScore(expected, provided) {
  const expectedTokens = tokens(expected);
  if (!expectedTokens.length) return { score: null, skipped: true };
  const providedTokens = tokens(provided);
  if (!providedTokens.length) return { score: 0, skipped: false };

  const similarity = includesScore(expected, provided);
  let bonus = 0;
  expectedTokens.forEach((token) => {
    if (token.length >= 4 && providedTokens.includes(token)) bonus += 0.05;
  });
  return { score: Math.min(1, similarity + bonus), skipped: false };
}

function riskFromScore(score) {
  if (score >= 90) return 'strong';
  if (score >= 70) return 'likely';
  if (score >= 50) return 'needs_review';
  return 'suspicious';
}

function statusFromRisk(risk) {
  if (risk === 'suspicious') return 'suspicious';
  if (risk === 'needs_review') return 'under_review';
  return 'pending';
}

function evaluateClaim({ privateVerificationData = {}, answers = {} }) {
  const matchedFields = [];
  const suspiciousFields = [];
  const scored = [];

  FIELDS.forEach(({ key, label }) => {
    const result = fieldScore(privateVerificationData[key], answers[key]);
    if (result.skipped) return;
    scored.push(result.score);
    if (result.score >= 0.55) matchedFields.push(label);
    else suspiciousFields.push(label);
  });

  const average = scored.length
    ? scored.reduce((sum, value) => sum + value, 0) / scored.length
    : 0;
  const score = Math.round(average * 100);
  const riskLevel = riskFromScore(score);

  return {
    score,
    riskLevel,
    matchedFields,
    suspiciousFields,
    suggestedStatus: statusFromRisk(riskLevel),
  };
}

const CLAIM_QUESTIONS = [
  {
    key: 'uniqueMarks',
    prompt: 'What unique marks, scratches, stickers, or wear does the item have?',
  },
  {
    key: 'contents',
    prompt: 'What was inside the item, or what accessories came with it?',
  },
  {
    key: 'hiddenDetails',
    prompt:
      'Describe a hidden detail only the owner would know (wallpaper, engraving, lock screen, nickname, etc.).',
  },
  {
    key: 'extraNotes',
    prompt: 'Any other ownership details (serial fragment, cash amount, case design, etc.)?',
  },
];

module.exports = {
  evaluateClaim,
  CLAIM_QUESTIONS,
  riskFromScore,
};

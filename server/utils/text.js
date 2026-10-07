function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value = '') {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 1);
}

function jaccard(a, b) {
  const setA = new Set(tokens(a));
  const setB = new Set(tokens(b));
  if (!setA.size || !setB.size) return 0;
  let overlap = 0;
  setA.forEach((token) => {
    if (setB.has(token)) overlap += 1;
  });
  return overlap / new Set([...setA, ...setB]).size;
}

function includesScore(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  return jaccard(a, b);
}

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return Infinity;
  const ms = Math.abs(new Date(dateA) - new Date(dateB));
  return ms / (1000 * 60 * 60 * 24);
}

module.exports = { normalize, tokens, jaccard, includesScore, daysBetween };

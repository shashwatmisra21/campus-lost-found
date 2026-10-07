export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function assetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return url;
}

export function statusLabel(status) {
  return String(status || '').replaceAll('_', ' ');
}

export function scoreTone(score) {
  if (score >= 90) return 'text-accent';
  if (score >= 70) return 'text-accent';
  if (score >= 50) return 'text-warn';
  return 'text-danger';
}

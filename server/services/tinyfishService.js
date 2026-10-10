const TINYFISH_API_URL = 'https://api.search.tinyfish.ai';

async function searchExternalItems(query) {
  const apiKey = process.env.TINYFISH_API_KEY;

  if (!apiKey) {
    throw new Error('TinyFish API key is not configured.');
  }

  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    throw new Error('Please provide a search query of at least 3 characters.');
  }

  const url = new URL(TINYFISH_API_URL);
  url.searchParams.set('query', query.trim());

  const response = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('TinyFish API error:', response.status);

    throw new Error(
      response.status === 429
        ? 'External search is temporarily rate-limited. Please try again later.'
        : 'External search is temporarily unavailable.'
    );
  }

  return (data.results || []).map((result) => ({
    title: result.title || 'Untitled result',
    url: result.url,
    siteName: result.site_name || '',
    snippet: result.snippet || '',
  }));
}

module.exports = { searchExternalItems };
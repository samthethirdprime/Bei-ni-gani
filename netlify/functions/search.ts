import { searchAggregator } from '../../server/providers/searchAggregator';
import { formatSearchResponse } from '../../server/providers/types';

export async function handler(event: any) {
  // Only allow POST or GET
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let query = '';
    let location = 'Kenya';
    let category = 'all';

    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      query = body.query || '';
      location = body.county || body.location || 'Kenya';
      category = body.category || 'all';
    } else {
      const params = event.queryStringParameters || {};
      query = params.q || params.query || '';
      location = params.county || params.location || 'Kenya';
      category = params.category || 'all';
    }

    if (!query || !query.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Search query is required' })
      };
    }

    const rawResult = await searchAggregator.searchAll(query, { location, category });
    const formattedResult = formatSearchResponse(rawResult, query, location, category);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800'
      },
      body: JSON.stringify(formattedResult)
    };
  } catch (error: any) {
    console.error('[Netlify Function /api/search] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verified: false,
        hasLiveResults: false,
        product: null,
        items: [],
        results: [],
        totalCount: 0,
        sources: [],
        providersStatus: [],
        message: 'Internal search engine error'
      })
    };
  }
}

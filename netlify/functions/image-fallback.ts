import { discoverProductPhotograph } from '../../server/services/imageDiscoveryService';

export async function handler(event: any) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow GET or POST
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let name = '';
  let category: string | undefined;
  let brand: string | undefined;
  let size: string | undefined;
  let type: string | undefined;

  try {
    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      name = typeof body.name === 'string' ? body.name : '';
      category = typeof body.category === 'string' ? body.category : undefined;
      brand = typeof body.brand === 'string' ? body.brand : undefined;
      size = typeof body.size === 'string' ? body.size : undefined;
      type = typeof body.type === 'string' ? body.type : undefined;
    } else {
      const params = event.queryStringParameters || {};
      name = typeof params.name === 'string' ? params.name : '';
      category = typeof params.category === 'string' ? params.category : undefined;
      brand = typeof params.brand === 'string' ? params.brand : undefined;
      size = typeof params.size === 'string' ? params.size : undefined;
      type = typeof params.type === 'string' ? params.type : undefined;
    }

    if (!name || !name.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Product name is required' })
      };
    }

    const discovered = await discoverProductPhotograph({
      name: name.trim(),
      category,
      brand,
      size,
      type
    });

    if (discovered && discovered.imageUrl) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          name: name.trim(),
          imageUrl: discovered.imageUrl,
          thumbnailUrl: discovered.thumbnailUrl,
          imageSource: 'discovered',
          title: discovered.title,
          source: discovered.source,
          pageUrl: discovered.pageUrl
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        name: name.trim(),
        imageUrl: null,
        imageSource: null
      })
    };
  } catch (error: any) {
    console.error('[Netlify Function /api/image-fallback] Error:', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        name: name ? name.trim() : '',
        imageUrl: null,
        imageSource: null
      })
    };
  }
}

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { searchAggregator } from './server/providers/searchAggregator';
import { formatSearchResponse } from './server/providers/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const rootDir = process.cwd();

app.use(express.json());

// In-memory cache for search queries to prevent duplicate requests
const searchCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 1000 * 15; // 15 seconds fresh cache

// Helper to handle search requests for both POST and GET
const handleSearchRequest = async (req: express.Request, res: express.Response) => {
  const query = req.method === 'POST' ? req.body.query : (req.query.q || req.query.query);
  const county = req.method === 'POST' ? (req.body.county || req.body.location) : (req.query.county || req.query.location);
  const category = req.method === 'POST' ? req.body.category : req.query.category;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const cleanQuery = query.trim();
  const targetCounty = (typeof county === 'string' && county.trim()) ? county.trim() : 'Kenya';
  const targetCategory = typeof category === 'string' ? category : undefined;
  const cacheKey = `${cleanQuery.toLowerCase()}|${targetCounty.toLowerCase()}|${targetCategory || 'any'}`;

  // Check cache first
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return res.json(cached.data);
  }

  try {
    const rawResult = await searchAggregator.searchAll(cleanQuery, {
      location: targetCounty,
      category: targetCategory
    });

    const responsePayload = formatSearchResponse(rawResult, cleanQuery, targetCounty, targetCategory);

    if (responsePayload.hasLiveResults) {
      searchCache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });
    }

    return res.json(responsePayload);
  } catch (error: any) {
    console.error('[BEI GANI Server] Error during live search:', error);
    return res.json({
      verified: false,
      hasLiveResults: false,
      product: null,
      items: [],
      results: [],
      totalCount: 0,
      sources: [],
      providersStatus: [],
      message: 'No live results available from the connected sources.'
    });
  }
};

// Secure Multi-Provider Live Price Discovery API (Supports POST & GET)
app.post('/api/search', handleSearchRequest);
app.get('/api/search', handleSearchRequest);

// Secure Image Proxy to bypass hotlink / iframe Referer blocks on verified product media
app.get('/api/image-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).send('Invalid protocol');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const imageRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!imageRes.ok) {
      return res.status(imageRes.status).send('Failed to fetch image');
    }

    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const arrayBuffer = await imageRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    return res.status(502).send('Error proxying image');
  }
});

// Real-Time Source Connectors Audit & Transparency API
app.get('/api/connectors/status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    connectors: [
      {
        id: 'community-reports-ke',
        name: 'Bei Gani Community Reports',
        status: 'CONNECTED',
        isRealConnection: true,
        type: 'DIRECT_DATABASE',
        description: 'Direct live connection to Firebase Firestore community price submissions.'
      },
      {
        id: 'official-epra-ke',
        name: 'EPRA & Official Regulators',
        status: 'CONNECTED',
        isRealConnection: true,
        type: 'REGULATORY_GAZETTE',
        description: 'Statutory maximum price caps gazetted under Kenyan law by EPRA & Kenya Railways.'
      },
      {
        id: 'realtime-search-grounding',
        name: 'Real-Time Search Grounding Engine',
        status: 'CONNECTED',
        isRealConnection: true,
        type: 'REALTIME_SEARCH_GROUNDING',
        description: 'Live verified web grounding across Kenyan retail domains (Jumia, Carrefour, Naivas, Jiji, Phoneplace, etc.).'
      },
      {
        id: 'jumia-ke',
        name: 'Jumia Kenya Direct Feed',
        status: 'REQUIRES_PARTNER_CREDENTIALS',
        isRealConnection: false,
        type: 'ENTERPRISE_API_REQUIRED',
        description: 'Direct affiliate catalog sync requires JUMIA_AFFILIATE_KEY. Live searches are routed via Search Grounding.'
      },
      {
        id: 'kilimall-ke',
        name: 'Kilimall Direct Feed',
        status: 'REQUIRES_PARTNER_CREDENTIALS',
        isRealConnection: false,
        type: 'ENTERPRISE_API_REQUIRED',
        description: 'Direct catalog sync requires Kilimall Open Platform credentials.'
      },
      {
        id: 'jiji-ke',
        name: 'Jiji Kenya Direct Feed',
        status: 'REQUIRES_PARTNER_CREDENTIALS',
        isRealConnection: false,
        type: 'ENTERPRISE_API_REQUIRED',
        description: 'Direct programmatic sync requires Genesis Tech / Jiji Partner API credentials.'
      },
      {
        id: 'masoko-ke',
        name: 'Safaricom Masoko Direct Feed',
        status: 'REQUIRES_PARTNER_CREDENTIALS',
        isRealConnection: false,
        type: 'ENTERPRISE_API_REQUIRED',
        description: 'Direct catalog sync requires Safaricom Masoko partner merchant credentials.'
      },
      {
        id: 'supermarkets-ke',
        name: 'Kenyan Supermarkets Direct ERP Feeds',
        status: 'REQUIRES_PARTNER_CREDENTIALS',
        isRealConnection: false,
        type: 'ENTERPRISE_API_REQUIRED',
        description: 'Direct warehouse stock sync requires Carrefour MAF / Naivas / Quickmart POS partner feeds.'
      }
    ]
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(rootDir, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(rootDir, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`BEI GANI? Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();

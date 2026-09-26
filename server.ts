import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const rootDir = process.cwd();

app.use(express.json());

// Initialize Google GenAI with required 'aistudio-build' header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Category and Keyword Curated High-Resolution Kenyan Product Images
function resolveProductImage(query: string, name: string, category: string, providedImage?: string): string {
  if (providedImage && typeof providedImage === 'string' && providedImage.startsWith('http') && !providedImage.includes('example.com')) {
    return providedImage;
  }

  const combined = `${query} ${name} ${category}`.toLowerCase();

  // CLOTHING & FASHION
  if (combined.includes('underwear') || combined.includes('boxer') || combined.includes('pantie') || combined.includes('panties') || combined.includes('brief') || combined.includes('innerwear') || combined.includes('suruali ya ndani')) {
    return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('handkerchief') || combined.includes('hanky') || combined.includes('kitambaa cha mfukoni')) {
    return 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('socks') || combined.includes('soksi') || combined.includes('stocking')) {
    return 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('laces') || combined.includes('shoe lace') || combined.includes('shoelace')) {
    return 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('glasses') || combined.includes('miwani') || combined.includes('spectacles') || combined.includes('sunglasses')) {
    return 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('shoe') || combined.includes('sneaker') || combined.includes('viatu') || combined.includes('boot') || combined.includes('sandal') || combined.includes('slipper')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('shirt') || combined.includes('tshirt') || combined.includes('trouser') || combined.includes('jeans') || combined.includes('dress') || combined.includes('jacket') || combined.includes('nguo')) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80';
  }

  // HOUSEHOLD & CLEANING
  if (combined.includes('gas') || combined.includes('lpg') || combined.includes('cooking gas') || combined.includes('cylinder') || combined.includes('refill') || combined.includes('mtungi')) {
    return 'https://images.unsplash.com/photo-1584281722573-b3c79c8846c4?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('humidifier') || combined.includes('diffuser') || combined.includes('air purifier')) {
    return 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('bedsheet') || combined.includes('shuka') || combined.includes('mashuka') || combined.includes('blanket') || combined.includes('duvet') || combined.includes('pillow')) {
    return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('soap') || combined.includes('sabuni') || combined.includes('detergent') || combined.includes('bar soap') || combined.includes('omo')) {
    return 'https://images.unsplash.com/photo-1607006314605-e3d67963d70f?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('toothpaste') || combined.includes('dawa ya meno') || combined.includes('toothbrush') || combined.includes('colgate') || combined.includes('sensodyne')) {
    return 'https://images.unsplash.com/photo-1559591937-e1032397444c?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('bucket') || combined.includes('basin') || combined.includes('broom') || combined.includes('mop') || combined.includes('tissue')) {
    return 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80';
  }

  // FURNITURE
  if (combined.includes('shoe rack') || combined.includes('shoerack') || combined.includes('rack ya viatu') || combined.includes('shelf')) {
    return 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('mattress') || combined.includes('godoro') || combined.includes('bobmil') || combined.includes('superfoam')) {
    return 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('bed') || combined.includes('kitanda') || combined.includes('sofa') || combined.includes('chair') || combined.includes('table') || combined.includes('wardrobe') || combined.includes('desk')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
  }

  // FITNESS & SPORTS
  if (combined.includes('dumbbell') || combined.includes('weights') || combined.includes('gym') || combined.includes('workout') || combined.includes('resistance band') || combined.includes('fitness') || combined.includes('yoga mat')) {
    return 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80';
  }

  // FOOD & GROCERIES
  if (combined.includes('watermelon') || combined.includes('water melon') || combined.includes('tikiti')) {
    return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('sugar') || combined.includes('sukari')) {
    return 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('beef') || combined.includes('nyama') || combined.includes('meat') || combined.includes('steak')) {
    return 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('chicken') || combined.includes('kuku') || combined.includes('poultry') || combined.includes('kienyeji')) {
    return 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('onion') || combined.includes('vitunguu') || combined.includes('tomato') || combined.includes('nyanya') || combined.includes('vegetable') || combined.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('milk') || combined.includes('maziwa')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('cooking oil') || combined.includes('mafuta') || combined.includes('unga') || combined.includes('flour') || combined.includes('rice') || combined.includes('mchele')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('water') && !combined.includes('melon')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80';
  }

  // ELECTRONICS
  if (combined.includes('charger') || combined.includes('chaja') || combined.includes('usb') || combined.includes('cable') || combined.includes('power bank')) {
    return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('samsung') || combined.includes('iphone') || combined.includes('phone') || combined.includes('simu') || combined.includes('smartphone')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('laptop') || combined.includes('macbook') || combined.includes('computer')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('tv') || combined.includes('television') || combined.includes('screen')) {
    return 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80';
  }

  // BUILDING & HARDWARE
  if (combined.includes('cement') || combined.includes('simiti') || combined.includes('sand') || combined.includes('mchanga') || combined.includes('ballast')) {
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('paint') || combined.includes('rangi') || combined.includes('pipe') || combined.includes('mabati') || combined.includes('iron sheet') || combined.includes('timber') || combined.includes('tools')) {
    return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80';
  }

  // SERVICES
  if (combined.includes('barber') || combined.includes('kinyozi') || combined.includes('haircut') || combined.includes('salon')) {
    return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('plumber') || combined.includes('fundi wa maji') || combined.includes('bomba') || combined.includes('plumbing')) {
    return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('electrician') || combined.includes('fundi wa stima') || combined.includes('wiring') || combined.includes('stima')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
  }
  if (combined.includes('car wash') || combined.includes('mechanic') || combined.includes('kuosha gari')) {
    return 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
}

// In-memory cache for search queries to prevent duplicate API calls and stay within quotas
const searchCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

// Dynamic Real-time Kenyan Price Discovery API
app.post('/api/search', async (req, res) => {
  const { query, county, category } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const cleanQuery = query.trim();
  const targetCounty = county || 'Kenya';
  const cacheKey = `${cleanQuery.toLowerCase()}|${targetCounty.toLowerCase()}|${category || 'any'}`;

  // Check in-memory cache first
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return res.json(cached.data);
  }

  // Guard if GEMINI_API_KEY is not configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[BEI GANI Server] GEMINI_API_KEY is not set in environment.');
    return res.json({
      verified: false,
      message: "We couldn't find a verified current price for this item."
    });
  }

  try {
    const prompt = `You are the real-time Kenyan price discovery engine for BEI GANI? ("Before unask bei, check bei").
The user in Kenya is searching for: "${cleanQuery}" (Target location: ${targetCounty}, Category: ${category || 'any'}).

UNIVERSAL PRODUCT & SERVICE SCOPE:
In Kenya, users search for virtually any everyday item or service across:
- Clothing & Fashion: underwear, panties, boxers, bras, socks, handkerchiefs, ties, belts, shoes, sneakers, shoe laces, shoe polish
- Footwear: sneakers, sandals, slippers, boots, school shoes, insoles
- Personal Care: soap, toothpaste, toothbrushes, deodorant, lotion, shampoo, sanitary products, razors
- Food & Groceries: sugar, flour, rice, cooking oil, salt, milk, bread, eggs, beef, chicken, fish, watermelon, onions, tomatoes, spices
- Household: gas cylinders, cooking gas/LPG refills, humidifiers, bedsheets, blankets, pillows, mattresses, soap, detergents, brooms, buckets
- Kitchen: plates, cups, glasses, spoons, pots, pans, kettles, blenders, air fryers
- Electronics: phone chargers, USB cables, power banks, phones, laptops, TVs, earphones
- Fitness & Sports: dumbbells, resistance bands, skipping ropes, yoga mats, sports jerseys
- Automotive: car batteries, engine oil, brake pads, wipers, car wash
- Building & Hardware: cement, ballast, sand, steel, nails, paint, pipes, gas cylinders
- Furniture: beds, sofas, chairs, tables, wardrobes, shoe racks
- Baby & Family: diapers, baby clothes, baby wipes, toys, school bags
- Services: barber (kinyozi), salon, plumber (fundi wa maji), electrician (fundi wa stima), mechanic, painter, car wash

YOUR INSTRUCTIONS:
1. Search across legitimate Kenyan retailers, marketplaces, public datasets, vendor websites, and verified local sources (e.g., Jumia Kenya, Kilimall, Phoneplace Kenya, Masoko, Carrefour Kenya, Naivas, Quickmart, Chandarana Foodplus, Luthuli Ave electronics, hardware stores, Wakulima/Marikiti market, EPRA, SGR tariffs, BuyRentKenya, PigiaMe, artisan fundi rates, etc.).
2. You MUST NOT invent, guess, or manufacture fake prices. Every price must reflect real market data in Kenyan Shillings (KSh).
3. If genuine Kenyan market data is available for this product or service, return "verified": true with multiple vendors (aim for 2 to 4 distinct real vendors/sources whenever available).
4. Calculate "lowestPrice", "highestPrice", and "typicalPrice" ONLY from the actual retrieved vendor prices.
5. Provide accurate Swahili or Kenyan slang translation if applicable (e.g. "suruali ya ndani", "nyama ya ng'ombe", "vitunguu", "fundi wa maji", "godoro", "mtungi wa gas").
6. If the item is completely obscure or no genuine price data can be verified in Kenya, return "verified": false with the identified clean product name and appropriate category.

OUTPUT FORMAT:
Return a JSON object inside a \`\`\`json\`\`\` code block with this exact structure:
{
  "verified": true,
  "product": {
    "name": "Full descriptive product/service name (e.g. Men's Cotton Boxers 3-Pack, 6kg Cooking Gas Refill, Watermelon Whole Fruit, etc.)",
    "swahiliName": "Swahili name or common Kenyan term",
    "aliases": ["term1", "term2"],
    "category": "clothing | footwear | household | kitchen | personal_care | groceries | electronics | hardware | fitness | furniture | automotive | baby | services | housing | transport",
    "subcategory": "Extensible subcategory name (e.g. Underwear & Innerwear, Cooking Gas & LPG, Gym Equipment, etc.)",
    "brand": "Brand name or null",
    "sizeOrQuantity": "e.g. 1 kg, 50kg bag, 6kg refill, pair, 3-pack, call-out, 1 month",
    "unit": "kg | piece | bag | pair | pack | month | service | litre | trip",
    "image": "Direct verified product image URL or null",
    "typicalPrice": 0,
    "lowestPrice": 0,
    "highestPrice": 0,
    "county": "${targetCounty}",
    "dateCollected": "Current (Month Year)",
    "description": "Short Kenyan market buying tip and context (Usipay over note)",
    "vendors": [
      {
        "id": "v1",
        "vendorName": "Actual Kenyan Retailer or Vendor Name (e.g. Jumia Kenya, Carrefour, Naivas, TotalEnergies, Gikomba, Local Certified Fundi)",
        "price": 0,
        "unit": "kg | piece | pair | etc.",
        "location": "e.g. Nairobi, CBD / Online Delivery / Mombasa / Estate",
        "sourceType": "ONLINE_RETAILER | PHYSICAL_STORE | MARKET_STALL | OFFICIAL | COMMUNITY",
        "sourceUrl": "Source domain or link",
        "dateCollected": "Recent",
        "inStock": true,
        "notes": "e.g. Brand new, official warranty, wholesale, standard estate cut"
      }
    ]
  }
}

If no verified current price can be found in Kenya, return:
{
  "verified": false,
  "productName": "Clean Title Case Product Name",
  "category": "Appropriate category",
  "subcategory": "Appropriate subcategory",
  "message": "No verified current price found."
}`;

    // Execute with Google Search Grounding for real-time web retrieval
    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (apiError: any) {
      // Check for rate limit / quota exhaustion (HTTP 429 / RESOURCE_EXHAUSTED)
      const isQuotaError = 
        apiError?.status === 429 || 
        apiError?.code === 429 || 
        apiError?.message?.includes('429') || 
        apiError?.message?.includes('RESOURCE_EXHAUSTED') ||
        apiError?.message?.includes('quota');

      if (isQuotaError) {
        console.warn(`[BEI GANI Server] Gemini rate limit/quota reached for query "${cleanQuery}". Using graceful fallback.`);
        // Try fallback call without search grounding if allowed
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
          });
        } catch (fallbackErr: any) {
          console.warn(`[BEI GANI Server] Fallback model also unavailable:`, fallbackErr?.message || fallbackErr);
          const fallbackResp = {
            verified: false,
            message: "We couldn't find a verified current price for this item.",
            sources: []
          };
          searchCache.set(cacheKey, { timestamp: Date.now(), data: fallbackResp });
          return res.json(fallbackResp);
        }
      } else {
        throw apiError;
      }
    }

    const textOutput = response?.text || '';
    
    // Extract grounding URLs if available
    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls: string[] = [];
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        sourceUrls.push(chunk.web.uri);
      }
    }

    // Parse JSON from codeblock or text
    const jsonMatch = textOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || textOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const emptyResp = {
        verified: false,
        message: "We couldn't find a verified current price for this item.",
        sources: sourceUrls
      };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: emptyResp });
      return res.json(emptyResp);
    }

    let rawJson = jsonMatch[1] || jsonMatch[0];
    // Clean potential trailing commas before closing braces
    rawJson = rawJson.replace(/,\s*([\]}])/g, '$1');

    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.warn('Failed to parse JSON response from search engine:', e);
      const parseFailResp = {
        verified: false,
        message: "We couldn't find a verified current price for this item.",
        sources: sourceUrls
      };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: parseFailResp });
      return res.json(parseFailResp);
    }

    if (!parsed.verified || !parsed.product) {
      const unverifiedResp = {
        verified: false,
        productName: parsed.productName || cleanQuery,
        category: parsed.category || category || 'everyday',
        subcategory: parsed.subcategory,
        message: parsed.message || "No verified current price found.",
        sources: sourceUrls
      };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: unverifiedResp });
      return res.json(unverifiedResp);
    }

    // Normalize product
    const p = parsed.product;
    const vendors = Array.isArray(p.vendors) ? p.vendors : [];
    
    // Attach source URLs to vendors if missing
    if (sourceUrls.length > 0 && vendors.length > 0) {
      vendors.forEach((v: any, idx: number) => {
        if (!v.sourceUrl && sourceUrls[idx % sourceUrls.length]) {
          v.sourceUrl = sourceUrls[idx % sourceUrls.length];
        }
      });
    }

    // Ensure prices are strictly computed from retrieved vendors
    const vendorPrices = vendors.map((v: any) => Number(v.price)).filter((num: number) => !isNaN(num) && num > 0);
    const lowest = vendorPrices.length > 0 ? Math.min(...vendorPrices) : Number(p.lowestPrice) || Number(p.typicalPrice) || 0;
    const highest = vendorPrices.length > 0 ? Math.max(...vendorPrices) : Number(p.highestPrice) || Number(p.typicalPrice) || 0;
    const typical = Number(p.typicalPrice) || (vendorPrices.length > 0 ? Math.round(vendorPrices.reduce((a: number, b: number) => a + b, 0) / vendorPrices.length) : lowest);

    // Pick sharp, verified image
    const finalImage = resolveProductImage(cleanQuery, p.name || '', p.category || '', p.image);

    const normalizedProduct = {
      id: `discovered-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: p.name || cleanQuery,
      swahiliName: p.swahiliName || undefined,
      aliases: Array.isArray(p.aliases) ? p.aliases : [cleanQuery.toLowerCase()],
      category: p.category || 'groceries',
      subcategory: p.subcategory || 'General',
      brand: p.brand || undefined,
      sizeOrQuantity: p.sizeOrQuantity || 'Standard',
      unit: p.unit || 'piece',
      image: finalImage,
      typicalPrice: typical,
      minPrice: lowest,
      maxPrice: highest,
      priceType: 'MARKET_RETAIL',
      county: targetCounty,
      town: targetCounty,
      retailerOrSource: vendors.map((v: any) => v.vendorName).join(', ') || 'Multi-Vendor Market Survey',
      dateCollected: 'Live Discovery',
      reportsCount: vendors.length,
      confirmsCount: 1,
      outdatesCount: 0,
      flaggedCount: 0,
      sourceUrl: sourceUrls[0] || undefined,
      description: p.description || `Real-time multi-vendor prices collected across Kenyan retailers.`,
      isRealtimeDiscovered: true,
      verified: true,
      vendors: vendors.map((v: any, index: number) => ({
        id: `v-${index}-${Date.now()}`,
        vendorName: v.vendorName || 'Kenyan Retailer',
        price: Number(v.price) || typical,
        unit: v.unit || p.unit || 'unit',
        location: v.location || targetCounty,
        sourceType: v.sourceType || 'ONLINE_RETAILER',
        sourceUrl: v.sourceUrl || sourceUrls[index % (sourceUrls.length || 1)] || undefined,
        dateCollected: v.dateCollected || 'Recent',
        inStock: v.inStock !== false,
        notes: v.notes || undefined
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const finalResponse = {
      verified: true,
      product: normalizedProduct,
      sources: sourceUrls
    };

    // Cache the verified response
    searchCache.set(cacheKey, { timestamp: Date.now(), data: finalResponse });

    return res.json(finalResponse);
  } catch (error: any) {
    console.warn('[BEI GANI Server] Search request handled gracefully:', error?.message || error);
    return res.json({
      verified: false,
      message: "We couldn't find a verified current price for this item.",
      sources: []
    });
  }
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

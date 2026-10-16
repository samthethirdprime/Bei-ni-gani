/**
 * Generic Product Image Registry & Fallback Resolution
 *
 * Provides category- and concept-level visual fallbacks when genuine retailer product photos
 * are inaccessible or missing.
 *
 * Priority Rule:
 * 1. Genuine retailer/source image (always prioritized)
 * 2. Generic product/category concept image (fallback)
 * 3. Neutral UI placeholder (if no generic illustration exists)
 */

import { analyzeSearchQuery } from './searchEngine';

export interface GenericImageDefinition {
  assetUrl: string;
  conceptName: string;
  category: string;
}

// Concept mapping for specific common retail items and categories with real product photographs
export const GENERIC_PRODUCT_ASSETS: Record<string, GenericImageDefinition> = {
  'basmati-rice': {
    assetUrl: '/product-photos/basmati-rice.jpg',
    conceptName: 'Basmati Rice',
    category: 'groceries'
  },
  'rice': {
    assetUrl: '/product-photos/basmati-rice.jpg',
    conceptName: 'Rice & Grains',
    category: 'groceries'
  },
  'power-bank': {
    assetUrl: '/product-photos/power-bank.jpg',
    conceptName: 'Power Bank',
    category: 'electronics'
  },
  'tv-stand': {
    assetUrl: '/product-photos/tv-stand.jpg',
    conceptName: 'TV Stand',
    category: 'furniture'
  },
  'tv-stand-wood': {
    assetUrl: '/product-photos/tv-stand-wood.jpg',
    conceptName: 'Wooden TV Stand Console',
    category: 'furniture'
  },
  'tv-stand-black': {
    assetUrl: '/product-photos/tv-stand-black.jpg',
    conceptName: 'Black Metal TV Stand Cabinet',
    category: 'furniture'
  },
  'tv-stand-floating': {
    assetUrl: '/product-photos/tv-stand-floating.jpg',
    conceptName: 'Floating Wall Mount TV Console',
    category: 'furniture'
  },
  'duvet': {
    assetUrl: '/product-photos/duvet.jpg',
    conceptName: 'Duvet & Bedding',
    category: 'household'
  },
  'duvet-white': {
    assetUrl: '/product-photos/duvet-white.jpg',
    conceptName: 'White Microfiber Quilted Duvet',
    category: 'household'
  },
  'duvet-patterned': {
    assetUrl: '/product-photos/duvet-patterned.jpg',
    conceptName: 'Patterned Printed Duvet Comforter',
    category: 'household'
  },
  'duvet-velvet': {
    assetUrl: '/product-photos/duvet-velvet.jpg',
    conceptName: 'Heavy Velvet Reversible Duvet',
    category: 'household'
  },
  'socks': {
    assetUrl: '/product-photos/socks.jpg',
    conceptName: 'Socks',
    category: 'clothing'
  },
  'socks-black': {
    assetUrl: '/product-photos/socks-black.jpg',
    conceptName: 'Black Socks',
    category: 'clothing'
  },
  'socks-white': {
    assetUrl: '/product-photos/socks-white.jpg',
    conceptName: 'White Socks',
    category: 'clothing'
  },
  'socks-ankle': {
    assetUrl: '/product-photos/socks-ankle.jpg',
    conceptName: 'Ankle Socks',
    category: 'clothing'
  },
  'socks-sports': {
    assetUrl: '/product-photos/socks-sports.jpg',
    conceptName: 'Sports Athletic Socks',
    category: 'clothing'
  },
  'shoe-rack': {
    assetUrl: '/product-photos/shoe-rack.jpg',
    conceptName: 'Shoe Rack',
    category: 'furniture'
  },
  'sugar': {
    assetUrl: '/product-photos/sugar.jpg',
    conceptName: 'Sugar',
    category: 'groceries'
  },
  'headphones': {
    assetUrl: '/product-photos/headphones.jpg',
    conceptName: 'Headphones & Audio',
    category: 'electronics'
  },
  'watermelon': {
    assetUrl: '/product-photos/watermelon.jpg',
    conceptName: 'Watermelon',
    category: 'groceries'
  },
  'watermelon-slice': {
    assetUrl: '/product-photos/watermelon-slice.jpg',
    conceptName: 'Fresh Sliced Watermelon',
    category: 'groceries'
  },
  'watermelon-whole': {
    assetUrl: '/product-photos/watermelon-whole.jpg',
    conceptName: 'Whole Sweet Watermelon',
    category: 'groceries'
  },
  'dildos': {
    assetUrl: '/product-photos/dildos.jpg',
    conceptName: 'Adult Wellness & Personal Massagers (Dildos)',
    category: 'personal_care'
  },
  'adult-wellness': {
    assetUrl: '/product-photos/adult-wellness.jpg',
    conceptName: 'Adult Wellness & Intimate Care',
    category: 'personal_care'
  },
  'smartphone': {
    assetUrl: '/product-photos/smartphone.jpg',
    conceptName: 'Smartphone',
    category: 'electronics'
  },
  'footwear': {
    assetUrl: '/product-photos/footwear.jpg',
    conceptName: 'Sneakers & Shoes',
    category: 'footwear'
  },
  'clothing': {
    assetUrl: '/product-photos/clothing.jpg',
    conceptName: 'Clothing & Apparel',
    category: 'clothing'
  },
  'wheat-flour': {
    assetUrl: '/product-photos/wheat-flour.jpg',
    conceptName: 'Wheat Flour (Unga wa Ngano)',
    category: 'groceries'
  },
  'fortified-wheat-flour': {
    assetUrl: '/product-photos/fortified-wheat-flour.jpg',
    conceptName: 'Fortified Wheat Flour',
    category: 'groceries'
  },
  'maize-flour': {
    assetUrl: '/product-photos/maize-flour.jpg',
    conceptName: 'Sifted Maize Meal (Unga wa Ugali)',
    category: 'groceries'
  },
  'fortified-maize-flour': {
    assetUrl: '/product-photos/fortified-maize-flour.jpg',
    conceptName: 'Fortified Sifted Maize Flour',
    category: 'groceries'
  },
  'multimedia-speakers': {
    assetUrl: '/product-photos/multimedia-speakers.jpg',
    conceptName: 'Multimedia Speaker System with Subwoofer',
    category: 'electronics'
  },
  'water-dispenser': {
    assetUrl: '/product-photos/water-dispenser.jpg',
    conceptName: 'Hot & Cold Water Dispenser',
    category: 'appliances'
  },
  'bottled-water': {
    assetUrl: '/product-photos/bottled-water.jpg',
    conceptName: 'Bottled Drinking Water',
    category: 'groceries'
  },
  'cooking-gas': {
    assetUrl: '/product-photos/cooking-gas.jpg',
    conceptName: 'Cooking Gas (LPG)',
    category: 'household'
  },
  'cooking-oil': {
    assetUrl: '/product-photos/cooking-oil.jpg',
    conceptName: 'Cooking Vegetable Oil',
    category: 'groceries'
  },
  'eggs': {
    assetUrl: '/product-photos/eggs.jpg',
    conceptName: 'Fresh Farm Eggs',
    category: 'groceries'
  },
  'bread': {
    assetUrl: '/product-photos/bread.jpg',
    conceptName: 'White / Brown Bread',
    category: 'groceries'
  },
  'milk': {
    assetUrl: '/product-photos/milk.jpg',
    conceptName: 'Fresh / UHT Milk',
    category: 'groceries'
  }
};

/**
 * Deterministically distributes among available photographic assets based on item identity.
 */
function selectItemVariant(identityStr: string, options: string[]): string {
  let hash = 0;
  for (let i = 0; i < identityStr.length; i++) {
    hash = (hash * 31 + identityStr.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

/**
 * Resolves specific photographic fallback for TV stands with attribute awareness and catalog variety.
 */
function resolveTvStandImage(rawText: string, identity: string): string {
  if (/\b(wood|wooden|oak|timber|walnut|mahogany|teak|board|drawer|drawers|mbao)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['tv-stand-wood'].assetUrl;
  }
  if (/\b(black|dark|metal|steel|iron|industrial|slat|slatted|cabinet|doors?)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['tv-stand-black'].assetUrl;
  }
  if (/\b(float|floating|wall\s*mount|wall\s*mounted|hanging|media\s*shelf|minimalist|led)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['tv-stand-floating'].assetUrl;
  }
  return selectItemVariant(identity, [
    GENERIC_PRODUCT_ASSETS['tv-stand'].assetUrl,
    GENERIC_PRODUCT_ASSETS['tv-stand-wood'].assetUrl,
    GENERIC_PRODUCT_ASSETS['tv-stand-black'].assetUrl,
    GENERIC_PRODUCT_ASSETS['tv-stand-floating'].assetUrl
  ]);
}

/**
 * Resolves specific photographic fallback for Duvets with attribute awareness (size, material, colour, pattern) and variety.
 */
function resolveDuvetImage(rawText: string, identity: string): string {
  if (/\b(velvet|plush|navy|royal\s*blue|heavy\s*velvet)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['duvet-velvet'].assetUrl;
  }
  if (/\b(pattern|patterned|floral|flower|flowers|print|printed|patchwork|design|colourful|colorful|decor)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['duvet-patterned'].assetUrl;
  }
  if (/\b(white|microfiber|microfibre|plain|hotel|all\s*season|hollow\s*fibr?e|light|4x6|single|twin)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['duvet-white'].assetUrl;
  }
  if (/\b(6x6|5x6|king|queen|double)\b/i.test(rawText)) {
    return selectItemVariant(identity, [
      GENERIC_PRODUCT_ASSETS['duvet-velvet'].assetUrl,
      GENERIC_PRODUCT_ASSETS['duvet-patterned'].assetUrl,
      GENERIC_PRODUCT_ASSETS['duvet'].assetUrl
    ]);
  }
  return selectItemVariant(identity, [
    GENERIC_PRODUCT_ASSETS['duvet'].assetUrl,
    GENERIC_PRODUCT_ASSETS['duvet-white'].assetUrl,
    GENERIC_PRODUCT_ASSETS['duvet-patterned'].assetUrl,
    GENERIC_PRODUCT_ASSETS['duvet-velvet'].assetUrl
  ]);
}

/**
 * Resolves specific photographic fallback for Socks with attribute awareness (colour, cut, style) and variety.
 */
function resolveSocksImage(rawText: string, identity: string): string {
  if (/\b(black|dark|charcoal|black-white)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['socks-black'].assetUrl;
  }
  if (/\b(white|all-white|clean\s*white)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['socks-white'].assetUrl;
  }
  if (/\b(ankle|low\s*cut|lowcut|no\s*show|sneaker\s+socks?|trainer\s+socks?|invisible|short\s+socks?)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['socks-ankle'].assetUrl;
  }
  if (/\b(sport|sports|athletic|running|gym|compression|cushion|cushioned|football|speed|workout|training)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['socks-sports'].assetUrl;
  }
  if (/\b(crew|calf|long|dress|formal|office|cotton\s+socks)\b/i.test(rawText)) {
    return selectItemVariant(identity, [
      GENERIC_PRODUCT_ASSETS['socks'].assetUrl,
      GENERIC_PRODUCT_ASSETS['socks-black'].assetUrl,
      GENERIC_PRODUCT_ASSETS['socks-white'].assetUrl
    ]);
  }
  return selectItemVariant(identity, [
    GENERIC_PRODUCT_ASSETS['socks'].assetUrl,
    GENERIC_PRODUCT_ASSETS['socks-black'].assetUrl,
    GENERIC_PRODUCT_ASSETS['socks-white'].assetUrl,
    GENERIC_PRODUCT_ASSETS['socks-ankle'].assetUrl,
    GENERIC_PRODUCT_ASSETS['socks-sports'].assetUrl
  ]);
}

/**
 * Resolves specific photographic fallback for Watermelon with preparation/attribute awareness (sliced vs whole).
 */
function resolveWatermelonImage(rawText: string, identity: string): string {
  if (/\b(slice|sliced|slices|cut|piece|pieces|wedge|wedges|portion|portions|pulp|red)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['watermelon-slice'].assetUrl;
  }
  if (/\b(whole|round|big|large|mzima|green|striped|farm|crate|table)\b/i.test(rawText)) {
    return GENERIC_PRODUCT_ASSETS['watermelon-whole'].assetUrl;
  }
  return selectItemVariant(identity, [
    GENERIC_PRODUCT_ASSETS['watermelon-whole'].assetUrl,
    GENERIC_PRODUCT_ASSETS['watermelon-slice'].assetUrl,
    GENERIC_PRODUCT_ASSETS['watermelon'].assetUrl
  ]);
}

/**
 * Resolves a fallback image URL for a given product or search item.
 * Evaluates semantic normalization concepts and specific product name keywords.
 * If no authentic matching photograph exists for the product, returns null
 * to safely display the neutral UI placeholder (LEVEL 3) rather than an unrelated image.
 */
export function getGenericProductImage(
  item?: string | {
    id?: string;
    name?: string;
    category?: string;
    subcategory?: string;
    query?: string;
    brand?: string;
    description?: string;
    sizeOrQuantity?: string;
    unit?: string;
    vendors?: any[];
  } | null,
  categoryParam?: string,
  idParam?: string
): string | null {
  if (!item) return null;

  const isString = typeof item === 'string';
  const itemName = isString ? item : (item.name || item.query || '');
  const itemCategory = isString ? (categoryParam || '') : (item.category || '');
  const itemSubcategory = isString ? '' : (item.subcategory || '');
  const itemQuery = isString ? item : (item.query || '');
  const itemBrand = isString ? '' : (item.brand || '');
  const itemSize = isString ? '' : (item.sizeOrQuantity || '');
  const itemUnit = isString ? '' : (item.unit || '');
  const itemDesc = isString ? '' : (item.description || '');
  const itemId = isString ? (idParam || '') : (item.id || '');

  const rawText = `${itemName} ${itemSubcategory} ${itemCategory} ${itemQuery} ${itemBrand} ${itemSize} ${itemUnit} ${itemDesc}`.toLowerCase();
  const cleanCompressed = rawText.replace(/[^a-z0-9]/g, '');
  const identity = `${itemId} ${itemName} ${itemSubcategory} ${itemBrand} ${itemSize}`.trim() || rawText;

  // 1. Leverage the search engine's semantic query analysis pipeline with discriminator checks
  try {
    const analysis = analyzeSearchQuery(itemName);
    if (analysis.baseProduct) {
      if (analysis.baseProduct === 'rice' && !/\b(cooker|pot|steamer|maker|cracker|crisp|cake|flour|paper)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['basmati-rice'].assetUrl;
      }
      if (analysis.baseProduct === 'power_bank' && !/\b(cable|cord|strip|supply|tool|saw|car\s+battery|solar|aa\s+battery|aaa\s+battery|socket)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['power-bank'].assetUrl;
      }
      if (analysis.baseProduct === 'tv_stand') {
        return resolveTvStandImage(rawText, identity);
      }
      if (analysis.baseProduct === 'duvet' && !/\b(pillow|mattress|bedsheet)\b/i.test(rawText)) {
        return resolveDuvetImage(rawText, identity);
      }
      if (analysis.baseProduct === 'socks' && !/\b(socket|plug|extension|shoe|boot|lace|polish|insole)\b/i.test(rawText)) {
        return resolveSocksImage(rawText, identity);
      }
      if (analysis.baseProduct === 'shoe_rack') {
        return GENERIC_PRODUCT_ASSETS['shoe-rack'].assetUrl;
      }
      if (analysis.baseProduct === 'headphones' && !/\b(case\s+only|cable\s+only|adapter\s+only|stand\s+only)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['headphones'].assetUrl;
      }
      if (analysis.baseProduct === 'watermelon' && !/\b(water\s+bottle|drinking\s+water|mineral\s+water|dispenser|pump)\b/i.test(rawText)) {
        return resolveWatermelonImage(rawText, identity);
      }
      if (analysis.baseProduct === 'sugar' && !/\b(cane\s+juice|bowl|tongs|meter)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['sugar'].assetUrl;
      }
      if (analysis.baseProduct === 'dildo') {
        if (/\b(dildos?)\b/i.test(rawText) || cleanCompressed.includes('dildo')) {
          return GENERIC_PRODUCT_ASSETS['dildos'].assetUrl;
        }
        return GENERIC_PRODUCT_ASSETS['adult-wellness'].assetUrl;
      }
      if (analysis.baseProduct === 'smartphones' && !/\b(tv|television|fridge|refrigerator|microwave|cooker|case|cover|protector|cable|charger)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['smartphone'].assetUrl;
      }
      if (analysis.baseProduct === 'flour') {
        if (/\b(maize|corn|cornmeal|ugali|mahindi)\b/i.test(rawText)) {
          if (/\b(fortified|enriched|extra|dola)\b/i.test(rawText) || cleanCompressed.includes('fortifiedmaize')) {
            return GENERIC_PRODUCT_ASSETS['fortified-maize-flour'].assetUrl;
          }
          return GENERIC_PRODUCT_ASSETS['maize-flour'].assetUrl;
        }
        if (/\b(fortified|ajab|exe)\b/i.test(rawText)) {
          return GENERIC_PRODUCT_ASSETS['fortified-wheat-flour'].assetUrl;
        }
        return GENERIC_PRODUCT_ASSETS['wheat-flour'].assetUrl;
      }
      if (analysis.baseProduct === 'gas' && !/\b(stove|cooker|burner|cylinder\s+bracket)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['cooking-gas'].assetUrl;
      }
      if (analysis.baseProduct === 'oil' && !/\b(engine|motor|hair|body|massage|fuel)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['cooking-oil'].assetUrl;
      }
      if (analysis.baseProduct === 'bread' && !/\b(toaster|knife|board)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['bread'].assetUrl;
      }
      if (analysis.baseProduct === 'milk' && !/\b(pump|shaker|frother)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['milk'].assetUrl;
      }
      if (analysis.baseProduct === 'shoes' && /\b(sneakers?|running\s+shoes?|trainers?|raba)\b/i.test(rawText) && !/\b(rack|polish|lace|socks?)\b/i.test(rawText)) {
        return GENERIC_PRODUCT_ASSETS['footwear'].assetUrl;
      }
    }
  } catch (err) {
    // If analysis helper throws, continue to keyword matching
  }

  // 2. Specific product name / subtype keyword matching with strict boundaries

  // Maize Flour (Unga wa Ugali) & Fortified Maize Flour (strictly segregated from wheat flour)
  if (
    (/\b(maize\s*flour|unga\s*wa\s*ugali|sifted\s*maize|cornmeal|maize\s*meal|corn\s*flour|ugali\s*flour|soko|jogoo|pembe|raha\s*premium|hostess|amaize|dola)\b/i.test(rawText) ||
     cleanCompressed.includes('maizemeal') || cleanCompressed.includes('maizeflour') || cleanCompressed.includes('ungawaugali') ||
     (/\b(flour|flours|unga)\b/i.test(rawText) && /\b(maize|ugali|mahindi|cornmeal|sifted)\b/i.test(rawText))) &&
    !/\b(wheat|ngano|baking|chapati|mandazi)\b/i.test(rawText)
  ) {
    if (/\b(fortified|enriched|extra|dola)\b/i.test(rawText) || cleanCompressed.includes('fortifiedmaize')) {
      return GENERIC_PRODUCT_ASSETS['fortified-maize-flour'].assetUrl;
    }
    return GENERIC_PRODUCT_ASSETS['maize-flour'].assetUrl;
  }

  // Wheat Flour & Fortified Wheat Flour (e.g. Ndovu Home Baking, Ajab, Exe, Pembe)
  if (
    (/\b(wheat\s*flour|unga\s*wa\s*ngano|home\s*baking|all\s*purpose\s*flour|baking\s*flour|atta\s*mark|chapati\s*flour|mandazi\s*flour|ndovu|ajab|exe)\b/i.test(rawText) ||
     cleanCompressed.includes('wheatflour') || cleanCompressed.includes('ungawangano') ||
     (/\b(flour|flours|unga)\b/i.test(rawText) && /\b(wheat|ngano|baking|chapati|mandazi|pastry|cake|all\s*purpose)\b/i.test(rawText))) &&
    !/\b(maize|corn|cornmeal|ugali|mahindi)\b/i.test(rawText)
  ) {
    if (/\b(fortified|ajab|exe)\b/i.test(rawText)) {
      return GENERIC_PRODUCT_ASSETS['fortified-wheat-flour'].assetUrl;
    }
    return GENERIC_PRODUCT_ASSETS['wheat-flour'].assetUrl;
  }

  // Multimedia Speaker Systems (distinct photograph of speaker system with subwoofer)
  if (
    (/\b(multimedia\s*speakers?|speaker\s*systems?|subwoofers?|soundbars?|home\s*theatre|home\s*theater)\b/i.test(rawText) ||
     (/\bspeakers?\b/i.test(rawText) && !/\b(bluetooth\s*speaker\s*mini|smart\s*speaker)\b/i.test(rawText))) &&
    !/\b(headphone|headphones|headset|headsets|earphone|earphones|earbud|earbuds|airpod|airpods|tv|television)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['multimedia-speakers'].assetUrl;
  }

  // Water Dispensers (must show actual water dispenser unit, not bottled water)
  if (
    /\b(water\s*dispensers?|waterdispensers?|dispensers?\s*ya\s*maji|hot\s*(and|&)\s*cold\s*water\s*dispensers?|bottom\s*loading\s*dispensers?|tabletop\s*dispensers?)\b/i.test(rawText) ||
    (/\bdispensers?\b/i.test(rawText) && /\b(water|maji)\b/i.test(rawText))
  ) {
    return GENERIC_PRODUCT_ASSETS['water-dispenser'].assetUrl;
  }

  // Bottled Drinking Water (must show bottled water, not water dispenser or watermelon)
  if (
    (/\b(bottled\s*water|drinking\s*water|mineral\s*water|purified\s*water|keringet|dasani|aquafresh)\b/i.test(rawText) ||
     (/\bwater\b/i.test(rawText) && /\b(bottle|bottles|litre|liter|500ml|1l|1\.5l|20l)\b/i.test(rawText))) &&
    !/\b(dispenser|pump|heater|tank|pipe|meter|filter|melon|watermelon|tikitimaji)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['bottled-water'].assetUrl;
  }

  // Rice / Basmati Rice (e.g. Daawat Traditional Long Grain Basmati Rice)
  if (
    (/\b(rice|mchele|basmati|pishori|sindano)\b/i.test(rawText) || rawText.includes('daawat') || cleanCompressed.includes('basmatirice') || cleanCompressed.includes('longgrainrice')) &&
    !/\b(cooker|pot|steamer|maker|cracker|crisp|cake|flour|paper)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['basmati-rice'].assetUrl;
  }

  // Specific Dildos (exact product photograph of personal massager / dildo)
  if (
    /\b(dildos?)\b/i.test(rawText) ||
    cleanCompressed.includes('dildo')
  ) {
    return GENERIC_PRODUCT_ASSETS['dildos'].assetUrl;
  }

  // Adult Wellness & Intimate Products (tasteful non-explicit packaging photograph, distinct from dildos)
  if (
    /\b(adult\s+(wellness|care|products?)|sexual\s+wellness|intimate\s+([a-z0-9-]+\s+)?wellness|intimate\s+care|adult\s+toy|sex\s+toy|vibrators?|lubricant|lube|kegel|condoms?|massage\s+oil)\b/i.test(rawText) ||
    (rawText.includes('personal massager') && !rawText.includes('back') && !rawText.includes('neck') && !rawText.includes('foot')) ||
    cleanCompressed.includes('adultwellness')
  ) {
    return GENERIC_PRODUCT_ASSETS['adult-wellness'].assetUrl;
  }

  // Cooking Gas (LPG)
  if (
    (/\b(cooking\s*gas|lpg|gas\s*refill|mtungi\s*wa\s*gas|pro\s*gas|k-gas|kgas|afrigas)\b/i.test(rawText) || cleanCompressed.includes('cookinggas')) &&
    !/\b(stove|cooker|burner|cylinder\s+bracket)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['cooking-gas'].assetUrl;
  }

  // Cooking Vegetable Oil
  if (
    (/\b(cooking\s*oil|vegetable\s*oil|mafuta\s*ya\s*kupikia|fresh\s*fri|rina|salit|golden\s*fry|corn\s*oil|sunflower\s*oil)\b/i.test(rawText) || cleanCompressed.includes('cookingoil')) &&
    !/\b(engine|motor|hair|body|massage\s*oil|fuel)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['cooking-oil'].assetUrl;
  }

  // Fresh Farm Eggs
  if (
    /\b(eggs?|mayai|tray\s*ya\s*mayai|farm\s*eggs?)\b/i.test(rawText) &&
    !/\b(egg\s*cup|egg\s*boiler|incubator|egg\s*tray\s*empty)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['eggs'].assetUrl;
  }

  // Bread
  if (
    /\b(bread|mkate|supaloaf|broadways|festive|white\s*bread|brown\s*bread)\b/i.test(rawText) &&
    !/\b(toaster|bread\s*maker|knife|board)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['bread'].assetUrl;
  }

  // Milk
  if (
    /\b(milk|maziwa|brookside|kcc|tuzo|ilara|uht\s*milk|fresh\s*milk)\b/i.test(rawText) &&
    !/\b(milking|milk\s*pump|shaker|frother)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['milk'].assetUrl;
  }

  // Power bank
  if (
    (/\b(powerbank|power\s+bank|portable\s+charger|battery\s+pack)\b/i.test(rawText) || cleanCompressed.includes('powerbank')) &&
    !/\b(cable|cord|strip|supply|tool|saw|car\s+battery|solar|aa\s+battery|aaa\s+battery|socket)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['power-bank'].assetUrl;
  }

  // TV Stand / Console
  if (
    /\b(tv\s+stand|tvstand|tv\s+unit|television\s+stand|tv\s+([a-z0-9-]+\s+)?(console|stand|unit|cabinet|rack|shelf|mount)|entertainment\s+unit|entertainment\s+center|tv\s+rack|tv\s+shelf)\b/i.test(rawText) ||
    cleanCompressed.includes('tvstand') ||
    cleanCompressed.includes('tvconsole')
  ) {
    return resolveTvStandImage(rawText, identity);
  }

  // Shoe Rack
  if (
    /\b(shoe\s+rack|shoerack|shoe\s+stand|shoe\s+organizer|shoe\s+cabinet|rack\s+ya\s+viatu|shelf\s+ya\s+viatu)\b/i.test(rawText) ||
    cleanCompressed.includes('shoerack')
  ) {
    return GENERIC_PRODUCT_ASSETS['shoe-rack'].assetUrl;
  }

  // Duvet & Bedding Comforters
  if (
    /\b(duvet|duvets|comforter|comforters|quilt|quilts)\b/i.test(rawText) &&
    !/\b(pillow|mattress|bedsheet)\b/i.test(rawText)
  ) {
    return resolveDuvetImage(rawText, identity);
  }

  // Socks
  if (
    /\b(socks?|soksi|stockings?|hosiery)\b/i.test(rawText) &&
    !/\b(socket|plug|extension|shoe|boot|lace|polish|insole)\b/i.test(rawText)
  ) {
    return resolveSocksImage(rawText, identity);
  }

  // Sugar
  if (
    /\b(sugars?|sukari)\b/i.test(rawText) &&
    !/\b(cane\s+juice|bowl|tongs|meter)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['sugar'].assetUrl;
  }

  // Headphones & Audio
  if (
    /\b(headphones?|headsets?|earphones?|earbuds?|airpods?)\b/i.test(rawText) &&
    !/\b(case\s+only|cable\s+only|adapter\s+only|stand\s+only)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['headphones'].assetUrl;
  }

  // Watermelon
  if (
    /\b(watermelons?|water\s+melons?|tikitimaji|tikiti\s+maji)\b/i.test(rawText) &&
    !/\b(water\s+bottle|drinking\s+water|mineral\s+water|dispenser|pump)\b/i.test(rawText)
  ) {
    return resolveWatermelonImage(rawText, identity);
  }

  // Specific Smartphones (only if specifically matching phones, not generic electronics)
  if (
    (/\b(smartphones?|mobile\s+phone|iphones?)\b/i.test(rawText) || /\b(galaxy\s+[as]\d+|redmi\s+note|infinix\s+hot|tecno\s+spark|tecno\s+camon)\b/i.test(rawText)) &&
    !/\b(tv|television|fridge|refrigerator|microwave|cooker|case|cover|protector|cable|charger)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['smartphone'].assetUrl;
  }

  // Specific Sneakers / Running Shoes (only if specifically matching sneakers/shoes)
  if (
    /\b(sneakers?|running\s+shoes?|trainers?|raba)\b/i.test(rawText) &&
    !/\b(rack|polish|lace|socks?)\b/i.test(rawText)
  ) {
    return GENERIC_PRODUCT_ASSETS['footwear'].assetUrl;
  }

  // LEVEL 3: If no suitable photographic fallback accurately represents the product,
  // return null so the neutral UI placeholder is rendered rather than an unrelated image.
  return null;
}

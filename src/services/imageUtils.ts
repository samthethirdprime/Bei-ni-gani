// Helper to validate, extract, and normalize genuine, trustworthy product image URLs
import { getGenericProductImage } from './genericImageRegistry';
// Handles: property name variations, markdown wrappers, objects/arrays, relative/protocol-relative URLs
// Rejects generic Unsplash images, search result text, and invalid URLs

export function extractRawImageUrl(raw: unknown): string | null {
  if (!raw) return null;

  // Handle arrays: [url1, url2] or [{ url: ... }]
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const extracted = extractRawImageUrl(item);
      if (extracted) return extracted;
    }
    return null;
  }

  // Handle objects: { url: ... } or { src: ... } or { contentUrl: ... } or { image: ... } or { imageUrl: ... }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const candidate =
      obj.url ||
      obj.src ||
      obj.contentUrl ||
      obj.imageUrl ||
      obj.image ||
      obj.photo ||
      obj.secure_url ||
      obj.thumbnail ||
      obj.previewUrl ||
      obj.original ||
      obj.source;

    if (candidate && candidate !== raw) {
      return extractRawImageUrl(candidate);
    }
    return null;
  }

  if (typeof raw !== 'string') return null;

  let str = raw.trim();
  if (!str) return null;

  // Unescape HTML entities like &amp; -> &
  str = str.replace(/&amp;/g, '&');

  // Strip wrapping quotes
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }

  // Handle Markdown syntax: ![alt](url) or [alt](url) or [![alt](url)](link)
  const mdMatch = str.match(/(?:!\[.*?\]|\[.*?\])\((https?:\/\/[^\s\)]+|\/\/[^\s\)]+)\)/i);
  if (mdMatch) {
    str = mdMatch[1];
  } else {
    // Handle raw wrapped parentheses: (https://...)
    const parenMatch = str.match(/^\((https?:\/\/[^\s\)]+|\/\/[^\s\)]+)\)$/i);
    if (parenMatch) {
      str = parenMatch[1];
    }
  }

  // Handle HTML img tag: <img src="url" ... />
  const htmlImgMatch = str.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
  if (htmlImgMatch) {
    str = htmlImgMatch[1];
  }

  // Handle protocol-relative URL (e.g. //cdn.jumia.co.ke/...)
  if (str.startsWith('//')) {
    str = `https:${str}`;
  }

  // Reject generic Unsplash images or generic placeholders per instructions
  if (str.includes('unsplash.com')) {
    return null;
  }

  // Handle local proxy URLs or real product photo fallback assets e.g. /api/image-proxy?url=..., /product-photos/..., /generic-images/...
  if (str.startsWith('/api/image-proxy') || str.startsWith('/product-photos/') || str.startsWith('/generic-images/')) {
    return str;
  }

  // Validate standard http/https
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    return null;
  }

  if (str.length > 1000) return null;

  // Check URL validity
  try {
    const parsed = new URL(str);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isTrustworthyImageUrl(url?: unknown): boolean {
  return extractRawImageUrl(url) !== null;
}

export function isFallbackProductImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/product-photos/') || url.startsWith('/generic-images/');
}

// Keep isGenericProductImage for backwards compatibility
export const isGenericProductImage = isFallbackProductImage;

export { getGenericProductImage } from './genericImageRegistry';

// Client-side cache for dynamically discovered product photographs
const clientDiscoveryCache = new Map<string, string | null>();
const inFlightDiscoveries = new Map<string, Promise<string | null>>();

export async function discoverProductImageAsync(product: {
  name?: string;
  category?: string;
  brand?: string;
  sizeOrQuantity?: string;
  subcategory?: string;
}): Promise<string | null> {
  const name = product.name?.trim();
  if (!name || name.length < 2) return null;

  const cacheKey = `${name.toLowerCase()}|${(product.brand || '').toLowerCase()}|${(product.sizeOrQuantity || '').toLowerCase()}|${(product.category || '').toLowerCase()}`;

  if (clientDiscoveryCache.has(cacheKey)) {
    return clientDiscoveryCache.get(cacheKey) || null;
  }

  if (inFlightDiscoveries.has(cacheKey)) {
    return inFlightDiscoveries.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const params = new URLSearchParams();
      params.set('name', name);
      if (product.category) params.set('category', product.category);
      if (product.brand) params.set('brand', product.brand);
      if (product.sizeOrQuantity) params.set('size', product.sizeOrQuantity);
      if (product.subcategory) params.set('type', product.subcategory);

      const res = await fetch(`/api/image-fallback?${params.toString()}`);
      if (!res.ok) {
        clientDiscoveryCache.set(cacheKey, null);
        return null;
      }

      const data = await res.json();
      const discoveredUrl = (data && typeof data.imageUrl === 'string' && data.imageUrl.trim())
        ? data.imageUrl.trim()
        : null;

      clientDiscoveryCache.set(cacheKey, discoveredUrl);
      return discoveredUrl;
    } catch {
      clientDiscoveryCache.set(cacheKey, null);
      return null;
    } finally {
      inFlightDiscoveries.delete(cacheKey);
    }
  })();

  inFlightDiscoveries.set(cacheKey, promise);
  return promise;
}

export function getProductImageUrl(product?: { 
  image?: any; 
  imageUrl?: any; 
  vendors?: any[]; 
  name?: string; 
  category?: string; 
  subcategory?: string;
  imageSource?: 'retailer' | 'fallback' | 'discovered' | 'generic';
} | null): string | null {
  if (!product) return null;

  // 1. Level 1 — Exact retailer/source product image (highest priority)
  const direct = extractRawImageUrl(
    product.image || 
    (product as any).imageUrl || 
    (product as any).photoUrl || 
    (product as any).thumbnail || 
    (product as any).picture
  );
  if (direct && !isFallbackProductImage(direct)) {
    return direct;
  }

  // 2. Genuine vendor listing image
  if (Array.isArray(product.vendors)) {
    for (const v of product.vendors) {
      const vImg = extractRawImageUrl(
        v?.image || 
        v?.imageUrl || 
        v?.thumbnail || 
        v?.photoUrl
      );
      if (vImg && !isFallbackProductImage(vImg)) {
        return vImg;
      }
    }
  }

  // 3. If direct image was explicitly already set to a fallback real product photo
  if (direct && isFallbackProductImage(direct)) {
    return direct;
  }

  // 4. Level 2 — Matching curated local photographic asset
  const fallbackPhoto = getGenericProductImage(product);
  if (fallbackPhoto) {
    return fallbackPhoto;
  }

  // 5. If product was already dynamically discovered
  if (direct && product.imageSource === 'discovered') {
    return direct;
  }

  // 6. Level 3/4 — Neutral placeholder (no suitable matching image yet)
  return null;
}

export function getProductImageWithSource(product?: {
  image?: any;
  imageUrl?: any;
  vendors?: any[];
  name?: string;
  category?: string;
  subcategory?: string;
  imageSource?: 'retailer' | 'fallback' | 'discovered' | 'generic';
} | null): { url: string | null; imageSource: 'retailer' | 'fallback' | 'discovered' } {
  if (!product) return { url: null, imageSource: 'fallback' };

  // Level 1: Exact retailer image
  const direct = extractRawImageUrl(
    product.image || 
    (product as any).imageUrl || 
    (product as any).photoUrl || 
    (product as any).thumbnail || 
    (product as any).picture
  );
  if (direct && !isFallbackProductImage(direct)) {
    if (product.imageSource === 'discovered') {
      return { url: direct, imageSource: 'discovered' };
    }
    return { url: direct, imageSource: 'retailer' };
  }

  if (Array.isArray(product.vendors)) {
    for (const v of product.vendors) {
      const vImg = extractRawImageUrl(
        v?.image || 
        v?.imageUrl || 
        v?.thumbnail || 
        v?.photoUrl
      );
      if (vImg && !isFallbackProductImage(vImg)) {
        return { url: vImg, imageSource: 'retailer' };
      }
    }
  }

  // Level 2: Real matching fallback photograph
  const fallbackPhoto = getGenericProductImage(product);
  if (fallbackPhoto) {
    return { url: fallbackPhoto, imageSource: 'fallback' };
  }

  if (direct && product.imageSource === 'discovered') {
    return { url: direct, imageSource: 'discovered' };
  }

  return { url: null, imageSource: 'fallback' };
}


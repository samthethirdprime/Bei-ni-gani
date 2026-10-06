// Helper to validate, extract, and normalize genuine, trustworthy product image URLs
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

  // If URL is an /api/image-proxy wrapper, unwrap back to the direct image URL
  if (str.startsWith('/api/image-proxy?url=')) {
    try {
      const rawParam = str.replace('/api/image-proxy?url=', '');
      const unwrapped = decodeURIComponent(rawParam);
      if (unwrapped.startsWith('http://') || unwrapped.startsWith('https://')) {
        str = unwrapped;
      }
    } catch {
      // Keep str
    }
  }

  // Reject generic Unsplash images or generic placeholders per instructions
  if (str.includes('unsplash.com')) {
    return null;
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

export function getProductImageUrl(product?: { image?: any; imageUrl?: any; vendors?: any[] } | null): string | null {
  if (!product) return null;
  const direct = extractRawImageUrl(
    product.image || 
    (product as any).imageUrl || 
    (product as any).photoUrl || 
    (product as any).thumbnail || 
    (product as any).picture
  );
  if (direct) return direct;

  // If top-level image was not set, search vendors for any verified vendor image
  if (Array.isArray(product.vendors)) {
    for (const v of product.vendors) {
      const vImg = extractRawImageUrl(
        v?.image || 
        v?.imageUrl || 
        v?.thumbnail || 
        v?.photoUrl
      );
      if (vImg) return vImg;
    }
  }

  return null;
}


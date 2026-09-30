// Helper to validate genuine, usable, trustworthy product image URLs
// Rejects generic Unsplash images, search result text, markdown strings, and invalid URLs

export function isTrustworthyImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  if (trimmed.includes('unsplash.com')) return false;
  if (trimmed.includes('[') || trimmed.includes(']') || trimmed.includes('<') || trimmed.includes('>')) return false;
  if (trimmed.includes('(') && trimmed.includes(')') && trimmed.includes('http')) return false;
  if (trimmed.length > 500) return false;
  return true;
}

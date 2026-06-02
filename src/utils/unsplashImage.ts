import { UNSPLASH_ACCESS_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'unsplash_cache__';

// In-memory layer — avoids AsyncStorage reads on re-renders
const memCache = new Map<string, string>();

async function readCache(key: string): Promise<string | null> {
  if (memCache.has(key)) return memCache.get(key)!;
  try {
    const val = await AsyncStorage.getItem(STORAGE_PREFIX + key);
    if (val) memCache.set(key, val);
    return val;
  } catch {
    return null;
  }
}

async function writeCache(key: string, url: string): Promise<void> {
  memCache.set(key, url);
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, url);
  } catch {}
}

async function fetchUnsplash(query: string, orientation: string): Promise<string> {
  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=${orientation}&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data?.urls?.regular ?? '';
}

export async function getUnsplashImage(
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'portrait',
): Promise<string> {
  const key = `${query}__${orientation}`;

  const cached = await readCache(key);
  if (cached) return cached;

  try {
    const imageUrl = await fetchUnsplash(query, orientation);
    if (imageUrl) await writeCache(key, imageUrl);
    return imageUrl;
  } catch {
    return '';
  }
}

export function buildProductQuery(name: string, brandName?: string): string {
  const brand = brandName?.toLowerCase().trim();
  const productKeywords = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join(' ');
  return brand ? `${brand} ${productKeywords}` : productKeywords;
}

import { useState, useEffect } from 'react';
import { getUnsplashImage, buildProductQuery } from '../utils/unsplashImage';

type Result = { uri: string; loading: boolean };

export function useProductImage(
  name: string,
  brandName?: string,
  orientation: 'portrait' | 'landscape' | 'squarish' = 'portrait',
): Result {
  const [uri, setUri]         = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function resolve() {
      const fullQuery = buildProductQuery(name, brandName);
      if (!fullQuery) { setLoading(false); return; }

      let url = await getUnsplashImage(fullQuery, orientation);

      if (!url && brandName) {
        url = await getUnsplashImage(brandName.toLowerCase().trim(), orientation);
      }

      if (!url) {
        const fallbackWord = name.split(' ').find(w => w.length > 3) ?? 'fashion';
        url = await getUnsplashImage(fallbackWord.toLowerCase(), orientation);
      }

      if (!cancelled) { if (url) setUri(url); setLoading(false); }
    }
    resolve();
    return () => { cancelled = true; };
  }, [name, brandName, orientation]);

  return { uri, loading };
}

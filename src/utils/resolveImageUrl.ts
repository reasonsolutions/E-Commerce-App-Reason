const IMAGE_BASE = 'http://122.175.15.28:8110/';

export function resolveImageUrl(path: string | undefined): string {
  if (!path) return '';
  const first = path.split(';')[0].replace(/[\r\n\t]/g, '').trim();
  if (!first) return '';
  if (first.startsWith('http')) return first;
  return `${IMAGE_BASE}${first}`;
}

export function fallbackImageUrl(seed: number | string, width = 400, height = 500): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

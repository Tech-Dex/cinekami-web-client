export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

export const TMDB_IMAGE_BASE_URL = (import.meta.env.VITE_TMDB_IMAGE_BASE_URL as string | undefined) || 'https://image.tmdb.org/t/p/w342';

export function resolveImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (TMDB_IMAGE_BASE_URL) {
    const base = TMDB_IMAGE_BASE_URL.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }
  return undefined;
}

export const ALLOWED_SORT_BY = [
  'popularity',
  'release_date',
  'solo_friends',
  'couple',
  'streaming',
  'arr',
] as const;

export type SortBy = typeof ALLOWED_SORT_BY[number];
export type SortDir = 'asc' | 'desc';

import { API_BASE_URL } from '../config';
import type {
  ActiveMoviesParams,
  HealthResponse,
  Movie,
  PaginatedResponse,
  Snapshot,
  SnapshotParams,
  Tally,
} from './types';

function buildQuery(params: Record<string, unknown> | undefined) {
  const q = new URLSearchParams();
  if (!params) return '';
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  const isJson = !!contentType && contentType.includes('application/json');
  if (!res.ok) {
    const data = isJson ? ((await res.json().catch(() => ({}))) as { message?: string }) : undefined;
    const message = data?.message ?? res.statusText;
    throw Object.assign(new Error(message), { status: res.status });
  }
  if (isJson) {
    return res.json() as Promise<T>;
  }
  return Promise.resolve(undefined as unknown as T);
}

const base = API_BASE_URL?.replace(/\/$/, '') || '';

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${base}/health`);
  return handleResponse<HealthResponse>(res);
}

export async function getActiveMovies(params: ActiveMoviesParams): Promise<PaginatedResponse<Movie>> {
  const res = await fetch(`${base}/movies/active${buildQuery(params)}`);
  return handleResponse<PaginatedResponse<Movie>>(res);
}

export async function getSnapshots(year: number, month: number, params: SnapshotParams): Promise<PaginatedResponse<Snapshot>> {
  const res = await fetch(`${base}/snapshots/${year}/${month}${buildQuery(params)}`);
  return handleResponse<PaginatedResponse<Snapshot>>(res);
}

export async function getTallies(movieId: number, cursor?: string | null, limit?: number): Promise<PaginatedResponse<Tally>> {
  const res = await fetch(`${base}/movies/${movieId}/tallies${buildQuery({ cursor, limit })}`);
  return handleResponse<PaginatedResponse<Tally>>(res);
}

export async function postVote(movieId: number, body: { category: string; fingerprint: string }): Promise<{ inserted: boolean; message: string }> {
  const res = await fetch(`${base}/movies/${movieId}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<{ inserted: boolean; message: string }>(res);
}

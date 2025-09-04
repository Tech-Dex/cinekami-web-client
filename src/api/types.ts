export type ApiError = {
  status: number;
  message: string;
};

export type HttpError = Error & { status?: number };

export type PaginatedResponse<T> = {
  items: T[];
  count: number;
  total: number;
  next_cursor?: string | null;
};

export type HealthResponse = {
  status: 'ok';
  service: string;
  uptime_seconds: number;
};

export type Tallies = Record<string, number> | undefined;

export type Movie = {
  id: number;
  title: string;
  release_date: string; // ISO date
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  tallies?: Tallies;
  // Optional: category the current client/fingerprint has voted for
  voted_category?: 'solo_friends' | 'couple' | 'streaming' | 'arr' | null;
  // Optional external links
  cinemagia_url?: string | null;
  imdb_url?: string | null;
};

export type Snapshot = {
  month: string; // YYYY-MM
  movie_id: number;
  tallies?: Tallies;
  closed_at: string; // ISO datetime
  title: string;
  release_date: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  // Optional: voted category for this snapshot for the current fingerprint
  voted_category?: 'solo_friends' | 'couple' | 'streaming' | 'arr' | null;
  // Optional external links
  cinemagia_url?: string | null;
  imdb_url?: string | null;
};

export type Tally = {
  movie_id: number;
  category: string;
  count: number;
};

export type ActiveMoviesParams = {
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  min_popularity?: number;
  max_popularity?: number;
  cursor?: string | null;
  limit?: number;
};

export type SnapshotParams = Omit<ActiveMoviesParams, 'cursor'> & { cursor?: string | null };

export type VoteResponse = {
  inserted: boolean;
  message: string;
  tallies?: Tallies;
  voted_category?: 'solo_friends' | 'couple' | 'streaming' | 'arr' | null;
};

// New: available snapshots (years and months) response shape
export type AvailableSnapshotsResponse = {
  items: Array<{ year: number; months: number[] }>;
};

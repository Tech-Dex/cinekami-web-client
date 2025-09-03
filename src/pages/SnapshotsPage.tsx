import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Center, Container, Group, Loader, SimpleGrid, Stack, Text, Paper, NavLink, Box } from '@mantine/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getSnapshots, getAvailableSnapshots } from '../api/client';
import type { Movie, PaginatedResponse, Snapshot } from '../api/types';
import { MovieCard } from '../components/MovieCard';
import { MovieFilters, type Filters } from '../components/MovieFilters';
import { EmptyState } from '../components/EmptyState';
import { InfiniteLoader } from '../components/InfiniteLoader';
import { getFingerprintV2 } from '../utils/fingerprintV2';

const DEFAULT_FILTERS: Filters = {
  sort_by: 'popularity',
  sort_dir: 'desc',
  min_popularity: null,
  max_popularity: null,
  layout: 'grid',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toMovieLike(s: Snapshot): Movie {
  return {
    id: s.movie_id,
    title: s.title,
    release_date: s.release_date,
    overview: s.overview,
    poster_path: s.poster_path,
    backdrop_path: s.backdrop_path,
    popularity: s.popularity,
    tallies: s.tallies,
    // include voted_category so MovieCard can reflect client's vote
    voted_category: (s as Snapshot).voted_category ?? null,
  };
}

export default function SnapshotsPage() {
  const now = dayjs();
  const [year, setYear] = useState<number>(now.year());
  const [month, setMonth] = useState<number>(now.month() + 1); // dayjs month is 0-based
  const [available, setAvailable] = useState<Array<{ year: number; months: number[] }>>([]);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [fp, setFp] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    const ac = new AbortController();
    getAvailableSnapshots(ac.signal)
      .then((res) => {
        if (aborted) return;
        const items = res.items || [];
        setAvailable(items);
        // If current selection isn’t available, pick the latest available
        const hasCurrent = items.some((y) => y.year === year && y.months?.includes(month));
        if (!hasCurrent && items.length > 0) {
          const sortedYears = [...items].sort((a, b) => b.year - a.year);
          const latestYear = sortedYears[0];
          const latestMonth = [...(latestYear.months || [])].sort((a, b) => b - a)[0];
          if (latestYear && latestMonth) {
            setYear(latestYear.year);
            setMonth(latestMonth);
          }
        }
      })
      .catch(() => { if (!aborted) setAvailable([]); })
      .finally(() => { /* no-op */ });
    return () => { aborted = true; ac.abort(); };
  }, [month, year]);

  useEffect(() => {
    let mounted = true;
    getFingerprintV2().then((f) => { if (mounted) setFp(f); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const queryKey = useMemo(() => ['snapshots', { year, month, ...filters }, fp] as const, [year, month, filters, fp]);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<PaginatedResponse<Snapshot>>({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      return getSnapshots(year, month, {
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir,
        min_popularity: filters.min_popularity ?? undefined,
        max_popularity: filters.max_popularity ?? undefined,
        cursor: pageParam as string | null,
        limit: 18, // multiple of 3 for balanced grid
      }, fp ?? undefined);
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const items = (data?.pages ?? []).flatMap((p) => p.items);

  const handleFilterChange = useCallback((next: Filters) => {
    setFilters(next);
    refetch();
  }, [refetch]);

  const cols = filters.layout === 'grid' ? { base: 1, md: 2 } : { base: 1 };

  return (
    <Container size={1560}>
      <Group align="start" gap="lg" wrap="wrap">
        <Box w={220} style={{ position: 'sticky', top: 64, alignSelf: 'flex-start', zIndex: 2 }}>
          <Paper withBorder p="sm" shadow="xs">
            <Stack gap={4}>
              {available.map((y) => (
                <NavLink key={y.year} label={String(y.year)} defaultOpened={y.year === year} color="orange">
                  {y.months.map((m) => (
                    <NavLink
                      key={m}
                      label={MONTH_NAMES[m - 1]}
                      active={y.year === year && m === month}
                      color="orange"
                      onClick={() => { setYear(y.year); setMonth(m); }}
                    />
                  ))}
                </NavLink>
              ))}
            </Stack>
          </Paper>
        </Box>

        <Stack style={{ flex: 1, minWidth: 0 }}>
          <Paper p="md" withBorder shadow="xs" style={{ position: 'sticky', top: 64, zIndex: 1, backdropFilter: 'blur(4px)' }}>
            <MovieFilters value={filters} onChange={handleFilterChange} />
          </Paper>

          {isError && (
            <Alert color="red" title="Failed to load snapshots">{error?.message || 'Error'}</Alert>
          )}

          {!isFetching && items.length === 0 && !isError && (
            <EmptyState title="No snapshots" message="Try another month or adjust filters." />
          )}

          <SimpleGrid cols={cols} spacing="lg">
            {items.map((s) => (
              <MovieCard
                key={`${s.month}-${s.movie_id}`}
                movie={toMovieLike(s)}
                layout={filters.layout}
                showActions={false}
              />
            ))}
          </SimpleGrid>

          <Center>
            {(isFetching && !isFetchingNextPage) && <Loader />}
          </Center>

          <InfiniteLoader
            onLoad={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          />

          <Center>
            {!hasNextPage && items.length > 0 && (
              <Text c="dimmed" size="sm">No more results</Text>
            )}
          </Center>
        </Stack>
      </Group>
    </Container>
  );
}

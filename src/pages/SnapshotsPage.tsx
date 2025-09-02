import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Center, Container, Group, Loader, NumberInput, SimpleGrid, Stack, Text, Paper } from '@mantine/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getSnapshots } from '../api/client';
import type { Movie, PaginatedResponse, Snapshot } from '../api/types';
import { MovieCard } from '../components/MovieCard';
import { MovieFilters, type Filters } from '../components/MovieFilters';
import { EmptyState } from '../components/EmptyState';
import { InfiniteLoader } from '../components/InfiniteLoader';

const DEFAULT_FILTERS: Filters = {
  sort_by: 'popularity',
  sort_dir: 'desc',
  min_popularity: null,
  max_popularity: null,
  layout: 'grid',
};

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
  };
}

export default function SnapshotsPage() {
  const now = dayjs();
  const [year, setYear] = useState<number>(now.year());
  const [month, setMonth] = useState<number>(now.month() + 1); // dayjs month is 0-based

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const queryKey = useMemo(() => ['snapshots', { year, month, ...filters }] as const, [year, month, filters]);

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
      });
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const items = (data?.pages ?? []).flatMap((p) => p.items);

  const handleGo = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFilterChange = useCallback((next: Filters) => {
    setFilters(next);
    refetch();
  }, [refetch]);

  const cols = filters.layout === 'grid' ? { base: 1, md: 2 } : { base: 1 };

  return (
    <Container size="xl">
      <Stack>
        <Paper p="md" withBorder shadow="xs" style={{ position: 'sticky', top: 64, zIndex: 2, backdropFilter: 'blur(4px)' }}>
          <Group>
            <NumberInput label="Year" value={year} onChange={(v) => setYear(typeof v === 'number' ? v : year)} min={2000} max={2100} w={120} />
            <NumberInput label="Month" value={month} onChange={(v) => setMonth(typeof v === 'number' ? Math.min(12, Math.max(1, v)) : month)} min={1} max={12} w={100} />
            <Button variant="default" onClick={handleGo}>Go</Button>
          </Group>
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
    </Container>
  );
}

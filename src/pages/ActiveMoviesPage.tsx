import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Center, Container, Loader, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { getActiveMovies, postVote } from '../api/client';
import type { Movie, PaginatedResponse, HttpError } from '../api/types';
import { MovieCard } from '../components/MovieCard';
import { MovieFilters, type Filters } from '../components/MovieFilters';
import { getFingerprint } from '../utils/fingerprint';
import { EmptyState } from '../components/EmptyState';
import { InfiniteLoader } from '../components/InfiniteLoader';

const DEFAULT_FILTERS: Filters = {
  sort_by: 'popularity',
  sort_dir: 'desc',
  min_popularity: null,
  max_popularity: null,
  layout: 'grid',
};

export default function ActiveMoviesPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['movies', 'active', filters] as const, [filters]);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<PaginatedResponse<Movie>>({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const res = await getActiveMovies({
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir,
        min_popularity: filters.min_popularity ?? undefined,
        max_popularity: filters.max_popularity ?? undefined,
        cursor: pageParam as string | null,
        limit: 18, // multiple of 3 for balanced grid
      });
      return res;
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const items = (data?.pages ?? []).flatMap((p) => p.items);

  const handleFilterChange = useCallback((next: Filters) => {
    setFilters(next);
    queryClient.invalidateQueries({ queryKey: ['movies', 'active'] });
  }, [queryClient]);

  const handleVote = useCallback(async (movieId: number, category: 'solo_friends' | 'couple' | 'streaming' | 'arr') => {
    try {
      const fp = await getFingerprint();
      const res = await postVote(movieId, { category, fingerprint: fp });
      notifications.show({
        title: res.inserted ? 'Vote recorded' : 'Duplicate vote',
        message: res.message,
      });
      queryClient.invalidateQueries({ queryKey: ['movies', 'active'] });
    } catch (e: unknown) {
      const err = e as HttpError;
      const status = err?.status;
      const message = err?.message || 'Unexpected error';
      notifications.show({ color: 'red', title: `Error${status ? ` ${status}` : ''}`, message });
    }
  }, [queryClient]);

  const cols = filters.layout === 'grid' ? { base: 1, md: 2 } : { base: 1 };

  return (
    <Container size="xl">
      <Stack>
        <Paper p="md" withBorder shadow="xs" style={{ position: 'sticky', top: 64, zIndex: 2, backdropFilter: 'blur(4px)' }}>
          <MovieFilters value={filters} onChange={handleFilterChange} />
        </Paper>

        {isError && (
          <Alert color="red" title="Failed to load movies">{error?.message || 'Error'}</Alert>
        )}

        {!isFetching && items.length === 0 && !isError && (
          <EmptyState title="No movies" message="Try adjusting filters." />
        )}

        <SimpleGrid cols={cols} spacing="lg">
          {items.map((m) => (
            <MovieCard
              key={m.id}
              movie={m}
              layout={filters.layout}
              onVote={(cat) => handleVote(m.id, cat)}
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

        <Center>
          <Button variant="subtle" onClick={() => refetch()}>Refresh</Button>
        </Center>
      </Stack>
    </Container>
  );
}

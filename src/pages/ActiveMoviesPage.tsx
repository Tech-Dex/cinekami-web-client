import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Alert, Button, Center, Container, Loader, Paper, SimpleGrid, Stack, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { getActiveMovies, postVote } from '../api/client';
import type { Movie, PaginatedResponse, HttpError } from '../api/types';
import { MovieCard } from '../components/MovieCard';
import { MovieCardSkeleton } from '../components/MovieCardSkeleton';
import { MovieFilters, type Filters } from '../components/MovieFilters';
import { getFingerprintV2 } from '../utils/fingerprintV2';
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

  // Load and store client fingerprint
  const [fp, setFp] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    getFingerprintV2().then((f) => { if (mounted) setFp(f); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const queryKey = useMemo(() => ['movies', 'active', filters, fp] as const, [filters, fp]);

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
      return getActiveMovies({
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
    enabled: !!fp,
  });

  const items = (data?.pages ?? []).flatMap((p) => p.items);

  const handleFilterChange = useCallback((next: Filters) => {
    setFilters(next);
    refetch();
  }, [refetch]);

  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  // hide/show filters on scroll with a small debounce to avoid flicker
  const [showFilters, setShowFilters] = useState(true);
  // keep a ref in sync so the scroll handler (added once) can read latest value without re-subscribing
  const showFiltersRef = useRef(showFilters);
  useEffect(() => { showFiltersRef.current = showFilters; }, [showFilters]);

  // compute a sticky top that matches the Paper style below
  const stickyTop = isSm ? 80 : 64;

  useEffect(() => {
    const prev = { y: window.scrollY };
    let ticking = false;
    let debounceId: number | null = null;
    const nearTopThreshold = stickyTop; // ensure we always show when at/near the top sentinel

    const handle = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;

        // Always show when near the top; also cancel any pending hide
        if (y <= nearTopThreshold) {
          if (debounceId) { window.clearTimeout(debounceId); debounceId = null; }
          if (!showFiltersRef.current) setShowFilters(true);
          prev.y = y;
          ticking = false;
          return;
        }

        const diff = y - prev.y;
        if (Math.abs(diff) > 10) {
          const desired = diff < 0; // show on scroll up; hide on scroll down
          if (desired !== showFiltersRef.current) {
            if (debounceId) window.clearTimeout(debounceId);
            debounceId = window.setTimeout(() => {
              setShowFilters(desired);
              debounceId = null;
            }, 140);
          }
        }
        prev.y = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => {
      window.removeEventListener('scroll', handle);
      if (debounceId) window.clearTimeout(debounceId);
    };
  }, [stickyTop]);

  // Track which movie is currently posting a vote
  const [votingId, setVotingId] = useState<number | null>(null);

  const handleVote = useCallback(async (movieId: number, category: 'solo_friends' | 'couple' | 'streaming' | 'arr') => {
    try {
      setVotingId(movieId);
      const f = fp ?? await getFingerprintV2();
      const res = await postVote(movieId, { category }, f ?? undefined);

      // Optimistically update cached pages so UI reflects the vote immediately
      queryClient.setQueriesData({ queryKey: ['movies', 'active'] }, (oldData: InfiniteData<PaginatedResponse<Movie>> | undefined) => {
        if (!oldData) return oldData;
        const pages = oldData.pages?.map((page) => ({
          ...page,
          items: page.items.map((m) => (
            m.id === movieId
              ? {
                  ...m,
                  tallies: res.tallies ?? m.tallies,
                  voted_category: (res.voted_category ?? m.voted_category ?? null) as Movie['voted_category'],
                }
              : m
          )),
        }));
        return { ...oldData, pages } as InfiniteData<PaginatedResponse<Movie>>;
      });

      notifications.show({
        title: res.inserted ? 'Vote recorded' : 'Duplicate vote',
        message: res.message,
      });
      // Mark data stale but don't refetch active queries immediately to avoid overwriting optimistic update
      queryClient.invalidateQueries({ queryKey: ['movies', 'active'], refetchType: 'inactive' });
    } catch (e: unknown) {
      const err = e as HttpError;
      const status = err?.status;
      const message = err?.message || 'Unexpected error';
      notifications.show({ color: 'red', title: `Error${status ? ` ${status}` : ''}`, message });
    } finally {
      setVotingId(null);
    }
  }, [fp, queryClient]);

  const cols = filters.layout === 'grid' ? { base: 1, md: 2 } : { base: 1 };

  return (
    <Container size="xl">
      <Stack>
        <Paper p="md" withBorder shadow="xs" style={{ position: 'sticky', top: isSm ? 80 : 64, zIndex: 2, backdropFilter: 'blur(4px)', transition: 'transform 190ms ease', transform: showFilters ? 'translateY(0)' : 'translateY(-120%)' }}>
          <MovieFilters value={filters} onChange={handleFilterChange} />
        </Paper>

        {isError && (
          <Alert color="red" title="Failed to load movies">{error?.message || 'Error'}</Alert>
        )}

        {!isFetching && items.length === 0 && !isError && (
          <EmptyState title="No movies" message="Try adjusting filters." />
        )}

        <SimpleGrid cols={cols} spacing="lg">
          {(isFetching && items.length === 0) ? (
            Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={`s-${i}`} layout={filters.layout} />
            ))
          ) : (
            items.map((m, idx) => (
              <MovieCard
                key={m.id}
                movie={m}
                layout={filters.layout}
                onVote={(cat) => handleVote(m.id, cat)}
                isVoting={votingId === m.id}
                priority={idx < 4}
              />
            ))
          )}
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

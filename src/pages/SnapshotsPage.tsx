import { useCallback, useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react';
import { Alert, Center, Container, Loader, SimpleGrid, Stack, Text, Paper, NavLink, useMantineTheme, Modal, Button, Group } from '@mantine/core';
import { useMediaQuery, useWindowScroll } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getSnapshots, getAvailableSnapshots } from '../api/client';
import type { Movie, PaginatedResponse, Snapshot } from '../api/types';
import { MovieCard } from '../components/MovieCard';
import { MovieCardSkeleton } from '../components/MovieCardSkeleton';
import { MovieFilters, type Filters } from '../components/MovieFilters';
import { EmptyState } from '../components/EmptyState';
import { InfiniteLoader } from '../components/InfiniteLoader';
import { getFingerprintV2 } from '../utils/fingerprintV2';
import { IconCalendar, IconChevronDown } from '@tabler/icons-react';

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
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  // ref + state to indicate modal inner scrollability and position
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const [modalScrollable, setModalScrollable] = useState(false);
  const [modalAtBottom, setModalAtBottom] = useState(false);

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
  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const headerHeight = isSm ? 72 : 56; // match RootLayout AppShell header heights
  const [scroll] = useWindowScroll();
  // left column fixed width
  const LEFT_COL_WIDTH = 280;
  // placeholder ref and measured values for fixed menu on desktop
  const leftPlaceholderRef = useRef<HTMLDivElement | null>(null);
  const [fixedLeft, setFixedLeft] = useState<number | null>(null);
  const [fixedWidth, setFixedWidth] = useState<number | null>(null);
  const [fixedReady, setFixedReady] = useState(false);

  // Hide/show filters when scrolling: hide on scroll down, reveal on small upward scroll
  // Debounced to avoid flicker on small/jittery scrolls
  useEffect(() => {
    const prev = { y: 0 };
    let ticking = false;
    let debounceId: number | null = null;
    const handle = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // if we've reached (or nearly reached) the top, always show filters immediately
          if (window.scrollY <= 50 && !showFilters) {
            if (debounceId) window.clearTimeout(debounceId);
            setShowFilters(true);
            prev.y = 0;
            ticking = false;
            return;
          }
          const diff = window.scrollY - prev.y;
          if (Math.abs(diff) > 10) {
            const desired = diff < 0 || window.scrollY < headerHeight + 20; // show when scrolling up or near top
            if (desired !== showFilters) {
              if (debounceId) window.clearTimeout(debounceId);
              debounceId = window.setTimeout(() => {
                setShowFilters(desired);
                debounceId = null;
              }, 140);
            }
          }
          prev.y = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handle);
    return () => {
      window.removeEventListener('scroll', handle);
      if (debounceId) window.clearTimeout(debounceId);
    };
  }, [showFilters, headerHeight]);

  // detect whether modal content is scrollable and whether it's scrolled to bottom
  useEffect(() => {
    const el = modalContentRef.current;
    if (!el) return;
    const check = () => {
      setModalScrollable(el.scrollHeight > el.clientHeight + 1);
      setModalAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
    };
    // initial check
    check();
    el.addEventListener('scroll', check);
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [isJumpOpen, available]);

  // On desktop, render the left menu as fixed so it remains visible even at bottom.
  // Measure the placeholder's left/width before paint using useLayoutEffect to avoid flicker.
  useLayoutEffect(() => {
    if (isSm) return; // only for desktop
    const el = leftPlaceholderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // add horizontal inset to match Stack/paper padding and avoid overflow
    const H_INSET = 8; // match vertical spacing used elsewhere
    setFixedLeft(rect.left + window.scrollX + H_INSET);
    setFixedWidth(Math.max(0, rect.width - H_INSET * 2));
    // mark ready so we apply fixed positioning
    setFixedReady(true);
    const onResize = () => {
      const r = el.getBoundingClientRect();
      setFixedLeft(r.left + window.scrollX + H_INSET);
      setFixedWidth(Math.max(0, r.width - H_INSET * 2));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isSm, available]);

  // Pure CSS sticky for left panel: no JS pinning to avoid flicker.
  return (
    <Container size={1560}>
      <Stack style={{ flex: 1, minWidth: 0 }}>
        {isSm ? (
          // mobile: stacked layout (filters on top, year/month below)
          <>
            <Paper p="md" withBorder shadow="xs" style={{ position: 'sticky', top: headerHeight + 8, zIndex: 1500, willChange: 'transform', backdropFilter: 'blur(4px)', transition: 'transform 190ms ease', transform: showFilters ? 'translateY(0)' : 'translateY(-120%)' }}>
              <MovieFilters value={filters} onChange={handleFilterChange} />
            </Paper>

            <Paper withBorder p="sm" shadow="xs" style={{ position: 'relative', marginTop: 8, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', willChange: 'transform' }}>
              <Stack gap={4}>
                {available.map((y) => (
                  <NavLink
                    key={y.year}
                    label={String(y.year)}
                    defaultOpened={y.year === year}
                    color="orange"
                  >
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

            {isError && (
              <Alert color="red" title="Failed to load snapshots">{error?.message || 'Error'}</Alert>
            )}

            {!isFetching && items.length === 0 && !isError && (
              <EmptyState title="No snapshots" message="Try another month or adjust filters." />
            )}

            <SimpleGrid cols={cols} spacing="lg">
              {(isFetching && items.length === 0) ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <MovieCardSkeleton key={`s-${i}`} layout={filters.layout} />
                ))
              ) : (
                items.map((s, idx) => (
                  <MovieCard
                    key={`${s.month}-${s.movie_id}`}
                    movie={toMovieLike(s)}
                    layout={filters.layout}
                    showActions={false}
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

            {/* Floating Jump button only on mobile */}
            {(isSm && scroll.y > 300 && available.length > 0) && (
              <Button
                variant="filled"
                color="orange"
                radius="xl"
                size="sm"
                onClick={() => setIsJumpOpen(true)}
                style={{ position: 'fixed', right: 18, bottom: 20, zIndex: 1002 }}
                leftSection={<IconCalendar size={16} />}
              >
                Jump
              </Button>
            )}

            <Modal opened={isJumpOpen} onClose={() => setIsJumpOpen(false)} title="Jump to snapshot" centered>
              <div ref={modalContentRef} style={{ maxHeight: '33.333vh', overflowY: 'auto', paddingRight: 8, position: 'relative' }}>
                <div style={{ height: 6, width: 48, borderRadius: 999, background: 'var(--mantine-color-grayscale-4, rgba(0,0,0,0.08))', margin: '6px auto 8px', opacity: 0.9 }} />
                <Stack>
                  {available.length === 0 ? (
                    <Text size="sm" c="dimmed">No snapshots available</Text>
                  ) : (
                    available.map((y) => (
                      <div key={y.year}>
                        <Text fw={600} mb={6}>{y.year}</Text>
                        <Group gap="xs" style={{ marginBottom: 8 }}>
                          {y.months.map((m) => (
                            <Button
                              key={`${y.year}-${m}`}
                              size="xs"
                              variant={y.year === year && m === month ? 'filled' : 'outline'}
                              color="orange"
                              onClick={() => {
                                setYear(y.year);
                                setMonth(m);
                                setIsJumpOpen(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              {MONTH_NAMES[m - 1]}
                            </Button>
                          ))}
                        </Group>
                      </div>
                    ))
                  )}
                </Stack>
                {modalScrollable && !modalAtBottom && (
                  <div style={{ position: 'sticky', bottom: 6, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                    <IconChevronDown size={18} color="var(--mantine-color-dimmed)" />
                  </div>
                )}
              </div>
            </Modal>
          </>
        ) : (
          // desktop: two-column layout with left fixed year/month and right column containing filters + results
          <div style={{ display: 'grid', gridTemplateColumns: `${LEFT_COL_WIDTH}px 1fr`, columnGap: 'var(--mantine-spacing-md)', alignItems: 'start' }}>
            {/* placeholder to reserve space and provide measurement point for the fixed menu */}
            <div ref={leftPlaceholderRef} style={{ alignSelf: 'start', width: `${LEFT_COL_WIDTH}px`, height: 'auto', marginTop: 8 }}>
              {/* render the menu as a fixed element when measurements are ready; otherwise render it normally (sticky) */}
              {fixedReady && fixedLeft !== null && fixedWidth !== null ? (
                <div style={{ position: 'fixed', top: headerHeight + 8, left: fixedLeft, width: fixedWidth, zIndex: 1001, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto', boxSizing: 'border-box' }}>
                  <Paper withBorder p="sm" shadow="xs" style={{ width: '100%' }}>
                    <Stack gap={4}>
                      {available.map((y) => (
                        <NavLink key={y.year} label={String(y.year)} defaultOpened={y.year === year} color="orange">
                          {y.months.map((m) => (
                            <NavLink key={m} label={MONTH_NAMES[m - 1]} active={y.year === year && m === month} color="orange" onClick={() => { setYear(y.year); setMonth(m); }} />
                          ))}
                        </NavLink>
                      ))}
                    </Stack>
                  </Paper>
                </div>
              ) : (
                <Paper withBorder p="sm" shadow="xs" style={{ /* changed: add small gap from header to match filter spacing */ position: 'sticky', top: headerHeight + 8, alignSelf: 'start', zIndex: 10, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
                  <Stack gap={4}>
                    {available.map((y) => (
                      <NavLink key={y.year} label={String(y.year)} defaultOpened={y.year === year} color="orange">
                        {y.months.map((m) => (
                          <NavLink key={m} label={MONTH_NAMES[m - 1]} active={y.year === year && m === month} color="orange" onClick={() => { setYear(y.year); setMonth(m); }} />
                        ))}
                      </NavLink>
                    ))}
                  </Stack>
                </Paper>
              )}
            </div>

            <div>
              <Paper p="md" withBorder shadow="xs" style={{ position: 'sticky', top: headerHeight + 8, zIndex: 1500, backdropFilter: 'blur(4px)', willChange: 'transform', transition: 'transform 190ms ease', transform: showFilters ? 'translateY(0)' : 'translateY(-120%)' }}>
                <MovieFilters value={filters} onChange={handleFilterChange} />
              </Paper>

              {isError && (
                <Alert color="red" title="Failed to load snapshots">{error?.message || 'Error'}</Alert>
              )}

              {!isFetching && items.length === 0 && !isError && (
                <EmptyState title="No snapshots" message="Try another month or adjust filters." />
              )}

              <SimpleGrid cols={cols} spacing="lg">
                {(isFetching && items.length === 0) ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <MovieCardSkeleton key={`s-${i}`} layout={filters.layout} />
                  ))
                ) : (
                  items.map((s, idx) => (
                    <MovieCard
                      key={`${s.month}-${s.movie_id}`}
                      movie={toMovieLike(s)}
                      layout={filters.layout}
                      showActions={false}
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
            </div>
          </div>
        )}
      </Stack>
    </Container>
  );
}

import { Badge, Box, Button, Card, Group, Image, Stack, Text, Title, Tooltip, useMantineTheme, Skeleton } from '@mantine/core';
import { IconHeart, IconHome2, IconUsers, IconDeviceTv } from '@tabler/icons-react';
import type { Movie } from '../api/types';
import { resolveImageUrl, buildTmdbPosterUrl, buildTmdbBackdropUrl } from '../config';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect } from 'react';

export type MovieCardProps = {
  movie: Movie;
  onVote?: (category: 'solo_friends' | 'couple' | 'streaming' | 'arr') => void;
  layout?: 'grid' | 'list';
  showActions?: boolean;
  // optional flag indicating a vote for this movie is in flight
  isVoting?: boolean;
  // mark poster as above-the-fold LCP candidate to prioritize loading
  priority?: boolean;
};

function formatPopularity(p: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(p);
}

function formatRelease(d?: string | null) {
  if (!d) return '—';
  const parsed = dayjs(d);
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
  const t = d.split('T')[0];
  return t || d;
}

const ORDERED_CATEGORIES: Array<{ key: 'solo_friends' | 'couple' | 'streaming' | 'arr'; label: string; shortLabel: string; icon: React.ReactNode }> = [
  { key: 'solo_friends', label: 'Solo/Friends', shortLabel: 'Solo', icon: <IconUsers size={14} /> },
  { key: 'couple', label: 'Couple', shortLabel: 'Couple', icon: <IconHeart size={14} /> },
  { key: 'streaming', label: 'Streaming', shortLabel: 'Stream', icon: <IconDeviceTv size={14} /> },
  { key: 'arr', label: 'ARR', shortLabel: 'ARR', icon: <IconHome2 size={14} /> },
];

export function MovieCard({ movie, onVote, layout = 'grid', showActions = true, isVoting = false, priority = false }: MovieCardProps) {
  const tallies = movie.tallies || {};
  // Determine hottest category(ies): find max tally > 0 and mark any categories equal to that.
  // If 3 or 4 categories tie for the top, don't mark any.
  const counts = ORDERED_CATEGORIES.map((c) => (tallies[c.key as keyof typeof tallies] as number | undefined) ?? 0);
  const maxCount = counts.length ? Math.max(...counts) : 0;
  let hottest: Array<'solo_friends' | 'couple' | 'streaming' | 'arr'> = [];
  if (maxCount > 0) {
    hottest = ORDERED_CATEGORIES.filter((c) => ((tallies[c.key as keyof typeof tallies] as number | undefined) ?? 0) === maxCount).map((c) => c.key);
    if (hottest.length >= 3) hottest = [];
  }

  // Prepare responsive sources
  const isAbsolutePoster = !!movie.poster_path && /^https?:\/\//i.test(String(movie.poster_path));
  const posterCanBuild = !!movie.poster_path && !isAbsolutePoster;
  const posterSrc = posterCanBuild && movie.poster_path ? buildTmdbPosterUrl(String(movie.poster_path), 'w342') : resolveImageUrl(movie.poster_path);
  const posterSrcSet = posterCanBuild && movie.poster_path ? [
    `${buildTmdbPosterUrl(String(movie.poster_path), 'w154')} 154w`,
    `${buildTmdbPosterUrl(String(movie.poster_path), 'w185')} 185w`,
    `${buildTmdbPosterUrl(String(movie.poster_path), 'w342')} 342w`,
    `${buildTmdbPosterUrl(String(movie.poster_path), 'w500')} 500w`,
    `${buildTmdbPosterUrl(String(movie.poster_path), 'w780')} 780w`,
  ].join(', ') : undefined;

  const backdropCanBuild = !!movie.backdrop_path;
  const backdropSrc = backdropCanBuild && movie.backdrop_path ? buildTmdbBackdropUrl(String(movie.backdrop_path), 'w780') : undefined;
  const backdropSrcSet = backdropCanBuild && movie.backdrop_path ? [
    `${buildTmdbBackdropUrl(String(movie.backdrop_path), 'w300')} 300w`,
    `${buildTmdbBackdropUrl(String(movie.backdrop_path), 'w780')} 780w`,
    `${buildTmdbBackdropUrl(String(movie.backdrop_path), 'w1280')} 1280w`,
  ].join(', ') : undefined;

  const theme = useMantineTheme();
  const isXL = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`);
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isStacked = isSm; // stacked layout on mobile

  // Responsive poster sizes when not stacked
  const posterW = !isStacked ? (layout === 'grid' ? 180 : 220) : 0;
  const posterH = !isStacked ? Math.round(posterW * 1.5) : 0;
  const rows = showActions ? 'auto auto 1fr auto auto' : 'auto auto 1fr auto';

  // responsive title size
  const titleOrder = isSm ? 5 : 4;

  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // reset loading state when poster changes
    setBroken(false);
    setLoaded(false);
  }, [posterSrc]);

  // voted_category from API (optional)
  const votedCategory = (movie as Movie).voted_category ?? null;

  return (
    <Card withBorder shadow="sm" radius="md" padding="md" style={{ height: '100%' }}>
      {isStacked ? (
        <Stack gap={8} style={{ width: '100%' }}>
          {/* Portrait poster on top, centered with clamp width and 2:3 ratio */}
          <Box style={{ position: 'relative', width: 'clamp(140px, 65vw, 220px)', aspectRatio: '2 / 3', margin: '0 auto' }}>
            <Skeleton h="100%" w="100%" radius="sm" style={{ position: 'absolute', inset: 0, display: loaded ? 'none' : 'block' }} />
            <Image
              src={posterSrc || backdropSrc}
              srcSet={posterSrc ? posterSrcSet : backdropSrcSet}
              sizes="(max-width: 480px) 65vw, 220px"
              alt={movie.title}
              radius="sm"
              fit="cover"
              h="100%"
              w="100%"
              loading={priority ? 'eager' : 'lazy'}
              // @ts-expect-error: fetchpriority is a valid HTML attribute in modern browsers
              fetchpriority={priority ? 'high' : 'auto'}
              decoding={priority ? 'auto' : 'async'}
              onLoad={() => setLoaded(true)}
              onError={() => { setBroken(true); setLoaded(false); }}
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 150ms ease' }}
            />
          </Box>

          {/* Text and actions below */}
          <Stack gap={8}>
            <Title order={titleOrder} lineClamp={2}>{movie.title}</Title>
            <Text size="sm" c="dimmed">Release: {formatRelease(movie.release_date)}</Text>
            {movie.overview ? (
              <Text size="sm" lh={1.5} lineClamp={4}>{movie.overview}</Text>
            ) : null}

            {showActions && (
              <Box>
                <Box my={6} h={1} w="100%" bg="var(--mantine-color-default-border)" />
                <Group gap={6} wrap={isStacked ? 'wrap' : 'nowrap'} style={isStacked ? { gap: 6 } : { overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {ORDERED_CATEGORIES.map((c) => {
                    const isVoted = (movie as Movie).voted_category === c.key;
                    const disabled = (((movie as Movie).voted_category ?? null) !== null && !isVoted) || isVoting;
                    const displayLabel = isStacked ? c.shortLabel : c.label;
                    const btnStyle: React.CSSProperties = isStacked ? { whiteSpace: 'nowrap', paddingInline: 8, flex: '1 1 auto', minWidth: 0 } : { whiteSpace: 'nowrap', paddingInline: 8, flexShrink: 0, minWidth: 'max-content' };
                    const isHot = hottest.includes(c.key);
                    return (
                      <Tooltip label={c.label} key={c.key}>
                        <Button size="compact-xs" fz="xs" variant="filled" leftSection={c.icon} onClick={() => onVote?.(c.key)} color={isVoted ? 'orange' : undefined} disabled={disabled} loading={isVoting && isVoted} style={btnStyle} styles={{ label: { whiteSpace: 'nowrap', fontSize: 'var(--mantine-font-size-xs)' } }}>
                          {displayLabel}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </Group>
              </Box>
            )}

            <Box>
              <Box my={6} h={1} w="100%" bg="var(--mantine-color-default-border)" />
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Group gap={6} wrap="wrap">
                  {ORDERED_CATEGORIES.map((c) => (
                    <Badge key={c.key} variant="light" radius="sm" color="gray" size="xs">
                      {c.label}{hottest.includes(c.key) ? ' 🔥' : ''}: {(movie.tallies || {})[c.key as keyof NonNullable<Movie['tallies']>] ?? 0}
                    </Badge>
                  ))}
                </Group>
                <Text size="sm" c="dimmed">TMDB Popularity: <Text span fw={600}>{formatPopularity(movie.popularity)}</Text></Text>
              </Group>
            </Box>
          </Stack>
        </Stack>
      ) : (
        // Desktop/tablet two-column layout with poster
        <Box style={{ display: 'grid', gridTemplateColumns: `${posterW}px 1fr`, columnGap: 'var(--mantine-spacing-md)', alignItems: 'stretch', width: '100%' }}>
          <Box style={{ width: posterW }}>
            {(posterSrc || backdropSrc) && !broken ? (
              <Box style={{ position: 'relative', height: posterH }}>
                <Skeleton h="100%" w="100%" radius="sm" style={{ position: 'absolute', inset: 0, display: loaded ? 'none' : 'block' }} />
                <Image
                  src={posterSrc || backdropSrc}
                  srcSet={posterSrc ? posterSrcSet : backdropSrcSet}
                  sizes={`${posterW}px`}
                  alt={movie.title}
                  radius="sm"
                  fit="cover"
                  h="100%"
                  w="100%"
                  loading={priority ? 'eager' : 'lazy'}
                  // @ts-expect-error: fetchpriority is a valid HTML attribute in modern browsers
                  fetchpriority={priority ? 'high' : 'auto'}
                  decoding={priority ? 'auto' : 'async'}
                  onLoad={() => setLoaded(true)}
                  onError={() => { setBroken(true); setLoaded(false); }}
                  style={{ opacity: loaded ? 1 : 0, transition: 'opacity 150ms ease' }}
                />
              </Box>
            ) : (
              <Box h={posterH} bg="var(--mantine-color-default)" c="dimmed" ta="center" style={{ display: 'grid', placeItems: 'center', borderRadius: 6 }}>
                No image
              </Box>
            )}
          </Box>

          <Stack style={{ display: 'grid', gridTemplateRows: rows, gridTemplateColumns: '1fr', minHeight: posterH, width: '100%', minWidth: 0 }} gap={8}>
            <Title order={titleOrder} lineClamp={2}>{movie.title}</Title>
            <Text size="sm" c="dimmed">Release: {formatRelease(movie.release_date)}</Text>
            {movie.overview ? (
              <Text size="sm" lh={1.5} lineClamp={layout === 'grid' ? 3 : 6}>{movie.overview}</Text>
            ) : null}

            {showActions && (
              <Box>
                <Box my={6} h={1} w="100%" bg="var(--mantine-color-default-border)" />
                {layout === 'grid' && isXL ? (
                  <Group gap={4} wrap={isStacked ? 'wrap' : 'nowrap'} justify="flex-start" style={isStacked ? { width: '100%', justifySelf: 'stretch' } : { width: '100%', justifySelf: 'stretch', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {ORDERED_CATEGORIES.map((c) => {
                      const isVoted = votedCategory === c.key;
                      const disabled = (votedCategory !== null && !isVoted) || isVoting;
                      const displayLabel = isStacked ? c.shortLabel : c.label;
                      const btnStyle: React.CSSProperties = isStacked ? { whiteSpace: 'nowrap', paddingInline: 8, flex: '1 1 auto', minWidth: 0 } : { whiteSpace: 'nowrap', paddingInline: 8, flexShrink: 0, minWidth: 'max-content' };
                      const isHot = hottest.includes(c.key);
                      return (
                        <Tooltip label={c.label} key={c.key}>
                          <Button
                            size="compact-xs"
                            fz="xs"
                            variant="filled"
                            leftSection={c.icon}
                            onClick={() => onVote?.(c.key)}
                            color={isVoted ? 'orange' : undefined}
                            disabled={disabled}
                            loading={isVoting && isVoted}
                            style={btnStyle}
                            styles={{ label: { whiteSpace: 'nowrap', fontSize: 'var(--mantine-font-size-xs)' } }}
                          >
                            {displayLabel}{isHot ? ' 🔥' : ''}
                          </Button>
                        </Tooltip>
                      );
                    })}
                  </Group>
                ) : (
                  <Group gap={4} wrap={isStacked ? 'wrap' : 'nowrap'} justify="flex-start" style={isStacked ? { width: '100%', justifySelf: 'stretch' } : { width: '100%', justifySelf: 'stretch', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {ORDERED_CATEGORIES.map((c) => {
                      const isVoted = votedCategory === c.key;
                      const disabled = (votedCategory !== null && !isVoted) || isVoting;
                      const displayLabel = isStacked ? c.shortLabel : c.label;
                      const btnStyle: React.CSSProperties = isStacked ? { whiteSpace: 'nowrap', paddingInline: 8, flex: '1 1 auto', minWidth: 0 } : { whiteSpace: 'nowrap', paddingInline: 8, flexShrink: 0, minWidth: 'max-content' };
                      const isHot = hottest.includes(c.key);
                      return (
                        <Tooltip label={c.label} key={c.key}>
                          <Button
                            size="compact-xs"
                            fz="xs"
                            variant="filled"
                            leftSection={c.icon}
                            onClick={() => onVote?.(c.key)}
                            color={isVoted ? 'orange' : undefined}
                            disabled={disabled}
                            loading={isVoting && isVoted}
                            style={btnStyle}
                            styles={{ label: { whiteSpace: 'nowrap', fontSize: 'var(--mantine-font-size-xs)' } }}
                          >
                            {displayLabel}{isHot ? ' 🔥' : ''}
                          </Button>
                        </Tooltip>
                      );
                    })}
                  </Group>
                )}
              </Box>
            )}

            <Box>
              <Box my={6} h={1} w="100%" bg="var(--mantine-color-default-border)" />
              <Group justify="space-between" wrap="wrap" gap="xs" style={{ width: '100%', justifySelf: 'stretch' }}>
                <Group gap={6} wrap="wrap">
                  {ORDERED_CATEGORIES.map((c) => (
                    <Badge key={c.key} variant="light" radius="sm" color="gray" size="xs">
                      {c.label}{hottest.includes(c.key) ? ' 🔥' : ''}: {(movie.tallies || {})[c.key as keyof NonNullable<Movie['tallies']>] ?? 0}
                    </Badge>
                  ))}
                </Group>
                <Text size="sm" c="dimmed">TMDB Popularity: <Text span fw={600}>{formatPopularity(movie.popularity)}</Text></Text>
              </Group>
            </Box>
          </Stack>
        </Box>
      )}
    </Card>
  );
}

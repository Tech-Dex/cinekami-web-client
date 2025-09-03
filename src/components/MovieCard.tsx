import { Badge, Box, Button, Card, Group, Image, Stack, Text, Title, Tooltip, useMantineTheme } from '@mantine/core';
import { IconHeart, IconHome2, IconUsers, IconDeviceTv } from '@tabler/icons-react';
import type { Movie } from '../api/types';
import { resolveImageUrl } from '../config';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

export type MovieCardProps = {
  movie: Movie;
  onVote?: (category: 'solo_friends' | 'couple' | 'streaming' | 'arr') => void;
  layout?: 'grid' | 'list';
  showActions?: boolean;
  // optional flag indicating a vote for this movie is in flight
  isVoting?: boolean;
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

const ORDERED_CATEGORIES: Array<{ key: 'solo_friends' | 'couple' | 'streaming' | 'arr'; label: string; icon: React.ReactNode }> = [
  { key: 'solo_friends', label: 'Solo/Friends', icon: <IconUsers size={14} /> },
  { key: 'couple', label: 'Couple', icon: <IconHeart size={14} /> },
  { key: 'streaming', label: 'Streaming', icon: <IconDeviceTv size={14} /> },
  { key: 'arr', label: 'ARR', icon: <IconHome2 size={14} /> },
];

export function MovieCard({ movie, onVote, layout = 'grid', showActions = true, isVoting = false }: MovieCardProps) {
  const tallies = movie.tallies || {};
  // Determine hottest categories based on tallies with tie rules
  const counts = ORDERED_CATEGORIES.map((c) => (tallies[c.key as keyof typeof tallies] as number | undefined) ?? 0);
  const maxCount = counts.length ? Math.max(...counts) : 0;
  let hottest: Array<'solo_friends' | 'couple' | 'streaming' | 'arr'> = [];
  if (maxCount > 0) {
    hottest = ORDERED_CATEGORIES.filter((c) => ((tallies[c.key as keyof typeof tallies] as number | undefined) ?? 0) === maxCount).map((c) => c.key);
    if (hottest.length >= 3) {
      hottest = [];
    }
  }
  const posterUrl = resolveImageUrl(movie.poster_path);
  const [broken, setBroken] = useState(false);
  const theme = useMantineTheme();
  const isXL = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`);

  const posterW = layout === 'grid' ? 180 : 220;
  const posterH = layout === 'grid' ? 270 : 330;
  const rows = showActions ? 'auto auto 1fr auto auto' : 'auto auto 1fr auto';

  // voted_category from API (optional)
  const votedCategory = (movie as Movie).voted_category ?? null;

  return (
    <Card withBorder shadow="sm" radius="md" padding="md" style={{ height: '100%' }}>
      <Box style={{ display: 'grid', gridTemplateColumns: `${posterW}px 1fr`, columnGap: 'var(--mantine-spacing-md)', alignItems: 'stretch', width: '100%' }}>
        <Box style={{ width: posterW }}>
          {posterUrl && !broken ? (
            <Image src={posterUrl} alt={movie.title} radius="sm" fit="cover" h={posterH} w="100%" onError={() => setBroken(true)} />
          ) : (
            <Box h={posterH} bg="var(--mantine-color-default)" c="dimmed" ta="center" style={{ display: 'grid', placeItems: 'center', borderRadius: 6 }}>
              No image
            </Box>
          )}
        </Box>

        <Stack style={{ display: 'grid', gridTemplateRows: rows, gridTemplateColumns: '1fr', minHeight: posterH, width: '100%', minWidth: 0 }} gap={8}>
          <Title order={4} lineClamp={2}>{movie.title}</Title>
          <Text size="sm" c="dimmed">Release: {formatRelease(movie.release_date)}</Text>

          {/* Reserve space for overview row (1fr). If no overview, keep empty to prevent actions from stretching */}
          <Box style={{ minHeight: 0 }}>
            {movie.overview ? (
              <Text size="sm" lh={1.5} lineClamp={layout === 'grid' ? 3 : 6}>{movie.overview}</Text>
            ) : null}
          </Box>

          {showActions && (
            <Box style={{ width: '100%', alignSelf: 'stretch', justifySelf: 'stretch', gridColumn: '1 / -1' }}>
              <Box my={6} h={1} w="100%" bg="var(--mantine-color-default-border)" />
              {layout === 'grid' && isXL ? (
                <Group gap={6} wrap="wrap" justify="space-between" style={{ width: '100%', justifySelf: 'stretch' }}>
                  {ORDERED_CATEGORIES.map((c) => {
                    const isVoted = votedCategory === c.key;
                    const disabled = (votedCategory !== null && !isVoted) || isVoting;
                    return (
                      <Tooltip label={c.label} key={c.key}>
                        <Button
                          size="xs"
                          variant="filled"
                          leftSection={c.icon}
                          onClick={() => onVote?.(c.key)}
                          color={isVoted ? 'orange' : undefined}
                          disabled={disabled}
                          loading={isVoting && isVoted}
                        >
                          {c.label}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </Group>
              ) : (
                <Group gap={6} wrap="wrap" justify="flex-start" style={{ width: '100%', justifySelf: 'stretch' }}>
                  {ORDERED_CATEGORIES.map((c) => {
                    const isVoted = votedCategory === c.key;
                    const disabled = (votedCategory !== null && !isVoted) || isVoting;
                    return (
                      <Tooltip label={c.label} key={c.key}>
                        <Button
                          size="xs"
                          variant="filled"
                          leftSection={c.icon}
                          onClick={() => onVote?.(c.key)}
                          color={isVoted ? 'orange' : undefined}
                          disabled={disabled}
                          loading={isVoting && isVoted}
                        >
                          {c.label}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </Group>
              )}
            </Box>
          )}

          <Box style={{ width: '100%', alignSelf: 'stretch', justifySelf: 'stretch', gridColumn: '1 / -1' }}>
            <Box my={6} h={1} w="100%" bg="var(--mantine-color-default-border)" />
            <Group justify="space-between" wrap="wrap" gap="xs" style={{ width: '100%', justifySelf: 'stretch' }}>
              <Group gap={6} wrap="wrap">
                {ORDERED_CATEGORIES.map((c) => (
                  <Badge key={c.key} variant="light" radius="sm" color="gray" size="xs">
                    {c.label}{hottest.includes(c.key) ? ' 🔥' : ''}: {tallies[c.key as keyof typeof tallies] ?? 0}
                  </Badge>
                ))}
              </Group>
              <Text size="sm" c="dimmed">TMDB Popularity: <Text span fw={600}>{formatPopularity(movie.popularity)}</Text></Text>
            </Group>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}

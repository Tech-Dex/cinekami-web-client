import { Box, Card, Group, Skeleton, Stack, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export function MovieCardSkeleton({ layout = 'grid' as 'grid' | 'list' }) {
  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  if (isSm) {
    return (
      <Card withBorder shadow="sm" radius="md" padding="md" style={{ height: '100%' }}>
        <Stack gap={8}>
          <Box style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
            <Skeleton h="100%" w="100%" radius="sm" />
          </Box>
          <Stack gap={8}>
            <Skeleton height={16} width="70%" />
            <Skeleton height={12} width="40%" />
            <Skeleton height={60} />
            <Group gap={6} wrap="nowrap">
              <Skeleton height={24} width={90} />
              <Skeleton height={24} width={90} />
              <Skeleton height={24} width={90} />
              <Skeleton height={24} width={70} />
            </Group>
            <Group gap={8} wrap="wrap">
              <Skeleton height={18} width={110} />
              <Skeleton height={18} width={100} />
              <Skeleton height={18} width={120} />
              <Skeleton height={18} width={140} />
            </Group>
          </Stack>
        </Stack>
      </Card>
    );
  }

  const posterW = layout === 'grid' ? 180 : 220;
  const posterH = Math.round(posterW * 1.5);
  const rows = 'auto auto 1fr auto auto';

  return (
    <Card withBorder shadow="sm" radius="md" padding="md" style={{ height: '100%' }}>
      <Box style={{ display: 'grid', gridTemplateColumns: `${posterW}px 1fr`, columnGap: 'var(--mantine-spacing-md)', alignItems: 'stretch', width: '100%' }}>
        <Box style={{ width: posterW }}>
          <Skeleton h={posterH} w="100%" radius="sm" />
        </Box>
        <Stack style={{ display: 'grid', gridTemplateRows: rows, gridTemplateColumns: '1fr', minHeight: posterH, width: '100%', minWidth: 0 }} gap={8}>
          <Skeleton height={18} width="60%" />
          <Skeleton height={12} width="40%" />
          <Skeleton height={layout === 'grid' ? 60 : 100} />
          <Group gap={4} wrap="nowrap">
            <Skeleton height={26} width={92} />
            <Skeleton height={26} width={92} />
            <Skeleton height={26} width={92} />
            <Skeleton height={26} width={72} />
          </Group>
          <Group gap={8} wrap="wrap">
            <Skeleton height={18} width={110} />
            <Skeleton height={18} width={100} />
            <Skeleton height={18} width={120} />
            <Skeleton height={18} width={140} />
          </Group>
        </Stack>
      </Box>
    </Card>
  );
}

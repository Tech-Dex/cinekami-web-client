import { Box, Card, Group, Skeleton, Stack } from '@mantine/core';

export function MovieCardSkeleton({ layout = 'grid' as 'grid' | 'list' }) {
  const posterW = layout === 'grid' ? 180 : 220;
  const posterH = layout === 'grid' ? 270 : 330;
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


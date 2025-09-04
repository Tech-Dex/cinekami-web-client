import { useMemo, useEffect } from 'react';
import { Group, NumberInput, Select, SegmentedControl, Box, useMantineTheme, Stack } from '@mantine/core';
import { IconArrowsSort, IconLayout2, IconLayoutList } from '@tabler/icons-react';
import { ALLOWED_SORT_BY, type SortBy, type SortDir } from '../config';
import { useMediaQuery } from '@mantine/hooks';

export type Filters = {
  sort_by: SortBy;
  sort_dir: SortDir;
  min_popularity?: number | null;
  max_popularity?: number | null;
  layout: 'grid' | 'list';
};

export type MovieFiltersProps = {
  value: Filters;
  onChange: (next: Filters) => void;
};

export function MovieFilters({ value, onChange }: MovieFiltersProps) {
  const theme = useMantineTheme();
  const isXs = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const sortOptions = useMemo(
    () =>
      ALLOWED_SORT_BY.map((v) => {
        const labelMap: Record<string, string> = {
          // shorten popularity label on very small screens
          popularity: isXs ? 'TMDB Pop' : 'TMDB Popularity',
          release_date: 'Release date',
          solo_friends: 'Solo/Friends',
          couple: 'Couple',
          streaming: 'Streaming',
          arr: 'ARR',
        };
        return { value: v, label: labelMap[v] || v };
      }),
    [isXs]
  );

  // If on small screens we don't support grid, force layout to 'list'
  useEffect(() => {
    if (isSm && value.layout !== 'list') {
      onChange({ ...value, layout: 'list' });
    }
    // don't include onChange/value in deps to avoid excessive resets from parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSm, value.layout]);

  // On small screens stack controls vertically and make them full-width to avoid white space
  if (isSm) {
    return (
      <Stack style={{ width: '100%' }}>
        <Group grow style={{ width: '100%' }}>
          <Select
            data={sortOptions}
            value={value.sort_by}
            onChange={(v) => onChange({ ...value, sort_by: (v as SortBy) || 'popularity' })}
            leftSection={<IconArrowsSort size={16} />}
            placeholder="Sort by"
            aria-label="Sort by"
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
            size="sm"
            style={{ width: '100%' }}
          />

          <SegmentedControl
            value={value.sort_dir}
            onChange={(v) => onChange({ ...value, sort_dir: v as SortDir })}
            data={[{ value: 'asc', label: 'ASC' }, { value: 'desc', label: 'DESC' }]}
            size="sm"
            style={{ width: 120 }}
          />
        </Group>

        <Group grow style={{ width: '100%' }}>
          <NumberInput
            placeholder={isXs ? 'Min pop' : 'Min popularity'}
            aria-label={isXs ? 'Min pop' : 'Min popularity'}
            value={value.min_popularity ?? ''}
            onChange={(v) => onChange({ ...value, min_popularity: typeof v === 'number' ? v : null })}
            min={0}
            size="sm"
            style={{ width: '100%' }}
          />

          <NumberInput
            placeholder={isXs ? 'Max pop' : 'Max popularity'}
            aria-label={isXs ? 'Max pop' : 'Max popularity'}
            value={value.max_popularity ?? ''}
            onChange={(v) => onChange({ ...value, max_popularity: typeof v === 'number' ? v : null })}
            min={0}
            size="sm"
            style={{ width: '100%' }}
          />
        </Group>

        {/*<Box>*/}
        {/*  <SegmentedControl*/}
        {/*    value={value.layout}*/}
        {/*    onChange={(v) => onChange({ ...value, layout: v as 'grid' | 'list' })}*/}
        {/*    aria-label="Layout switch"*/}
        {/*    data={[*/}
        {/*      { value: 'grid', label: (<Group gap={6}><IconLayout2 size={20} /></Group>) },*/}
        {/*      { value: 'list', label: (<Group gap={6}><IconLayoutList size={20} /></Group>) },*/}
        {/*    ]}*/}
        {/*    size="sm"*/}
        {/*    fullWidth*/}
        {/*  />*/}
        {/*</Box>*/}
      </Stack>
    );
  }

  return (
    <Group justify="space-between" align="end" wrap="wrap" gap="sm">
      <Group wrap="wrap" gap="sm">
        <Group wrap="nowrap" gap="sm" align="end">
          <Select
            data={sortOptions}
            value={value.sort_by}
            onChange={(v) => onChange({ ...value, sort_by: (v as SortBy) || 'popularity' })}
            leftSection={<IconArrowsSort size={16} />}
            placeholder="Sort by"
            aria-label="Sort by"
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
            w={isXs ? 140 : 220}
            size="sm"
          />

          <SegmentedControl
            value={value.sort_dir}
            onChange={(v) => onChange({ ...value, sort_dir: v as SortDir })}
            data={[{ value: 'asc', label: 'ASC' }, { value: 'desc', label: 'DESC' }]}
            size="sm"
          />
        </Group>

        <NumberInput
          placeholder={isXs ? 'Min pop' : 'Min popularity'}
          aria-label={isXs ? 'Min pop' : 'Min popularity'}
          value={value.min_popularity ?? ''}
          onChange={(v) => onChange({ ...value, min_popularity: typeof v === 'number' ? v : null })}
          min={0}
          w={isXs ? 100 : 160}
          size="sm"
        />

        <NumberInput
          placeholder={isXs ? 'Max pop' : 'Max popularity'}
          aria-label={isXs ? 'Max pop' : 'Max popularity'}
          value={value.max_popularity ?? ''}
          onChange={(v) => onChange({ ...value, max_popularity: typeof v === 'number' ? v : null })}
          min={0}
          w={isXs ? 100 : 160}
          size="sm"
        />
      </Group>

      {!isSm && (
        <Box>
          <SegmentedControl
            value={value.layout}
            onChange={(v) => onChange({ ...value, layout: v as 'grid' | 'list' })}
            aria-label="Layout switch"
            data={[
              { value: 'grid', label: (<Group gap={6}><IconLayout2 size={20} /></Group>) },
              { value: 'list', label: (<Group gap={6}><IconLayoutList size={20} /></Group>) },
            ]}
            size="sm"
          />
        </Box>
      )}
    </Group>
  );
}

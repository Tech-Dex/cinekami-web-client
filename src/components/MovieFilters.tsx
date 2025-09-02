import { useMemo } from 'react';
import { Group, NumberInput, Select, SegmentedControl, Box } from '@mantine/core';
import { IconArrowsSort, IconLayout2, IconLayoutList } from '@tabler/icons-react';
import { ALLOWED_SORT_BY, type SortBy, type SortDir } from '../config';

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
  const sortOptions = useMemo(
    () =>
      ALLOWED_SORT_BY.map((v) => {
        const labelMap: Record<string, string> = {
          popularity: 'TMDB Popularity',
          release_date: 'Release date',
          solo_friends: 'Solo/Friends',
          couple: 'Couple',
          streaming: 'Streaming',
          arr: 'ARR',
        };
        return { value: v, label: labelMap[v] || v };
      }),
    []
  );

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
            w={220}
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
          placeholder="Min popularity"
          aria-label="Min popularity"
          value={value.min_popularity ?? ''}
          onChange={(v) => onChange({ ...value, min_popularity: typeof v === 'number' ? v : null })}
          min={0}
          w={160}
          size="sm"
        />

        <NumberInput
          placeholder="Max popularity"
          aria-label="Max popularity"
          value={value.max_popularity ?? ''}
          onChange={(v) => onChange({ ...value, max_popularity: typeof v === 'number' ? v : null })}
          min={0}
          w={160}
          size="sm"
        />
      </Group>

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
    </Group>
  );
}

import { Center, Stack, Text } from '@mantine/core';

export function EmptyState({ title = 'Nothing to show', message }: { title?: string; message?: string }) {
  return (
    <Center mih={200}>
      <Stack gap={4} align="center">
        <Text fw={600}>{title}</Text>
        {message && <Text c="dimmed" size="sm">{message}</Text>}
      </Stack>
    </Center>
  );
}


import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';

export default function HomePage() {
  const { counter, increment, appName } = useAppContext();

  const todoQuery = useQuery({
    queryKey: ['todo', 1],
    queryFn: async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ id: number; title: string; completed: boolean }>;
    },
  });

  return (
    <Stack>
      <Title order={2}>Welcome to {appName}</Title>
      <Group>
        <Button onClick={increment}>Increment</Button>
        <Text>Counter: {counter}</Text>
      </Group>
      {todoQuery.isLoading && <Text>Loading sample data…</Text>}
      {todoQuery.isError && <Text c="red">Error loading sample data</Text>}
      {todoQuery.data && (
        <Text>
          Sample fetched title: <b>{todoQuery.data.title}</b>
        </Text>
      )}
      <Button component={Link} to="/about" variant="light">
        Go to About
      </Button>
    </Stack>
  );
}

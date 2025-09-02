import { AppShell, Group, Title, Button, Container } from '@mantine/core';
import { Link, Outlet, NavLink as RRNavLink, useLocation } from 'react-router-dom';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle';

export default function RootLayout() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Upcoming', match: (p: string) => p === '/' },
    { to: '/snapshots', label: 'Snapshots', match: (p: string) => p.startsWith('/snapshots') },
    { to: '/about', label: 'About', match: (p: string) => p.startsWith('/about') },
  ];

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Title order={3}>Cinekami</Title>
            </Link>
            <Group gap="xs">
              {links.map((l) => (
                <Button
                  key={l.to}
                  component={RRNavLink}
                  to={l.to}
                  variant={l.match(location.pathname) ? 'filled' : 'subtle'}
                  color={l.match(location.pathname) ? undefined : 'gray'}
                >
                  {l.label}
                </Button>
              ))}
              <ColorSchemeToggle />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

import { AppShell, Group, Button, Container, Title } from '@mantine/core';
import { useEffect } from 'react';
import { Link, Outlet, NavLink as RRNavLink, useLocation } from 'react-router-dom';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle';

export default function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const links = [
    { to: '/', label: 'Upcoming', match: (p: string) => p === '/' },
    { to: '/snapshots', label: 'Snapshots', match: (p: string) => p.startsWith('/snapshots') },
  ];

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }} aria-label="Cinekami home">
              <Title
                order={3}
                style={{
                  color: 'var(--mantine-color-orange-filled)',
                  display: 'inline-block',
                  transform: 'scaleX(1.3)',
                  transformOrigin: 'left center',
                }}
              >
                CINEKAMI
              </Title>
            </Link>
            <Group gap="xs">
              {links.map((l) => (
                <Button
                  key={l.to}
                  component={RRNavLink}
                  to={l.to}
                  variant={l.match(location.pathname) ? 'filled' : 'subtle'}
                  color={l.match(location.pathname) ? 'var(--mantine-color-orange-filled)' : 'gray'}
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

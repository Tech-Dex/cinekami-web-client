import { AppShell, Group, Button, Container, Title, useMantineTheme } from '@mantine/core';
import { useEffect, Suspense } from 'react';
import { Link, Outlet, NavLink as RRNavLink, useLocation } from 'react-router-dom';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle';
import { useMediaQuery } from '@mantine/hooks';

export default function RootLayout() {
  const location = useLocation();
  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const links = [
    { to: '/', label: 'Upcoming', match: (p: string) => p === '/' },
    { to: '/snapshots', label: 'Snapshots', match: (p: string) => p.startsWith('/snapshots') },
  ];

  return (
    <AppShell header={{ height: isSm ? 72 : 56 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          {isSm ? (
            <>
              <Group h="50%" justify="space-between" wrap="nowrap">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }} aria-label="Cinekami home">
                  <Title
                    order={4}
                    style={{
                      color: 'var(--mantine-color-orange-filled)',
                      display: 'inline-block',
                      transform: 'scaleX(1.08)',
                      transformOrigin: 'left center',
                    }}
                  >
                    CINEKAMI
                  </Title>
                </Link>
                <ColorSchemeToggle />
              </Group>
              <Group h="50%" justify="center" gap={6} wrap="nowrap">
                {links.map((l) => (
                  <Button
                    key={l.to}
                    component={RRNavLink}
                    to={l.to}
                    size="compact-xs"
                    variant={l.match(location.pathname) ? 'filled' : 'subtle'}
                    color={l.match(location.pathname) ? 'orange' : 'gray'}
                  >
                    {l.label}
                  </Button>
                ))}
              </Group>
            </>
          ) : (
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
                    color={l.match(location.pathname) ? 'orange' : 'gray'}
                  >
                    {l.label}
                  </Button>
                ))}
                <ColorSchemeToggle />
              </Group>
            </Group>
          )}
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </AppShell.Main>
    </AppShell>
  );
}

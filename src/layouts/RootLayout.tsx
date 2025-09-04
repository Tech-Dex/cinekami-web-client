import { AppShell, Group, Button, Container, Title, useMantineTheme, Drawer, Burger, Stack, Divider, Box, Text } from '@mantine/core';
import { useEffect, Suspense, useState } from 'react';
import { Link, Outlet, NavLink as RRNavLink, useLocation } from 'react-router-dom';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle';
import { useMediaQuery } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun, IconCalendar, IconPhoto } from '@tabler/icons-react';

export default function RootLayout() {
  const location = useLocation();
  const theme = useMantineTheme();
  const isSm = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const { colorScheme } = useMantineColorScheme();
  const burgerColor = colorScheme === 'dark' ? 'white' : 'black';
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const links = [
    { to: '/', label: 'Upcoming', match: (p: string) => p === '/' },
    { to: '/snapshots', label: 'Snapshots', match: (p: string) => p.startsWith('/snapshots') },
  ];

  return (
    <AppShell header={{ height: isSm ? 64 : 56 }} padding="md">
      <AppShell.Header style={{ zIndex: 3000 }}>
        <Container size="xl" h="100%">
          {isSm ? (
            // Mobile: burger on left, logo on right; drawer opens from left with mini-header, nav, theme toggle and footer
            <Group h="100%" align="center" justify="space-between" wrap="nowrap">
              <Burger
                opened={drawerOpen}
                onClick={() => setDrawerOpen((o) => !o)}
                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                title={drawerOpen ? 'Close menu' : 'Open menu'}
                color={burgerColor}
              />

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

              <Drawer
                opened={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                position="left"
                padding="md"
                size="260px"
                withCloseButton={false}
                zIndex={4000}
              >
                {/* Use a column that stretches to full height so we can place a footer at the bottom */}
                <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box style={{ borderRadius: 6 }}>
                    <Group align="center" justify="space-between">
                      {/* Animated burger shown as opened (displays X) and colored white to match header X */}
                      <Burger opened={true} onClick={() => setDrawerOpen(false)} size={20} color={burgerColor} aria-label="Close menu" />
                      <Title order={4} style={{ color: 'var(--mantine-color-orange-filled)', margin: 0, transform: 'scaleX(1.3)', transformOrigin: 'right center' }}>CINEKAMI</Title>
                    </Group>
                  </Box>

                  {/* Spacer so drawer content doesn't sit against the AppShell header */}
                  <Box style={{ height: 12 }} />

                  {/* Small app description under the mini-header */}
                  <Box style={{ paddingRight: 6, paddingLeft: 6 }}>
                    <Text size="sm" c="dimmed" ta="center">
                      Vote · Discover · Watch
                    </Text>
                  </Box>

                  <Divider my="sm" />

                  <Stack gap="xs" style={{ width: '100%' }}>
                    {links.map((l) => (
                      <Button
                        key={l.to}
                        component={RRNavLink}
                        to={l.to}
                        variant={l.match(location.pathname) ? 'filled' : 'subtle'}
                        color={l.match(location.pathname) ? 'var(--mantine-color-orange-filled)' : 'gray'}
                        fullWidth
                        leftSection={l.to === '/' ? <IconCalendar size={16} /> : <IconPhoto size={16} />}
                        onClick={() => setDrawerOpen(false)}
                      >
                        {l.label}
                      </Button>
                    ))}
                  </Stack>

                  <Divider my="sm" />

                  {/* Theme toggle as a full-width button with icon and label */}
                  <ThemeToggle />

                  <Box style={{ flex: 1 }} />

                  {/* Footer placed at the bottom of the drawer */}
                  <Divider my="sm" />
                  <Box style={{ padding: 8, textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">
                      Made with <Text span size="xs" c="var(--mantine-color-orange-filled)" aria-hidden="true">♥</Text> for movie lovers.
                    </Text>
                  </Box>
                </Box>
              </Drawer>
            </Group>
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
                    color={l.match(location.pathname) ? 'var(--mantine-color-orange-filled)' : 'gray'}
                    leftSection={l.to === '/' ? <IconCalendar size={16} /> : <IconPhoto size={16} />}
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

  // Inline theme toggle component used inside Drawer
  function ThemeToggle() {
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';
    return (
      <Button
        fullWidth
        variant="light"
        color={dark ? 'orange' : undefined}
        leftSection={dark ? <IconSun size={16} /> : <IconMoon size={16} />}
        onClick={() => setColorScheme(dark ? 'light' : 'dark')}
        style={{ justifyContent: 'flex-start' }}
      >
        {dark ? 'Switch to light' : 'Switch to dark'}
      </Button>
    );
  }
}

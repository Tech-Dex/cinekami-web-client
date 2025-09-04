import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import { AppProvider } from './context/AppProvider'
import { Notifications } from '@mantine/notifications'
import { theme } from './theme'

const queryClient = new QueryClient()

// Lazy devtools only in development
const Devtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
  : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <Notifications position="top-right" zIndex={9999} />
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
        {Devtools ? (
          <Suspense fallback={null}>
            <Devtools initialIsOpen={false} />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)

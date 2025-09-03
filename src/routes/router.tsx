import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import RootLayout from '../layouts/RootLayout';

const ActiveMoviesPage = lazy(() => import('../pages/ActiveMoviesPage'));
const SnapshotsPage = lazy(() => import('../pages/SnapshotsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <ActiveMoviesPage /> },
      { path: 'snapshots', element: <SnapshotsPage /> },
    ],
  },
]);

import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import ActiveMoviesPage from '../pages/ActiveMoviesPage';
import SnapshotsPage from '../pages/SnapshotsPage';

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

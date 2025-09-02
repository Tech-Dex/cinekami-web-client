import { useMemo, useState, type PropsWithChildren } from 'react';
import { AppContext, type AppState } from './appContext';

export function AppProvider({ children }: PropsWithChildren) {
  const [counter, setCounter] = useState(0);

  const value = useMemo<AppState>(() => ({
    appName: 'Cinekami',
    counter,
    increment: () => setCounter((c) => c + 1),
  }), [counter]);

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}


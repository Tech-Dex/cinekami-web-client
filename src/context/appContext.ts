import { createContext } from 'react';

export type AppState = {
  appName: string;
  counter: number;
  increment: () => void;
};

export const AppContext = createContext<AppState | undefined>(undefined);


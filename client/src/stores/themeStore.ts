import type { Theme } from '@btree/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type { Theme };

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dusk'
    : 'day';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Day / Dusk theme (autonomy: the student picks). Persisted in localStorage for everyone;
 * signed-in students also save it to their account, and AppShell applies the account's
 * theme on sign-in so it follows them to other devices.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'btree-theme' },
  ),
);

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'day' | 'dusk';

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dusk'
    : 'day';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

/** Day / Dusk theme (autonomy: the student picks). Persisted in localStorage. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: systemTheme(),
      toggle: () => set({ theme: get().theme === 'day' ? 'dusk' : 'day' }),
    }),
    { name: 'btree-theme' },
  ),
);

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

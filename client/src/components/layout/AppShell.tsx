import { MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useMe } from '../../api/hooks';
import { useProgressStore } from '../../stores/progressStore';
import { applyTheme, useThemeStore } from '../../stores/themeStore';
import { Header } from './Header';

export function AppShell() {
  const theme = useThemeStore((s) => s.theme);
  const { pathname } = useLocation();
  const me = useMe();
  const { setSignedIn, hydrateFromServer } = useProgressStore();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  // Block body on purpose: newer browsers return a Promise from scrollTo, which must not be the cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Signed-in students get their saved progress back (FR11); guests keep session-only progress (FR12).
  useEffect(() => {
    const signedIn = Boolean(me.data);
    setSignedIn(signedIn);
    if (signedIn)
      hydrateFromServer().catch((e: unknown) => console.warn('Could not load progress', e));
  }, [me.data, setSignedIn, hydrateFromServer]);

  return (
    // reducedMotion="user" honours the OS "reduce motion" setting for every animation (NFR4).
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="focus:bg-accent sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </MotionConfig>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../api/client';
import { useLogout, useMe } from '../api/hooks';
import { FriendsCard } from '../components/friends/FriendsCard';
import { Button, ButtonLink, Card, CardTitle, PageHeader, cn } from '../components/ui';
import { useProgressStore } from '../stores/progressStore';
import { useThemeStore, type Theme } from '../stores/themeStore';

const THEMES: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: 'day', label: 'Day', Icon: Sun },
  { id: 'dusk', label: 'Dusk', Icon: Moon },
];

/** Day / Dusk theme picker. Saved on this device, so guests can use it too. */
function AppearanceCard() {
  const { theme, setTheme } = useThemeStore();
  return (
    <Card>
      <CardTitle>Appearance</CardTitle>
      <fieldset>
        <legend className="text-ink-muted text-small mb-3">
          Pick a theme. It is saved on this device.
        </legend>
        <div className="flex gap-2">
          {THEMES.map(({ id, label, Icon }) => (
            <label
              key={id}
              className={cn(
                'shadow-paper-stack-sm has-[:focus-visible]:outline-yarn flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 font-bold has-[:focus-visible]:outline-2',
                theme === id ? 'bg-highlight text-on-highlight' : 'bg-paper',
              )}
            >
              <input
                type="radio"
                name="theme"
                className="sr-only"
                checked={theme === id}
                onChange={() => setTheme(id)}
              />
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}

/** Account settings: appearance, friends, sign out and account deletion (FR10, POPIA). */
export function AccountPage() {
  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reset = useProgressStore((s) => s.reset);
  const del = useMutation({
    mutationFn: () => api.delete('/account'),
    onSuccess: () => {
      reset();
      qc.setQueryData(['me'], null);
      navigate('/');
    },
  });

  if (!me.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Your account" subtitle="Learning as a guest" />
        <Card className="text-center">
          <p>You are learning as a guest. Progress lasts until you close this browser tab.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/login">Sign in</ButtonLink>
            <ButtonLink to="/register" variant="outline">
              Create an account
            </ButtonLink>
          </div>
        </Card>
        <AppearanceCard />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Your account" subtitle={`${me.data.displayName} · ${me.data.email}`} />
      <AppearanceCard />
      <FriendsCard />
      <Card>
        <CardTitle>Session</CardTitle>
        <Button
          variant="outline"
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => {
                reset();
                navigate('/');
              },
            })
          }
        >
          Sign out
        </Button>
      </Card>
      <Card>
        <CardTitle>Delete account</CardTitle>
        <p className="text-ink-muted text-small mb-3">
          This permanently deletes your account, progress, leaves, decorations and friendships. It
          cannot be undone.
        </p>
        <Button
          variant="outline"
          className="border-danger text-danger-text"
          onClick={() =>
            window.confirm('Delete your account and all your progress? This cannot be undone.') &&
            del.mutate()
          }
          disabled={del.isPending}
        >
          Delete my account
        </Button>
      </Card>
    </div>
  );
}

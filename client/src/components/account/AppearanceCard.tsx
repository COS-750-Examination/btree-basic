import { Moon, Sun } from 'lucide-react';
import { useUpdateAccount } from '../../api/hooks';
import { useThemeStore, type Theme } from '../../stores/themeStore';
import { Card, CardTitle, cn } from '../ui';

const THEME_OPTIONS: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: 'day', label: 'Day', Icon: Sun },
  { id: 'dusk', label: 'Dusk', Icon: Moon },
];

/**
 * Day / Dusk theme picker. Guests keep it on this device; signed-in students also save it
 * to their account, so it follows them to any device they sign in on.
 */
export function AppearanceCard({ signedIn }: { signedIn: boolean }) {
  const { theme, setTheme } = useThemeStore();
  const update = useUpdateAccount();

  const pick = (id: Theme) => {
    setTheme(id);
    if (signedIn) update.mutate({ theme: id });
  };

  return (
    <Card>
      <CardTitle>Appearance</CardTitle>
      <fieldset>
        <legend className="text-ink-muted text-small mb-3">
          {signedIn
            ? 'Pick a theme. It is saved to your account, so it follows you to any device you sign in on.'
            : 'Pick a theme. It is saved on this device.'}
        </legend>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ id, label, Icon }) => (
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
                onChange={() => pick(id)}
              />
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {update.isError && (
        <p role="alert" className="text-small text-danger-text mt-2 font-bold">
          Couldn&apos;t save the theme to your account. It is still set on this device.
        </p>
      )}
    </Card>
  );
}

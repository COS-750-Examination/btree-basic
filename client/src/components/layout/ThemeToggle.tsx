import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const next = theme === 'day' ? 'Dusk' : 'Day';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="bg-paper shadow-paper-stack-sm rounded-pill grid h-10 w-10 place-items-center"
    >
      {theme === 'day' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

import { GROWTH_STAGES } from '@btree/shared';
import { Menu, Sprout, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useMe } from '../../api/hooks';
import { useLocalReadiness } from '../../stores/progressStore';
import { Avatar } from '../ui/Avatar';
import { cn } from '../ui/cn';
import { LeafIcon } from '../ui/LeafIcon';
import { HillBand } from './HillBand';

const NAV = [
  { to: '/lessons', label: 'Lessons' },
  { to: '/visualiser', label: 'Visualiser' },
  { to: '/practice', label: 'Practice' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/grove', label: 'My grove' },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3.5 py-2 text-label font-bold shadow-paper-stack-sm transition-colors',
    isActive ? 'bg-highlight text-on-highlight' : 'bg-paper text-ink hover:bg-highlight/60',
  );

export function Header() {
  const [open, setOpen] = useState(false);
  const r = useLocalReadiness();
  const me = useMe();
  const stage = GROWTH_STAGES.find((s) => s.id === r.stage)?.label ?? 'Seed';

  return (
    <header className="bg-sky-200">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 pt-4">
        <Link to="/" className="flex items-center gap-2" aria-label="B-Tree Basic home">
          <LeafIcon className="h-7 w-7" />
          <span className="font-display text-heading">B-Tree Basic</span>
        </Link>

        <nav aria-label="Main" className="mx-auto hidden gap-2 md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={navClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            to="/ready"
            className="bg-paper shadow-paper-stack-sm rounded-pill text-small hidden items-center gap-1.5 px-3 py-2 font-bold sm:flex"
          >
            <Sprout className="text-leaf h-4 w-4" aria-hidden />
            {stage} · {Math.round(r.overall * 100)}%
          </Link>
          <Link
            to="/grove"
            className="bg-paper shadow-paper-stack-sm rounded-pill text-small flex items-center gap-1 px-3 py-2 font-bold"
            aria-label={`${r.leaves} leaves`}
          >
            <LeafIcon className="h-4 w-4" />
            {r.leaves}
          </Link>
          <NavLink
            to="/account"
            aria-label={me.data ? `Account: ${me.data.displayName}` : 'Account'}
            title="Account"
            className={({ isActive }) =>
              cn(
                'shadow-paper-stack-sm rounded-pill grid h-10 w-10 place-items-center',
                isActive ? 'bg-highlight text-on-highlight' : 'bg-paper',
              )
            }
          >
            {me.data ? (
              <Avatar name={me.data.displayName} />
            ) : (
              <UserRound className="h-4 w-4" aria-hidden />
            )}
          </NavLink>
          {!me.data && (
            <Link
              to="/login"
              className="text-small hidden font-bold underline-offset-2 hover:underline lg:inline"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="bg-paper shadow-paper-stack-sm rounded-pill grid h-10 w-10 place-items-center md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pt-3 md:hidden"
        >
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={navClass} onClick={() => setOpen(false)}>
              {n.label}
            </NavLink>
          ))}
          <NavLink
            to={me.data ? '/ready' : '/login'}
            className={navClass}
            onClick={() => setOpen(false)}
          >
            {me.data ? 'Ready check' : 'Sign in'}
          </NavLink>
        </nav>
      )}
      <HillBand />
    </header>
  );
}

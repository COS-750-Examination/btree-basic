import { GROWTH_STAGES } from '@btree/shared';
import { Menu, Sprout, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useFriends, useMe } from '../../api/hooks';
import { newRequests } from '../../lib/friends';
import { useNewCheers } from '../../stores/cheersStore';
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

function NavItem({
  to,
  label,
  count,
  onClick,
}: {
  to: string;
  label: string;
  count: number;
  onClick?: () => void;
}) {
  const news = count === 1 ? '1 new cheer' : `${count} new cheers`;
  return (
    <NavLink
      to={to}
      className={(s) => cn(navClass(s), 'inline-flex items-center gap-1.5')}
      onClick={onClick}
      aria-label={count ? `${label}, ${news}` : undefined}
    >
      {label}
      {count > 0 && (
        <span
          aria-hidden
          className="bg-leaf text-on-leaf rounded-pill text-small min-w-5 px-1.5 text-center leading-5"
        >
          {count}
        </span>
      )}
    </NavLink>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const r = useLocalReadiness();
  const me = useMe();
  const stage = GROWTH_STAGES.find((s) => s.id === r.stage)?.label ?? 'Seed';
  const newCheers = useNewCheers().length;
  const requests = newRequests(useFriends(Boolean(me.data)).data).length;
  const requestText = requests === 1 ? '1 new friend request' : `${requests} new friend requests`;
  const countFor = (to: string) => (to === '/grove' ? newCheers : 0);

  return (
    <header className="bg-sky-200">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 pt-4">
        <Link to="/" className="flex items-center gap-2" aria-label="B-Tree Basic home">
          <LeafIcon className="h-7 w-7" />
          <span className="font-display text-heading">B-Tree Basic</span>
        </Link>

        <nav aria-label="Main" className="mx-auto hidden gap-2 md:flex">
          {NAV.map((n) => (
            <NavItem key={n.to} to={n.to} label={n.label} count={countFor(n.to)} />
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
            aria-label={
              me.data
                ? `Account: ${me.data.displayName}${requests ? `, ${requestText}` : ''}`
                : 'Account'
            }
            title="Account"
            className={({ isActive }) =>
              cn(
                'shadow-paper-stack-sm rounded-pill relative grid h-10 w-10 place-items-center',
                isActive ? 'bg-highlight text-on-highlight' : 'bg-paper',
              )
            }
          >
            {me.data ? (
              <Avatar name={me.data.displayName} />
            ) : (
              <UserRound className="h-4 w-4" aria-hidden />
            )}
            {requests > 0 && (
              <span
                aria-hidden
                className="bg-danger-text text-on-leaf rounded-pill border-paper absolute -top-1.5 -right-1.5 min-w-5 border-2 px-1 text-center text-[0.7rem] leading-4 font-bold"
              >
                {requests > 9 ? '9+' : requests}
              </span>
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
            className="bg-paper shadow-paper-stack-sm rounded-pill relative grid h-10 w-10 place-items-center md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={
              (open ? 'Close menu' : 'Open menu') + (newCheers && !open ? ', new cheers' : '')
            }
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            {newCheers > 0 && !open && (
              <span
                aria-hidden
                className="bg-leaf border-paper rounded-pill absolute top-0 right-0 h-3 w-3 border-2"
              />
            )}
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
            <NavItem
              key={n.to}
              to={n.to}
              label={n.label}
              count={countFor(n.to)}
              onClick={() => setOpen(false)}
            />
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

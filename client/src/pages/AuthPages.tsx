import { LoginBody, RegisterBody } from '@btree/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ApiRequestError } from '../api/client';
import { useLogin, useRegister } from '../api/hooks';
import { Button, Card } from '../components/ui';
import { safeNext } from '../lib/invite';

const input = 'mt-1 w-full rounded-lg border-2 border-ink bg-paper px-3 py-2.5';

function errorText(e: unknown): string {
  if (e instanceof ApiRequestError) return e.status === 0 ? 'Cannot reach the server.' : e.message;
  return 'Cannot reach the server. You can keep learning as a guest.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const next = safeNext(useSearchParams()[0].get('next'));
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = LoginBody.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError('Enter your email and password.');
    login.mutate(parsed.data, {
      onSuccess: () => navigate(next ?? '/lessons'),
      onError: (err) => setError(errorText(err)),
    });
  };

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-display-l">Welcome back</h1>
      <p className="text-ink-muted text-small mt-1">
        Sign in to pick up where you left off on any device.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <label className="text-label block font-bold">
          Email
          <input name="email" type="email" autoComplete="email" required className={input} />
        </label>
        <label className="text-label block font-bold">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={input}
          />
        </label>
        {error && (
          <p role="alert" className="text-danger-text text-label font-bold">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-small mt-4">
        New here?{' '}
        <Link
          to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="font-bold underline"
        >
          Create an account
        </Link>{' '}
        or{' '}
        <Link to="/warm-up" className="font-bold underline">
          continue as a guest
        </Link>
        .
      </p>
    </Card>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const next = safeNext(useSearchParams()[0].get('next'));
  const register = useRegister();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = RegisterBody.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form.');
    register.mutate(parsed.data, {
      onSuccess: () => navigate(next ?? '/warm-up'),
      onError: (err) => setError(errorText(err)),
    });
  };

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-display-l">Plant your seed</h1>
      <p className="text-ink-muted text-small mt-1">
        An account saves your progress between sessions. We only store your name, email and learning
        progress.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <label className="text-label block font-bold">
          Display name
          <input
            name="displayName"
            autoComplete="nickname"
            required
            maxLength={40}
            className={input}
          />
        </label>
        <label className="text-label block font-bold">
          Email
          <input name="email" type="email" autoComplete="email" required className={input} />
        </label>
        <label className="text-label block font-bold">
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={input}
            aria-describedby="pw-help"
          />
        </label>
        <p id="pw-help" className="text-ink-muted text-small">
          At least 8 characters.
        </p>
        {error && (
          <p role="alert" className="text-danger-text text-label font-bold">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="text-small mt-4">
        Already have one?{' '}
        <Link
          to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-bold underline"
        >
          Sign in
        </Link>
        .
      </p>
    </Card>
  );
}

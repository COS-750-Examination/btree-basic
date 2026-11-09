import { LoginBody, RegisterBody } from '@btree/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiRequestError } from '../api/client';
import { useLogin, useRegister } from '../api/hooks';
import { Button, Card } from '../components/ui';

const input = 'mt-1 w-full rounded-xl border-2 border-line bg-surface px-3 py-2.5';

function errorText(e: unknown): string {
  if (e instanceof ApiRequestError) return e.status === 0 ? 'Cannot reach the server.' : e.message;
  return 'Cannot reach the server. You can keep learning as a guest.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = LoginBody.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError('Enter your email and password.');
    login.mutate(parsed.data, {
      onSuccess: () => navigate('/lessons'),
      onError: (err) => setError(errorText(err)),
    });
  };

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-3xl">Welcome back</h1>
      <p className="text-muted mt-1 text-sm">
        Sign in to pick up where you left off on any device.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <label className="block text-sm font-bold">
          Email
          <input name="email" type="email" autoComplete="email" required className={input} />
        </label>
        <label className="block text-sm font-bold">
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
          <p role="alert" className="text-danger-text text-sm font-bold">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        New here?{' '}
        <Link to="/register" className="font-bold underline">
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
  const register = useRegister();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = RegisterBody.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form.');
    register.mutate(parsed.data, {
      onSuccess: () => navigate('/warm-up'),
      onError: (err) => setError(errorText(err)),
    });
  };

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-3xl">Plant your seed</h1>
      <p className="text-muted mt-1 text-sm">
        An account saves your progress between sessions. We only store your name, email and learning
        progress.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <label className="block text-sm font-bold">
          Display name
          <input
            name="displayName"
            autoComplete="nickname"
            required
            maxLength={40}
            className={input}
          />
        </label>
        <label className="block text-sm font-bold">
          Email
          <input name="email" type="email" autoComplete="email" required className={input} />
        </label>
        <label className="block text-sm font-bold">
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
        <p id="pw-help" className="text-muted text-xs">
          At least 8 characters.
        </p>
        {error && (
          <p role="alert" className="text-danger-text text-sm font-bold">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        Already have one?{' '}
        <Link to="/login" className="font-bold underline">
          Sign in
        </Link>
        .
      </p>
    </Card>
  );
}

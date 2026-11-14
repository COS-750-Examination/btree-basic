import { AccountPatchBody, type PublicUser } from '@btree/shared';
import { useState, type FormEvent } from 'react';
import { useUpdateAccount } from '../../api/hooks';
import { accountErrorText } from '../../lib/account';
import { Button, Card, CardTitle } from '../ui';

const input = 'border-ink bg-paper mt-1 w-full rounded-lg border-2 px-3 py-2';
const label = 'text-label block font-bold';

function Feedback({ ok, error }: { ok?: string; error?: string | null }) {
  if (error)
    return (
      <p role="alert" className="text-small text-danger-text mt-2 font-bold">
        {error}
      </p>
    );
  if (ok)
    return (
      <p role="status" className="text-small mt-2">
        {ok}
      </p>
    );
  return null;
}

export function ProfileCard({ user }: { user: PublicUser }) {
  return (
    <Card>
      <CardTitle>Profile</CardTitle>
      <NameForm user={user} />
      <hr className="border-ink-muted my-5 border-t border-dashed" />
      <PasswordForm />
    </Card>
  );
}

function NameForm({ user }: { user: PublicUser }) {
  const update = useUpdateAccount();
  const [name, setName] = useState(user.displayName);
  const trimmed = name.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({ displayName: trimmed });
  };

  return (
    <form onSubmit={submit}>
      <label htmlFor="display-name" className={label}>
        Display name
      </label>
      <p id="display-name-hint" className="text-ink-muted text-small">
        Friends see this on your grove.
      </p>
      <div className="flex gap-2">
        <input
          id="display-name"
          aria-describedby="display-name-hint"
          value={name}
          maxLength={40}
          autoComplete="nickname"
          onChange={(e) => {
            setName(e.target.value);
            update.reset();
          }}
          className={input}
        />
        <Button
          type="submit"
          size="sm"
          className="mt-1 shrink-0"
          disabled={!trimmed || trimmed === user.displayName || update.isPending}
        >
          Save name
        </Button>
      </div>
      <Feedback
        ok={update.isSuccess ? 'Name saved.' : undefined}
        error={update.isError ? accountErrorText(update.error) : null}
      />
    </form>
  );
}

function PasswordForm() {
  const update = useUpdateAccount();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = AccountPatchBody.safeParse({ currentPassword: current, newPassword: next });
    if (!parsed.success) {
      setProblem(parsed.error.issues[0]?.message ?? 'Check your new password.');
      return;
    }
    if (next !== confirm) {
      setProblem("The new passwords don't match.");
      return;
    }
    setProblem(null);
    update.mutate(parsed.data, {
      onSuccess: () => {
        setCurrent('');
        setNext('');
        setConfirm('');
      },
    });
  };

  const change = (set: (v: string) => void) => (v: string) => {
    set(v);
    setProblem(null);
    update.reset();
  };

  const fields = [
    ['Current password', current, change(setCurrent), 'current-password'],
    ['New password', next, change(setNext), 'new-password'],
    ['Confirm new password', confirm, change(setConfirm), 'new-password'],
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="font-bold">Change password</p>
      {fields.map(([text, value, onChange, auto]) => (
        <label key={text} className={label}>
          {text}
          <input
            type="password"
            value={value}
            autoComplete={auto}
            maxLength={128}
            onChange={(e) => onChange(e.target.value)}
            className={input}
          />
        </label>
      ))}
      <p className="text-ink-muted text-small">At least 8 characters.</p>
      <Button type="submit" size="sm" disabled={!current || !next || !confirm || update.isPending}>
        Change password
      </Button>
      <Feedback
        ok={update.isSuccess ? 'Password changed.' : undefined}
        error={problem ?? (update.isError ? accountErrorText(update.error) : null)}
      />
    </form>
  );
}

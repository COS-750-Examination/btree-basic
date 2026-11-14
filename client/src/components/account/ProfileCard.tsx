import { AccountPatchBody, type PublicUser } from '@btree/shared';
import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useUpdateAccount } from '../../api/hooks';
import { accountErrorText } from '../../lib/account';
import { Button, Card, CardTitle } from '../ui';

const input = 'border-ink bg-paper mt-1 w-full rounded-lg border-2 px-3 py-2';
const label = 'text-label block font-bold';

export function ProfileCard({ user }: { user: PublicUser }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (wasEditing.current && !editing) editButton.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle className="mb-0">Profile</CardTitle>
        {!editing && (
          <button
            ref={editButton}
            type="button"
            aria-label="Edit profile"
            title="Edit profile"
            onClick={() => {
              setSaved(false);
              setEditing(true);
            }}
            className="bg-paper shadow-paper-stack-sm rounded-pill border-ink inline-flex h-10 w-10 items-center justify-center border-2"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      {editing ? (
        <EditProfile
          user={user}
          onDone={(didSave) => {
            setSaved(didSave);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-label font-bold">Name</dt>
            <dd>{user.displayName}</dd>
            <dt className="text-label font-bold">Email</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className="text-label font-bold">Password</dt>
            <dd>
              <span aria-hidden>••••••••</span>
              <span className="sr-only">Hidden</span>
            </dd>
          </dl>
          {saved && (
            <p role="status" className="text-small mt-3">
              Changes saved.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function EditProfile({ user, onDone }: { user: PublicUser; onDone: (saved: boolean) => void }) {
  const update = useUpdateAccount();
  const [name, setName] = useState(user.displayName);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => nameInput.current?.focus(), []);

  const trimmed = name.trim();
  const nameChanged = trimmed !== user.displayName;
  const passwordStarted = Boolean(current || next || confirm);

  const edit = (set: (v: string) => void) => (v: string) => {
    set(v);
    setProblem(null);
    update.reset();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) return setProblem('Enter a display name.');
    if (passwordStarted && !(current && next && confirm))
      return setProblem('Fill in all three password fields to change your password.');
    if (passwordStarted && next !== confirm) return setProblem("The new passwords don't match.");

    const parsed = AccountPatchBody.safeParse({
      ...(nameChanged && { displayName: trimmed }),
      ...(passwordStarted && { currentPassword: current, newPassword: next }),
    });
    if (!parsed.success) return setProblem(parsed.error.issues[0]?.message ?? 'Check the form.');

    setProblem(null);
    update.mutate(parsed.data, { onSuccess: () => onDone(true) });
  };

  const error = problem ?? (update.isError ? accountErrorText(update.error) : null);
  const passwordFields = [
    ['Current password', current, edit(setCurrent), 'current-password'],
    ['New password', next, edit(setNext), 'new-password'],
    ['Confirm new password', confirm, edit(setConfirm), 'new-password'],
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="display-name" className={label}>
          Display name
        </label>
        <p id="display-name-hint" className="text-ink-muted text-small">
          Friends see this on your grove.
        </p>
        <input
          ref={nameInput}
          id="display-name"
          aria-describedby="display-name-hint"
          value={name}
          maxLength={40}
          autoComplete="nickname"
          onChange={(e) => edit(setName)(e.target.value)}
          className={input}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="font-bold">Change password</legend>
        <p className="text-ink-muted text-small">
          Leave these empty to keep your current password. New passwords need at least 8 characters.
        </p>
        {passwordFields.map(([text, value, onChange, auto]) => (
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
      </fieldset>

      {error && (
        <p role="alert" className="text-small text-danger-text font-bold">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => onDone(false)} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={(!nameChanged && !passwordStarted) || update.isPending}>
          {update.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

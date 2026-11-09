import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api/client';
import { useFriends, useLogout, useMe } from '../api/hooks';
import { Button, ButtonLink, Card, CardTitle, PageHeader } from '../components/ui';
import { useProgressStore } from '../stores/progressStore';

/** Account settings: sign out, friends, and account deletion (FR10, POPIA). */
export function AccountPage() {
  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reset = useProgressStore((s) => s.reset);
  const friends = useFriends(Boolean(me.data));
  const [email, setEmail] = useState('');
  const addFriend = useMutation({
    mutationFn: (e: string) => api.post('/friends/requests', { email: e }),
  });
  const accept = useMutation({
    mutationFn: (id: string) => api.post(`/friends/requests/${id}/accept`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['friends'] }),
  });
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
      <Card className="mx-auto max-w-md text-center">
        <p>You are learning as a guest. Progress lasts until you close this browser tab.</p>
        <ButtonLink to="/login" className="mt-4">
          Sign in
        </ButtonLink>
      </Card>
    );
  }

  const submitFriend = (e: FormEvent) => {
    e.preventDefault();
    addFriend.mutate(email, { onSuccess: () => setEmail('') });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Your account" subtitle={`${me.data.displayName} · ${me.data.email}`} />
      <Card id="friends">
        <CardTitle>Friends</CardTitle>
        <form onSubmit={submitFriend} className="flex gap-2">
          <label htmlFor="friend-email" className="sr-only">
            Friend&apos;s email
          </label>
          <input
            id="friend-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@tuks.co.za"
            className="border-line bg-surface min-w-0 flex-1 rounded-xl border-2 px-3 py-2"
          />
          <Button type="submit" size="sm" disabled={!email}>
            Send request
          </Button>
        </form>
        {addFriend.isSuccess && (
          <p role="status" className="mt-2 text-sm">
            If that email has an account, they&apos;ll see your request.
          </p>
        )}
        {friends.data?.incoming.length ? (
          <ul className="mt-4 space-y-2">
            {friends.data.incoming.map((r) => (
              <li
                key={r.id}
                className="bg-sunken flex items-center justify-between rounded-lg p-3 text-sm"
              >
                {r.fromName} wants to connect
                <Button size="sm" onClick={() => accept.mutate(r.id)}>
                  Accept
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
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
        <p className="text-muted mb-3 text-sm">
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

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import {
  useAcceptRequest,
  useCancelRequest,
  useDeclineRequest,
  useFriends,
  useSendFriendRequest,
  useUnfriend,
} from '../../api/hooks';
import { friendErrorText, sentDate } from '../../lib/friends';
import { Avatar, Button, Card, CardTitle } from '../ui';
import { InviteLink } from './InviteLink';

const row = 'text-small flex flex-wrap items-center gap-2 rounded-md bg-sky-100 p-3';

export function FriendsCard() {
  const friends = useFriends(true);
  const send = useSendFriendRequest();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();
  const cancel = useCancelRequest();
  const unfriend = useUnfriend();
  const [email, setEmail] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === '#friends')
      document.getElementById('friends')?.scrollIntoView?.({ block: 'start' });
  }, [hash]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send.mutate(email, { onSuccess: () => setEmail('') });
  };

  const listError = [accept, decline, cancel, unfriend].find((m) => m.isError)?.error;
  const busy = accept.isPending || decline.isPending || cancel.isPending || unfriend.isPending;
  const { friends: list = [], incoming = [], outgoing = [] } = friends.data ?? {};

  return (
    <Card id="friends">
      <CardTitle>Friends</CardTitle>
      <InviteLink />
      <h3 className="text-label mt-5 mb-2 font-bold">Or add by email</h3>
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="friend-email" className="sr-only">
          Friend&apos;s email
        </label>
        <input
          id="friend-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            send.reset();
          }}
          placeholder="friend@tuks.co.za"
          className="border-ink bg-paper min-w-0 flex-1 rounded-lg border-2 px-3 py-2"
        />
        <Button type="submit" size="sm" disabled={!email || send.isPending}>
          Send request
        </Button>
      </form>
      {send.isSuccess && (
        <p role="status" className="text-small mt-2">
          If that email has an account, they&apos;ll see your request.
        </p>
      )}
      {send.isError && (
        <p role="alert" className="text-small text-danger-text mt-2 font-bold">
          {friendErrorText(send.error)}
        </p>
      )}

      {friends.isError && (
        <p role="alert" className="text-small mt-4">
          Your friends list couldn&apos;t load. Try again later.
        </p>
      )}

      {incoming.length > 0 && (
        <section className="mt-5">
          <h3 className="text-label mb-2 font-bold">Requests for you</h3>
          <ul className="space-y-2">
            {incoming.map((r) => (
              <li key={r.id} className={row}>
                <span className="flex-1">{r.fromName} wants to connect</span>
                <Button size="sm" disabled={busy} onClick={() => accept.mutate(r.id)}>
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => decline.mutate(r.id)}
                  aria-label={`Decline ${r.fromName}'s request`}
                >
                  Decline
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="mt-5">
          <h3 className="text-label mb-2 font-bold">Requests you sent</h3>
          <ul className="space-y-2">
            {outgoing.map((r) => (
              <li key={r.id} className={row}>
                <span className="min-w-0 flex-1 break-all">
                  {r.email}
                  <span className="text-ink-muted"> · sent {sentDate(r.sentAt)}</span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => cancel.mutate(r.id)}
                  aria-label={`Cancel request to ${r.email}`}
                >
                  Cancel request
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h3 className="text-label mb-2 font-bold">Your friends</h3>
        {list.length === 0 ? (
          <p className="text-ink-muted text-small">
            {friends.isPending
              ? 'Loading…'
              : 'No friends yet. Share your invite link or add someone by email.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((f) => (
              <li key={f.id} className={row}>
                <Avatar name={f.displayName} />
                {confirming === f.id ? (
                  <>
                    <span className="flex-1 font-bold">
                      Remove {f.displayName} from your friends?
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-danger text-danger-text"
                      disabled={busy}
                      onClick={() =>
                        unfriend.mutate(f.id, { onSettled: () => setConfirming(null) })
                      }
                    >
                      Remove
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirming(null)}>
                      Keep
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to={`/grove/${f.id}`} className="flex-1 font-bold hover:underline">
                      {f.displayName}
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirming(f.id)}
                      aria-label={`Unfriend ${f.displayName}`}
                    >
                      Unfriend
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {listError && (
        <p role="alert" className="text-small text-danger-text mt-3 font-bold">
          {friendErrorText(listError)}
        </p>
      )}
    </Card>
  );
}

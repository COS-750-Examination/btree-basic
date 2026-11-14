import { UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { ApiRequestError } from '../api/client';
import { useAcceptInvite, useInvitePreview, useMe } from '../api/hooks';
import { Button, ButtonLink, Card } from '../components/ui';
import { friendErrorText } from '../lib/friends';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <UserPlus className="text-leaf mx-auto mb-2 h-10 w-10" aria-hidden />
      <h1 className="text-display-l">{title}</h1>
      <div className="mt-3 space-y-4">{children}</div>
    </Card>
  );
}

const actions = 'flex flex-wrap justify-center gap-3';

export function AddFriendPage() {
  const code = (useParams().code ?? '').toUpperCase();
  const me = useMe();
  const preview = useInvitePreview(code, Boolean(me.data));
  const accept = useAcceptInvite(code);
  const back = `/add/${code}`;

  if (me.isPending) return <p role="status">Loading…</p>;

  if (!me.data) {
    return (
      <Panel title="You've been invited">
        <p>
          A classmate shared their B-Tree Basic invite link with you. Sign in or create an account
          to add them as a friend.
        </p>
        <div className={actions}>
          <ButtonLink to={`/login?next=${encodeURIComponent(back)}`}>Sign in</ButtonLink>
          <ButtonLink to={`/register?next=${encodeURIComponent(back)}`} variant="outline">
            Create an account
          </ButtonLink>
        </div>
      </Panel>
    );
  }

  if (preview.isPending) return <p role="status">Checking the invite link…</p>;

  if (preview.isError) {
    const gone = preview.error instanceof ApiRequestError && preview.error.status === 404;
    return (
      <Panel title={gone ? "This link doesn't work" : 'Something went wrong'}>
        <p>
          {gone
            ? 'It may have been replaced with a new one. Ask your friend for their latest invite link.'
            : friendErrorText(preview.error)}
        </p>
        <div className={actions}>
          <ButtonLink to="/grove">Go to my grove</ButtonLink>
        </div>
      </Panel>
    );
  }

  const { displayName, status, friendId } = preview.data;
  const first = displayName.split(' ')[0];
  const result = accept.data;

  if (result?.status === 'friends' || status === 'friends') {
    const id = result?.friendId ?? friendId;
    return (
      <Panel title={result ? "You're now friends!" : 'Already friends'}>
        <p>
          You and {displayName} are friends. You can visit each other&apos;s groves and send cheers.
        </p>
        <div className={actions}>
          {id && <ButtonLink to={`/grove/${id}`}>Visit {first}&apos;s grove</ButtonLink>}
          <ButtonLink to="/grove" variant="outline">
            My grove
          </ButtonLink>
        </div>
      </Panel>
    );
  }

  if (result?.status === 'sent' || status === 'sent') {
    return (
      <Panel title="Request sent">
        <p>
          {displayName} will see your request on their Account page and My grove. Once they accept,
          you can visit each other&apos;s groves.
        </p>
        <div className={actions}>
          <ButtonLink to="/grove">Go to my grove</ButtonLink>
        </div>
      </Panel>
    );
  }

  if (status === 'self') {
    return (
      <Panel title="This is your own link">
        <p>Share it with classmates so they can add you as a friend.</p>
        <div className={actions}>
          <ButtonLink to="/account#friends">Your friends</ButtonLink>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={`Add ${first} as a friend?`}>
      <p>
        {status === 'received'
          ? `${displayName} has already asked to be your friend. Accept to connect.`
          : `${displayName} shared their invite link with you. Friends can see each other's tree and finished modules. Quiz answers, scores and hints stay private.`}
      </p>
      <div className={actions}>
        <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
          {status === 'received' ? 'Accept' : 'Send friend request'}
        </Button>
        <ButtonLink to="/grove" variant="outline">
          Not now
        </ButtonLink>
      </div>
      {accept.isError && (
        <p role="alert" className="text-small text-danger-text font-bold">
          {friendErrorText(accept.error)}
        </p>
      )}
    </Panel>
  );
}

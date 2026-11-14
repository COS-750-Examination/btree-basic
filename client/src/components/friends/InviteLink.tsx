import { Check, Copy, RefreshCw, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useMyInvite, useResetInvite } from '../../api/hooks';
import { inviteUrl } from '../../lib/invite';
import { Button } from '../ui';

export function InviteLink() {
  const invite = useMyInvite(true);
  const reset = useResetInvite();
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const url = invite.data ? inviteUrl(invite.data.code) : '';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      document.getElementById('invite-url')?.focus();
    }
  };

  const share = () =>
    navigator
      .share({
        title: 'Add me on B-Tree Basic',
        text: "Let's learn B-trees together. Add me as a friend:",
        url,
      })
      .catch(() => undefined);

  return (
    <section aria-labelledby="invite-heading">
      <h3 id="invite-heading" className="text-label font-bold">
        Your invite link
      </h3>
      <p className="text-ink-muted text-small mb-2">
        Share it with classmates. Opening it lets them send you a friend request, which you then
        accept.
      </p>
      {invite.isError ? (
        <p role="alert" className="text-small">
          Your invite link couldn&apos;t load. Try again later.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <label htmlFor="invite-url" className="sr-only">
              Your invite link
            </label>
            <input
              id="invite-url"
              readOnly
              value={invite.isPending ? 'Loading…' : url}
              onFocus={(e) => e.currentTarget.select()}
              className="border-ink bg-paper text-small min-w-0 flex-1 basis-56 rounded-lg border-2 px-3 py-2"
            />
            <Button size="sm" onClick={() => void copy()} disabled={!url}>
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
            {canShare && (
              <Button size="sm" variant="outline" onClick={() => void share()} disabled={!url}>
                <Share2 className="h-4 w-4" aria-hidden />
                Share
              </Button>
            )}
          </div>
          <p role="status" className="sr-only">
            {copied ? 'Invite link copied' : ''}
          </p>
          <div className="text-small mt-2">
            {confirmReset ? (
              <span className="flex flex-wrap items-center gap-2">
                <span>The old link will stop working. Make a new one?</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reset.isPending}
                  onClick={() =>
                    reset.mutate(undefined, { onSettled: () => setConfirmReset(false) })
                  }
                >
                  Make new link
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>
                  Keep this one
                </Button>
              </span>
            ) : (
              <button
                type="button"
                className="text-ink-muted inline-flex items-center gap-1 underline"
                onClick={() => setConfirmReset(true)}
                disabled={!url}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Shared it with the wrong people? Make a new link
              </button>
            )}
          </div>
          {reset.isError && (
            <p role="alert" className="text-small text-danger-text mt-1 font-bold">
              Couldn&apos;t make a new link. Try again later.
            </p>
          )}
        </>
      )}
    </section>
  );
}

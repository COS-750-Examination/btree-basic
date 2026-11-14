import { PartyPopper } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCheers } from '../../api/hooks';
import { cheersFor, useCheersSeenStore } from '../../stores/cheersStore';
import { Avatar, Card, CardTitle } from '../ui';

const dateFmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' });

export function CheersCard({ userId }: { userId: string }) {
  const cheers = useCheers(true);
  const markSeen = useCheersSeenStore((s) => s.markSeen);
  const [seenBefore] = useState(() => useCheersSeenStore.getState().seen[userId] ?? '');
  const received = cheersFor(cheers.data ?? [], userId).slice(0, 5);
  const latest = received[0]?.createdAt;

  useEffect(() => {
    if (latest) markSeen(userId, latest);
  }, [latest, userId, markSeen]);

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <PartyPopper className="text-leaf h-5 w-5" aria-hidden />
        Cheers for you
      </CardTitle>
      {cheers.isError ? (
        <p className="text-small">Your cheers couldn&apos;t load. Try again later.</p>
      ) : received.length === 0 ? (
        <p className="text-ink-muted text-small">
          {cheers.isPending
            ? 'Loading…'
            : 'No cheers yet. Friends can send you one from your grove.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {received.map((c) => (
            <li key={c.id} className="text-small flex items-start gap-2">
              <Avatar name={c.fromName} />
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-bold">{c.fromName}</span> cheered you
                  {c.moduleId ? ` on Module ${c.moduleId}` : ''}
                  {c.createdAt > seenBefore && (
                    <span className="bg-highlight text-on-highlight rounded-pill ml-1.5 px-2 py-0.5 text-[0.75rem] font-bold whitespace-nowrap">
                      New
                    </span>
                  )}
                </p>
                {c.message && <p className="text-ink-muted">“{c.message}”</p>}
                <p className="text-ink-muted">{dateFmt.format(new Date(c.createdAt))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

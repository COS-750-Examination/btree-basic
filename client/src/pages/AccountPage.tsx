import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api/client';
import { useFriends, useLogout, useMarkRequestsSeen, useMe } from '../api/hooks';
import { AppearanceCard } from '../components/account/AppearanceCard';
import { ProfileCard } from '../components/account/ProfileCard';
import { FriendsCard } from '../components/friends/FriendsCard';
import { Button, ButtonLink, Card, CardTitle, PageHeader } from '../components/ui';
import { newRequests } from '../lib/friends';
import { useProgressStore } from '../stores/progressStore';

/** Account settings: appearance, friends, sign out and account deletion (FR10, POPIA). */
export function AccountPage() {
  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const reset = useProgressStore((s) => s.reset);
  const friends = useFriends(Boolean(me.data));
  const { mutate: markSeen } = useMarkRequestsSeen();
  const latestNew = newRequests(friends.data)
    .map((r) => r.sentAt)
    .sort()
    .at(-1);

  useEffect(() => {
    if (latestNew) markSeen(latestNew);
  }, [latestNew, markSeen]);
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
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Your account" subtitle="Learning as a guest" />
        <Card className="text-center">
          <p>You are learning as a guest. Progress lasts until you close this browser tab.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/login">Sign in</ButtonLink>
            <ButtonLink to="/register" variant="outline">
              Create an account
            </ButtonLink>
          </div>
        </Card>
        <AppearanceCard signedIn={false} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Your account" subtitle={`${me.data.displayName} · ${me.data.email}`} />
      <ProfileCard user={me.data} />
      <AppearanceCard signedIn />
      <FriendsCard />
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
        <CardTitle>Your data</CardTitle>
        <p className="text-ink-muted text-small mb-3">
          Download a copy of everything B-Tree Basic stores about you (your account, progress,
          answers, leaves, badges and friends) as a JSON file. This is your right under POPIA.
        </p>
        <a
          href="/api/account/export"
          download
          className="border-ink text-label font-display inline-flex items-center gap-2 rounded-lg border-2 px-3 py-1.5"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download my data
        </a>
      </Card>
      <Card>
        <CardTitle>Delete account</CardTitle>
        <p className="text-ink-muted text-small mb-3">
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

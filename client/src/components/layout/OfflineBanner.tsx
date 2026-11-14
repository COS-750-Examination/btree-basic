import { CloudOff, WifiOff } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useOnline } from '../../lib/useOnline';
import { useProgressStore } from '../../stores/progressStore';
import { useSyncStore } from '../../stores/syncStore';
import { Button } from '../ui';

/**
 * Tells the student when they are offline or when progress did not save, instead of the
 * save failing silently. Queued saves are sent again as soon as the connection returns.
 */
export function OfflineBanner() {
  const online = useOnline();
  const signedIn = useProgressStore((s) => s.signedIn);
  const { queue, rejected, retrying, retry, dismissRejected } = useSyncStore();
  const unsaved = queue.length;

  // Back online: send what is waiting.
  useEffect(() => {
    if (online && unsaved > 0) void retry();
  }, [online, unsaved, retry]);

  // Closing the tab would lose the queue, so ask the browser to warn first.
  useEffect(() => {
    if (unsaved === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  let icon = <CloudOff className="h-5 w-5 shrink-0" aria-hidden />;
  let message: string | null = null;
  let action: ReactNode = null;

  if (!online) {
    icon = <WifiOff className="h-5 w-5 shrink-0" aria-hidden />;
    message = signedIn
      ? "You're offline. Keep going: your progress will save when you reconnect. Keep this tab open until then."
      : "You're offline. Pages you've already opened still work.";
  } else if (unsaved > 0) {
    message = `${unsaved === 1 ? 'One change' : `${unsaved} changes`} to your progress ${unsaved === 1 ? "hasn't" : "haven't"} saved yet. Keep this tab open.`;
    action = (
      <Button size="sm" variant="ghost" onClick={() => void retry()} disabled={retrying}>
        {retrying ? 'Saving…' : 'Try again'}
      </Button>
    );
  } else if (rejected) {
    message =
      "Some of your progress couldn't be saved. Signing out and back in usually fixes this.";
    action = (
      <Button size="sm" variant="ghost" onClick={dismissRejected}>
        Dismiss
      </Button>
    );
  }

  return (
    // The live region stays mounted so screen readers announce the message when it appears.
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl px-4">
      {message && (
        <div className="bg-highlight text-on-highlight shadow-paper-stack-sm mt-4 flex flex-wrap items-center gap-3 rounded-lg px-4 py-3">
          {icon}
          <p className="flex-1 font-bold">{message}</p>
          {action}
        </div>
      )}
    </div>
  );
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** A page whose code could not be downloaded, usually because the student went offline. */
const isChunkLoadError = (e: Error) =>
  /dynamically imported module|Importing a module script failed|Loading chunk/i.test(e.message);

/**
 * Catches a crash in one screen and shows a friendly card instead of a blank page.
 * AppShell gives it a `key` per route, so moving to another page clears the error.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack);
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const offline = isChunkLoadError(error);
    return (
      <div
        role="alert"
        className="bg-paper shadow-paper-stack mx-auto max-w-md rounded-lg p-5 text-center"
      >
        <h1 className="text-display-l">This branch snapped</h1>
        <p className="text-ink-muted mt-2">
          {offline
            ? "This page couldn't load. Check your internet connection, then try again."
            : 'Something went wrong on this page. Your progress is safe.'}
        </p>
        {import.meta.env.DEV && (
          <pre className="text-small text-danger-text mt-4 overflow-auto text-left whitespace-pre-wrap">
            {error.message}
          </pre>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Reload the page</Button>
          {/* A plain link, not a router Link: the outer boundary sits outside the router's shell. */}
          <a href="/" className="text-label self-center font-bold underline">
            Back to the start
          </a>
        </div>
      </div>
    );
  }
}

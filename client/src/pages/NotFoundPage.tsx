import { ButtonLink, Card } from '../components/ui';

export function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <h1 className="text-3xl">This branch is bare</h1>
      <p className="text-muted mt-2">We couldn&apos;t find that page.</p>
      <ButtonLink to="/" className="mt-4">
        Back to the start
      </ButtonLink>
    </Card>
  );
}

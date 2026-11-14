import { QueryClient } from '@tanstack/react-query';

/**
 * The app's one query client. It lives in its own module so stores can refresh server data
 * (for example the streak after an answer is saved) without being React components.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

import type { PublicUser } from '@btree/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, api } from '../../api/client';
import { AppearanceCard } from './AppearanceCard';
import { ProfileCard } from './ProfileCard';
import { useThemeStore } from '../../stores/themeStore';

const user: PublicUser = {
  id: 'u1',
  email: 'sam@tuks.co.za',
  displayName: 'Sam',
  theme: null,
  plantedAt: '2026-11-01T00:00:00.000Z',
};

let qc: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => vi.restoreAllMocks());

async function changePassword(current: string, next: string, confirm = next) {
  await userEvent.type(screen.getByLabelText('Current password'), current);
  await userEvent.type(screen.getByLabelText('New password'), next);
  await userEvent.type(screen.getByLabelText('Confirm new password'), confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
}

describe('ProfileCard name', () => {
  it('saves a new display name and updates the signed-in user', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ ...user, displayName: 'Sam M' });
    render(<ProfileCard user={user} />, { wrapper });

    await userEvent.type(screen.getByLabelText('Display name'), ' M');
    await userEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(patch).toHaveBeenCalledWith('/account', { displayName: 'Sam M' }, expect.anything());
    expect(await screen.findByRole('status')).toHaveTextContent('Name saved.');
    expect(qc.getQueryData(['me'])).toMatchObject({ displayName: 'Sam M' });
  });
});

describe('ProfileCard password', () => {
  it('changes the password and clears the fields', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(user);
    render(<ProfileCard user={user} />, { wrapper });
    await changePassword('old-pass-123', 'new-pass-456');

    expect(patch).toHaveBeenCalledWith(
      '/account',
      { currentPassword: 'old-pass-123', newPassword: 'new-pass-456' },
      expect.anything(),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Password changed.');
    expect(screen.getByLabelText('Current password')).toHaveValue('');
  });

  it('shows "Current password is incorrect" from the server', async () => {
    vi.spyOn(api, 'patch').mockRejectedValue(
      new ApiRequestError(400, 'Current password is incorrect'),
    );
    render(<ProfileCard user={user} />, { wrapper });
    await changePassword('wrong-pass', 'new-pass-456');
    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect');
  });

  it('shows the slow-down message after too many changes', async () => {
    vi.spyOn(api, 'patch').mockRejectedValue(
      new ApiRequestError(429, 'Slow down a little and try again later'),
    );
    render(<ProfileCard user={user} />, { wrapper });
    await changePassword('old-pass-123', 'new-pass-456');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Slow down a little and try again later',
    );
  });

  it('checks length and matching before sending anything', async () => {
    const patch = vi.spyOn(api, 'patch');
    render(<ProfileCard user={user} />, { wrapper });

    await changePassword('old-pass-123', 'short');
    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters');

    await userEvent.clear(screen.getByLabelText('New password'));
    await userEvent.clear(screen.getByLabelText('Confirm new password'));
    await userEvent.clear(screen.getByLabelText('Current password'));
    await changePassword('old-pass-123', 'new-pass-456', 'new-pass-789');
    expect(screen.getByRole('alert')).toHaveTextContent("The new passwords don't match.");
    expect(patch).not.toHaveBeenCalled();
  });
});

describe('AppearanceCard', () => {
  it('saves the theme to the account when signed in', async () => {
    useThemeStore.setState({ theme: 'day' });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ ...user, theme: 'dusk' });
    render(<AppearanceCard signedIn />, { wrapper });
    await userEvent.click(screen.getByLabelText('Dusk'));
    expect(useThemeStore.getState().theme).toBe('dusk');
    expect(patch).toHaveBeenCalledWith('/account', { theme: 'dusk' }, expect.anything());
  });

  it('keeps a guest theme on this device only', async () => {
    useThemeStore.setState({ theme: 'day' });
    const patch = vi.spyOn(api, 'patch');
    render(<AppearanceCard signedIn={false} />, { wrapper });
    await userEvent.click(screen.getByLabelText('Dusk'));
    expect(useThemeStore.getState().theme).toBe('dusk');
    expect(patch).not.toHaveBeenCalled();
    expect(screen.getByText(/saved on this device/i)).toBeInTheDocument();
  });
});

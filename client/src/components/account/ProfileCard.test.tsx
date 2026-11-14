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

const startEditing = () => userEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

async function fillPassword(current: string, next: string, confirm = next) {
  await userEvent.type(screen.getByLabelText('Current password'), current);
  await userEvent.type(screen.getByLabelText('New password'), next);
  await userEvent.type(screen.getByLabelText('Confirm new password'), confirm);
}

describe('ProfileCard view', () => {
  it('shows the profile without any fields until the pen is clicked', async () => {
    render(<ProfileCard user={user} />, { wrapper });
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('sam@tuks.co.za')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await startEditing();
    expect(screen.getByLabelText('Display name')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('goes back to the view on Cancel without saving', async () => {
    const patch = vi.spyOn(api, 'patch');
    render(<ProfileCard user={user} />, { wrapper });
    await startEditing();
    await userEvent.type(screen.getByLabelText('Display name'), ' M');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(patch).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit profile' })).toHaveFocus();
  });
});

describe('ProfileCard saving', () => {
  it('saves a new name and returns to the view', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ ...user, displayName: 'Sam M' });
    render(<ProfileCard user={user} />, { wrapper });
    await startEditing();
    await userEvent.type(screen.getByLabelText('Display name'), ' M');
    await save();

    expect(patch).toHaveBeenCalledWith('/account', { displayName: 'Sam M' }, expect.anything());
    expect(await screen.findByRole('status')).toHaveTextContent('Changes saved.');
    expect(qc.getQueryData(['me'])).toMatchObject({ displayName: 'Sam M' });
  });

  it('saves the name and password together', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(user);
    render(<ProfileCard user={user} />, { wrapper });
    await startEditing();
    await userEvent.type(screen.getByLabelText('Display name'), ' M');
    await fillPassword('old-pass-123', 'new-pass-456');
    await save();

    expect(patch).toHaveBeenCalledWith(
      '/account',
      { displayName: 'Sam M', currentPassword: 'old-pass-123', newPassword: 'new-pass-456' },
      expect.anything(),
    );
    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
  });

  it('stays in edit mode and shows "Current password is incorrect"', async () => {
    vi.spyOn(api, 'patch').mockRejectedValue(
      new ApiRequestError(400, 'Current password is incorrect'),
    );
    render(<ProfileCard user={user} />, { wrapper });
    await startEditing();
    await fillPassword('wrong-pass', 'new-pass-456');
    await save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect');
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
  });

  it('shows the slow-down message after too many changes', async () => {
    vi.spyOn(api, 'patch').mockRejectedValue(
      new ApiRequestError(429, 'Slow down a little and try again later'),
    );
    render(<ProfileCard user={user} />, { wrapper });
    await startEditing();
    await fillPassword('old-pass-123', 'new-pass-456');
    await save();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Slow down a little and try again later',
    );
  });

  it('checks the password fields before sending anything', async () => {
    const patch = vi.spyOn(api, 'patch');
    render(<ProfileCard user={user} />, { wrapper });
    await startEditing();

    await userEvent.type(screen.getByLabelText('New password'), 'new-pass-456');
    await save();
    expect(screen.getByRole('alert')).toHaveTextContent(/fill in all three/i);

    await userEvent.type(screen.getByLabelText('Current password'), 'old-pass-123');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'new-pass-789');
    await save();
    expect(screen.getByRole('alert')).toHaveTextContent("The new passwords don't match.");

    await userEvent.clear(screen.getByLabelText('New password'));
    await userEvent.clear(screen.getByLabelText('Confirm new password'));
    await userEvent.type(screen.getByLabelText('New password'), 'short');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'short');
    await save();
    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters');
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

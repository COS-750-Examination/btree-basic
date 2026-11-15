import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { practiceDay, saveDone } from '../lib/practiceDay';
import { PracticePage } from './PracticePage';

function show(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/practice/:activity?" element={<PracticePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function playValidOrNot() {
  for (let i = 1; i <= 4; i += 1) {
    expect(await screen.findByText(`Exercise ${i} of 4`)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Valid B-tree'));
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    const next = await screen.findByRole('button', {
      name: /Next exercise|Next activity|Finish practice/,
    });
    if (i < 4) expect(next).toHaveTextContent('Next exercise');
    await userEvent.click(next);
  }
}

beforeEach(() => {
  vi.spyOn(api, 'get').mockResolvedValue({ user: null } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('PracticePage', () => {
  it('puts This activity before the questions so it sits on top on small screens', async () => {
    show('/practice/valid-or-not');
    const card = await screen.findByText('This activity');
    const panel = screen.getByRole('tabpanel');
    expect(card.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('moves on to the next unfinished activity after 4 exercises', async () => {
    saveDone('guest', practiceDay(), ['predict-search-path', 'where-does-it-go']);
    show('/practice/valid-or-not');
    await playValidOrNot();
    expect(await screen.findByRole('tab', { name: /Split it yourself/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Exercise 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Valid or not\?.*done today/ })).toBeInTheDocument();
  });

  it('congratulates and locks practice once all four are done', async () => {
    saveDone('guest', practiceDay(), [
      'predict-search-path',
      'where-does-it-go',
      'split-it-yourself',
    ]);
    show('/practice/valid-or-not');
    await playValidOrNot();

    const dialog = await screen.findByRole('dialog', { name: 'Congrats!' });
    expect(dialog).toHaveTextContent(
      'You completed all the practice questions for today. Come back tomorrow for more.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText("You've finished today's practice")).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  it('stays locked for the rest of the day', async () => {
    saveDone('guest', practiceDay(), [
      'predict-search-path',
      'where-does-it-go',
      'split-it-yourself',
      'valid-or-not',
    ]);
    show('/practice/predict-search-path');
    expect(await screen.findByText("You've finished today's practice")).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

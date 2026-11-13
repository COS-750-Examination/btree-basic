import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { quizFor } from '../../lib/content';
import { QuestionCard } from './QuestionCard';

const tracePath = quizFor(5)!.items.find((i) => i.id === 'm5-q1')!;

function renderTracePath(locked = false) {
  const onSubmit = vi.fn();
  render(<QuestionCard item={tracePath} answer={null} onSubmit={onSubmit} locked={locked} />);
  return { onSubmit, user: userEvent.setup() };
}

const node = (keys: string) => screen.getByRole('button', { name: `Node with keys ${keys}` });

describe('QuestionCard: tap the nodes (trace-path)', () => {
  it('submits the tapped path and marks the right path correct', async () => {
    const { onSubmit, user } = renderTracePath();
    await user.click(node('20, 40'));
    await user.click(node('25, 30, 35, 38'));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(onSubmit).toHaveBeenCalledWith(
      '20,40|25,30,35,38',
      expect.objectContaining({ correct: true }),
    );
  });

  it('marks a path that stops too early as wrong', async () => {
    const { onSubmit, user } = renderTracePath();
    await user.click(node('20, 40'));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(onSubmit).toHaveBeenCalledWith('20,40', expect.objectContaining({ correct: false }));
  });

  it('clears the tapped path', async () => {
    const { user } = renderTracePath();
    await user.click(node('20, 40'));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  });

  it('ignores taps once the question is locked', async () => {
    const { user } = renderTracePath(true);
    await user.click(node('20, 40'));
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  });
});

describe('QuestionCard: multiple choice', () => {
  const mcq = quizFor(10)!.items.find((i) => i.id === 'r-o1')!;
  const options = 'options' in mcq ? mcq.options : [];
  const correctText = options.find((o) => o.correct)!.text;

  it('shuffles the options, and the correct one still marks correct', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const onSubmit = vi.fn();
    render(<QuestionCard item={mcq} answer={null} onSubmit={onSubmit} locked={false} />);
    vi.restoreAllMocks();

    const shown = screen.getAllByRole('button').map((b) => b.textContent);
    expect(shown).toHaveLength(options.length);
    expect(shown[0]).not.toBe(correctText);

    await userEvent.setup().click(screen.getByRole('button', { name: correctText }));
    expect(onSubmit).toHaveBeenCalledWith('a', expect.objectContaining({ correct: true }));
  });
});

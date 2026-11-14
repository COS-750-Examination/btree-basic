import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { splitAnswer } from '../lib/miniLessons';
import { MiniLessonPage } from './MiniLessonPage';

function show(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/mini-lessons/:objective" element={<MiniLessonPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MiniLessonPage', () => {
  it('shows the lesson for the objective with the answer hidden until asked', async () => {
    show('/mini-lessons/O5?from=%2Fquiz%2F6');
    expect(screen.getByRole('heading', { name: 'Split an overflowing node' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Worked example' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Answer' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByRole('region', { name: 'Answer' })).toHaveTextContent(/30 moves up/);
  });

  it('links back to where the student came from, to practice and to the full lesson', () => {
    show('/mini-lessons/o5?from=%2Fquiz%2F6');
    expect(screen.getByRole('link', { name: '← Back' })).toHaveAttribute('href', '/quiz/6');
    expect(screen.getByRole('link', { name: /practise: split it yourself/i })).toHaveAttribute(
      'href',
      '/practice/split-it-yourself',
    );
    expect(screen.getByRole('link', { name: /full lesson: module 6/i })).toHaveAttribute(
      'href',
      '/lessons/6',
    );
  });

  it('ignores a back link to another site', () => {
    show('/mini-lessons/O1?from=%2F%2Fevil.example');
    expect(screen.getByRole('link', { name: '← Back to quizzes' })).toHaveAttribute(
      'href',
      '/quiz',
    );
  });

  it('shows the not-found page for an unknown objective', () => {
    show('/mini-lessons/O9');
    expect(screen.queryByRole('heading', { name: 'Worked example' })).not.toBeInTheDocument();
  });
});

describe('splitAnswer', () => {
  it('separates the answer from the lesson', () => {
    expect(splitAnswer('Intro\n\n## Answer\n\nIt is 5.')).toEqual({
      body: 'Intro\n\n',
      answer: 'It is 5.',
    });
    expect(splitAnswer('No answer here')).toEqual({ body: 'No answer here', answer: null });
  });
});

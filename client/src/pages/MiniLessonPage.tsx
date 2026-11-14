import { MODULES, OBJECTIVES, type ObjectiveId } from '@btree/shared';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { useParams, useSearchParams } from 'react-router';
import { Button, ButtonLink, Card, PageHeader } from '../components/ui';
import { miniLesson } from '../lib/content';
import { safeNext } from '../lib/invite';
import { MINI_LESSON_LINKS, splitAnswer } from '../lib/miniLessons';
import { NotFoundPage } from './NotFoundPage';

const prose =
  'space-y-3 text-[17px] leading-relaxed [&_blockquote]:rounded-lg [&_blockquote]:bg-sky-100 [&_blockquote]:p-4 [&_code]:font-mono [&_h2]:font-display [&_h2]:text-heading [&_h2]:pt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-extrabold [&_ul]:list-disc [&_ul]:pl-6';

export function MiniLessonPage() {
  const id = useParams().objective?.toUpperCase();
  const back = safeNext(useSearchParams()[0].get('from'));
  const objective = OBJECTIVES.find((o) => o.id === id);
  const md = objective ? miniLesson(objective.id) : undefined;
  const [shown, setShown] = useState(false);

  if (!objective || !md) return <NotFoundPage />;

  const { body, answer } = splitAnswer(md);
  const links = MINI_LESSON_LINKS[objective.id as ObjectiveId];
  const module = MODULES.find((m) => m.id === links.module);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        tag={`Mini-lesson · Objective ${objective.id.slice(1)}`}
        title={objective.label}
        subtitle="A short recap with a worked example. About 3 minutes."
      />
      <Card>
        <div className={prose}>
          <Markdown>{body}</Markdown>
        </div>
        {answer && (
          <div className="mt-4">
            {shown ? (
              <div
                className={`${prose} rounded-lg bg-sky-100 p-4`}
                role="region"
                aria-label="Answer"
              >
                <Markdown>{answer}</Markdown>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShown(true)}>
                <Eye className="h-4 w-4" aria-hidden />
                Show answer
              </Button>
            )}
          </div>
        )}
      </Card>
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <ButtonLink to={back ?? '/quiz'} variant="outline">
          ← {back?.startsWith('/practice') ? 'Back to practice' : back ? 'Back' : 'Back to quizzes'}
        </ButtonLink>
        <div className="flex flex-wrap gap-3">
          {links.practice && (
            <ButtonLink to={links.practice.to} variant="outline">
              Practise: {links.practice.label}
            </ButtonLink>
          )}
          <ButtonLink to={`/lessons/${links.module}`}>
            Full lesson: Module {links.module}
            {module ? ` · ${module.title}` : ''}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

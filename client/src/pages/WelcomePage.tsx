import { Play, Square } from 'lucide-react';
import { useState } from 'react';
import { GroveTree } from '../components/grove/GroveTree';
import { SceneBackdrop } from '../components/grove/SceneBackdrop';
import { ButtonLink, Card, Tag } from '../components/ui';
import { speak, speechSupported, stopSpeaking } from '../lib/speech';
import { useLocalReadiness } from '../stores/progressStore';

const INTRO =
  'How does a database find one record among millions while reading from disk only three or four times? ' +
  'The answer is a B-tree. In about forty-five minutes you will learn how it works, watch it grow, try it yourself, ' +
  'and grow your own tree as you go.';

const STEPS = [
  { n: 1, title: 'Learn', text: 'Short lessons that mix pictures, text and narration.' },
  {
    n: 2,
    title: 'Try',
    text: 'Step through insertions in the visualiser and split nodes yourself.',
  },
  {
    n: 3,
    title: 'Grow',
    text: 'Every module you master grows your tree. Leaves you earn buy decorations.',
  },
];

/** Screen 01: sets the goal and offers a route for returning students. */
export function WelcomePage() {
  const [playing, setPlaying] = useState(false);
  const r = useLocalReadiness();

  const toggleIntro = () => {
    if (playing) stopSpeaking();
    else speak(INTRO);
    setPlaying(!playing);
  };

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <Tag>COS212 · Pre-lecture prep</Tag>
          <h1 className="text-display-l sm:text-display-xl mt-4">
            Learn B-trees one branch at a time.
          </h1>
          <p className="text-ink-muted text-body mt-4 max-w-lg">
            Meet the B-tree. Learn how it works, watch it grow, try it yourself, and grow your own
            tree as you go.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/warm-up" size="lg">
              Start the 2-minute warm-up
            </ButtonLink>
            <ButtonLink to={r.modulesDone > 0 ? '/lessons' : '/login'} variant="outline" size="lg">
              I&apos;ve been here before
            </ButtonLink>
          </div>
          <p className="text-ink-muted text-small mt-3">
            No prior knowledge needed · about 45 minutes · progress saves automatically
          </p>
        </div>

        <SceneBackdrop className="aspect-[16/10]">
          <div className="flex items-center gap-3 p-5">
            {speechSupported() && (
              <button
                type="button"
                onClick={toggleIntro}
                aria-label={playing ? 'Stop the intro' : 'Play the 60-second intro'}
                className="bg-leaf text-on-leaf shadow-press-leaf rounded-pill grid h-12 w-12 place-items-center"
              >
                {playing ? <Square className="h-4 w-4" /> : <Play className="h-5 w-5" />}
              </button>
            )}
            <span className="bg-paper font-display rounded-pill text-small px-3 py-1">
              Intro · 60 s
            </span>
          </div>
          <div className="bg-paper shadow-paper-stack-sm text-label mx-auto mt-2 w-fit -rotate-2 rounded-sm px-3 py-1.5 font-bold">
            Your seed is waiting. It sprouts after module 1.
          </div>
          <div className="mx-auto mt-2 w-56">
            <GroveTree stage={r.stage === 'seed' ? 'sprout' : r.stage} />
          </div>
        </SceneBackdrop>
      </section>

      <section aria-labelledby="what-youll-do">
        <h2 id="what-youll-do" className="text-heading mb-4">
          What you&apos;ll do
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Card className="h-full">
                <span
                  className={`font-display shadow-paper-stack-sm rounded-pill grid h-10 w-10 place-items-center ${s.n === 3 ? 'bg-highlight text-on-highlight' : 'bg-paper'}`}
                >
                  {s.n}
                </span>
                <h3 className="text-body mt-3">{s.title}</h3>
                <p className="text-ink-muted mt-1">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

import { lazy, Suspense, type ComponentType } from 'react';
import { Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { WelcomePage } from './pages/WelcomePage';

// Each screen is its own chunk so mobile-data users only download what they open.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const WarmupPage = named(() => import('./pages/WarmupPage'), 'WarmupPage');
const LessonsPage = named(() => import('./pages/LessonsPage'), 'LessonsPage');
const LessonPage = named(() => import('./pages/LessonPage'), 'LessonPage');
const VisualiserPage = named(() => import('./pages/VisualiserPage'), 'VisualiserPage');
const PracticePage = named(() => import('./pages/PracticePage'), 'PracticePage');
const QuizPage = named(() => import('./pages/QuizPage'), 'QuizPage');
const ReadyPage = named(() => import('./pages/ReadyPage'), 'ReadyPage');
const GrovePage = named(() => import('./pages/GrovePage'), 'GrovePage');
const FriendGrovePage = named(() => import('./pages/FriendGrovePage'), 'FriendGrovePage');
const LoginPage = named(() => import('./pages/AuthPages'), 'LoginPage');
const RegisterPage = named(() => import('./pages/AuthPages'), 'RegisterPage');
const AccountPage = named(() => import('./pages/AccountPage'), 'AccountPage');
const NotFoundPage = named(() => import('./pages/NotFoundPage'), 'NotFoundPage');

/** Routes map one-to-one to the screens in the Instructional Design document (01–10). */
export function App() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-muted p-8 text-center">
          Growing…
        </p>
      }
    >
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<WelcomePage />} />
          <Route path="warm-up" element={<WarmupPage />} />
          <Route path="lessons" element={<LessonsPage />} />
          <Route path="lessons/:moduleId" element={<LessonPage />} />
          <Route path="visualiser" element={<VisualiserPage />} />
          <Route path="practice/:activity?" element={<PracticePage />} />
          <Route path="quiz/:moduleId?" element={<QuizPage />} />
          <Route path="ready" element={<ReadyPage />} />
          <Route path="grove" element={<GrovePage />} />
          <Route path="grove/:friendId" element={<FriendGrovePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

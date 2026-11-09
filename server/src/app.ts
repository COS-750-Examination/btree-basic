import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { corsOrigins, env } from './env';
import { loadSession } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';
import { accountRouter } from './routes/account';
import { authRouter } from './routes/auth';
import { friendsRouter } from './routes/friends';
import { groveRouter } from './routes/grove';
import { healthRouter } from './routes/health';
import { progressRouter } from './routes/progress';

/** Builds the Express app without listening, so tests can drive it with Supertest. */
export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // behind Render/Vercel proxies in production
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        transport:
          env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: { singleLine: true, ignore: 'pid,hostname,req,res,responseTime' },
              }
            : undefined,
        redact: ['req.headers.cookie', 'res.headers["set-cookie"]'],
      }),
    );
  }
  app.use(loadSession);

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/account', accountRouter);
  app.use('/api', progressRouter);
  app.use('/api', groveRouter);
  app.use('/api', friendsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

import * as Sentry from '@sentry/node';
import express from 'express';
import { importRouter } from './import/router';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
});

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(Sentry.Handlers.requestHandler());

app.use('/api/import', importRouter);

app.use(Sentry.Handlers.errorHandler());

app.listen(PORT, () => {
  console.log(`PSG Portal API listening on port ${PORT}`);
});

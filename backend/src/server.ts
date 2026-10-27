import express from 'express';
import { chapterRouter } from './routes/chapter.js';
import { historyRouter } from './routes/history.js';
import { localStoryRouter } from './routes/localStory.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use('/api', chapterRouter);
app.use('/api', historyRouter);
app.use('/api', localStoryRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(500).json({ error: 'Không thể tải chương truyện.' }));
const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Local WikiCV backend listening on http://localhost:${port}`));

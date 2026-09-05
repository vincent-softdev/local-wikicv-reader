import express from 'express';
import { chapterRouter } from './routes/chapter.js';

const app = express();
app.disable('x-powered-by');
app.use('/api', chapterRouter);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(500).json({ error: 'Không thể tải chương truyện.' }));
const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Local WikiCV backend listening on http://localhost:${port}`));

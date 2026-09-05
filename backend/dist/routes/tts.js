import { Router } from 'express';
const router = Router();
const ttsBaseUrl = process.env.VIETTTS_URL ?? 'http://localhost:8298';
const builtInVoices = [
    'nsnd-le-chuc', 'speechify_10', 'atuan', 'speechify_11', 'cdteam', 'speechify_12',
    'cross_lingual_prompt', 'speechify_2', 'diep-chi', 'speechify_3', 'doremon',
    'speechify_4', 'jack-sparrow', 'speechify_5', 'nguyen-ngoc-ngan', 'speechify_6',
    'nu-nhe-nhang', 'speechify_7', 'quynh', 'speechify_8', 'speechify_9', 'son-tung-mtp',
    'zero_shot_prompt', 'speechify_1'
];
router.get('/tts/status', async (_req, res) => {
    try {
        const response = await fetch(`${ttsBaseUrl}/v1/voices`, { signal: AbortSignal.timeout(3000) });
        if (!response.ok)
            throw new Error('TTS unavailable');
        const data = await response.json();
        res.json({ available: true, voices: data });
    }
    catch {
        res.json({ available: false, voices: builtInVoices, message: 'VietTTS chưa chạy. Hãy khởi động dịch vụ VietTTS tại cổng 8298.' });
    }
});
router.post('/tts', async (req, res) => {
    const { text, voice = 'cdteam', speed = 1 } = req.body;
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 5000)
        return res.status(400).json({ error: 'Nội dung đọc không hợp lệ.' });
    const safeSpeed = typeof speed === 'number' && speed >= 0.5 && speed <= 2 ? speed : 1;
    try {
        const response = await fetch(`${ttsBaseUrl}/v1/audio/speech`, {
            method: 'POST', signal: AbortSignal.timeout(60000),
            headers: { Authorization: 'Bearer viet-tts', 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'tts-1', voice: typeof voice === 'string' ? voice : 'cdteam', input: text, speed: safeSpeed, response_format: 'wav' })
        });
        if (!response.ok)
            return res.status(502).json({ error: 'Không thể tạo giọng đọc VietTTS.' });
        res.setHeader('Content-Type', response.headers.get('content-type') ?? 'audio/wav');
        res.send(Buffer.from(await response.arrayBuffer()));
    }
    catch {
        res.status(503).json({ error: 'VietTTS chưa chạy. Hãy khởi động dịch vụ VietTTS tại cổng 8298.' });
    }
});
export { router as ttsRouter };

# Local WikiCV Reader

A personal, local novel reader for authorised WikiCV content. Paste a WikiCV chapter URL, read it in a clean interface, and use the browser's built-in Vietnamese speech synthesis paragraph by paragraph.

## Requirements

- Node.js 20+
- A modern browser
- A browser/operating system with a Vietnamese speech voice installed

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:3001](http://localhost:3001).

Useful commands: `npm run test`, `npm run typecheck`, and `npm run build`.

Only `https://wikicv.org` and `https://www.wikicv.org` chapter URLs are supported. The local backend fetches content only after the user supplies a WikiCV URL; the frontend never fetches WikiCV directly. The tool is intended for personal use with content the user is authorised to access.

Text to speech is provided by the browser/system Web Speech API. Only voices whose language is `vi-*` appear in the voice selector. Reading progress, settings, and recent chapters are stored in the browser's localStorage; no database or account is used.

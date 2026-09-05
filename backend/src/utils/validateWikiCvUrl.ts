const ALLOWED_HOSTS = new Set(['wikicv.org', 'www.wikicv.org']);

export function validateWikiCvUrl(value: string): URL {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error('Chỉ hỗ trợ link chương truyện từ WikiCV.'); }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) throw new Error('Chỉ hỗ trợ link chương truyện từ WikiCV.');
  if (!/^\/truyen\/[^/]+\/chuong(?:-[^/]+)+/i.test(parsed.pathname)) throw new Error('Vui lòng nhập link chương truyện WikiCV hợp lệ.');
  parsed.hash = '';
  return parsed;
}

export function isAllowedWikiCvUrl(value: string): boolean {
  try { validateWikiCvUrl(value); return true; } catch { return false; }
}

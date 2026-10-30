export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

const previewCache = new Map<string, { preview: LinkPreviewData | null; cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000;

export function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  // Match standard http or https URLs
  const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?!]/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

export function isPrivateOrBlockedHost(hostname: string): boolean {
  if (!hostname) return true;
  const host = hostname.toLowerCase();

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan')
  ) {
    return true;
  }

  // IPv4 private ranges
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = host.match(ipv4Regex);
  if (ipMatch) {
    const octet1 = parseInt(ipMatch[1], 10);
    const octet2 = parseInt(ipMatch[2], 10);

    // 10.0.0.0 - 10.255.255.255
    if (octet1 === 10) return true;
    // 172.16.0.0 - 172.31.255.255
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (octet1 === 192 && octet2 === 168) return true;
    // 169.254.0.0 - 169.254.255.255 (link-local)
    if (octet1 === 169 && octet2 === 254) return true;
  }

  return false;
}

function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewData | null> {
  if (!rawUrl) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return null;
  }

  if (isPrivateOrBlockedHost(parsedUrl.hostname)) {
    return null;
  }

  const normalizedUrl = parsedUrl.href;
  const now = Date.now();

  const cached = previewCache.get(normalizedUrl);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.preview;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      previewCache.set(normalizedUrl, { preview: null, cachedAt: now });
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      previewCache.set(normalizedUrl, { preview: null, cachedAt: now });
      return null;
    }

    // Read initial 120KB for head meta tags
    const reader = response.body?.getReader();
    let htmlChunk = '';
    const maxBytes = 120 * 1024;
    let bytesRead = 0;

    if (reader) {
      const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
      while (bytesRead < maxBytes) {
        const { value, done } = await reader.read();
        if (done || !value) break;
        bytesRead += value.length;
        htmlChunk += decoder.decode(value, { stream: true });
        if (htmlChunk.includes('</head>')) break;
      }
      try {
        await reader.cancel();
      } catch {}
    } else {
      htmlChunk = await response.text();
    }

    const metaTagsMap: Record<string, string> = {};
    const metaTagRegex = /<meta\s+([^>]+)>/gi;
    let match: RegExpExecArray | null;

    while ((match = metaTagRegex.exec(htmlChunk)) !== null) {
      const tagContent = match[1];
      const keyMatch = tagContent.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i);
      const valMatch = tagContent.match(/content\s*=\s*["']([^"']*)["']/i);
      if (keyMatch && valMatch) {
        metaTagsMap[keyMatch[1].toLowerCase()] = decodeHTMLEntities(valMatch[1]);
      }
    }

    // Title resolution
    let title = metaTagsMap['og:title'] || metaTagsMap['twitter:title'] || metaTagsMap['title'];

    if (!title) {
      const titleTagMatch = htmlChunk.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTagMatch) {
        title = decodeHTMLEntities(titleTagMatch[1]);
      }
    }

    // Description resolution
    const description = metaTagsMap['og:description'] || metaTagsMap['twitter:description'] || metaTagsMap['description'];

    // Image resolution
    let image = metaTagsMap['og:image:secure_url'] || metaTagsMap['og:image'] || metaTagsMap['twitter:image:src'] || metaTagsMap['twitter:image'];

    if (image) {
      try {
        image = new URL(image, normalizedUrl).href;
      } catch {
        image = undefined;
      }
    }

    // Site name resolution
    const siteName = metaTagsMap['og:site_name'] || metaTagsMap['twitter:site'] || parsedUrl.hostname.replace(/^www\./i, '');

    if (!title && !description) {
      previewCache.set(normalizedUrl, { preview: null, cachedAt: now });
      return null;
    }

    const preview: LinkPreviewData = {
      url: normalizedUrl,
      title: title ? title.substring(0, 200) : undefined,
      description: description ? description.substring(0, 300) : undefined,
      image,
      siteName,
    };

    if (previewCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = previewCache.keys().next().value;
      if (oldestKey) previewCache.delete(oldestKey);
    }
    previewCache.set(normalizedUrl, { preview, cachedAt: now });

    return preview;
  } catch {
    previewCache.set(normalizedUrl, { preview: null, cachedAt: now });
    return null;
  }
}

const SEARCH_ENGINE = 'https://search.brave.com/search?q=';

export function normalizeBrowserInput(input: string): {
  url: string;
  isSearch: boolean;
  display: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      url: 'https://www.wikipedia.org',
      isSearch: false,
      display: 'https://www.wikipedia.org',
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      return { url: u.href, isSearch: false, display: u.href };
    } catch {
      return {
        url: `${SEARCH_ENGINE}${encodeURIComponent(trimmed)}`,
        isSearch: true,
        display: `Search: ${trimmed}`,
      };
    }
  }

  if (
    trimmed.includes('.') &&
    !trimmed.includes(' ') &&
    /^[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9]$/.test(trimmed.split('/')[0])
  ) {
    const url = `https://${trimmed}`;
    return { url, isSearch: false, display: url };
  }

  return {
    url: `${SEARCH_ENGINE}${encodeURIComponent(trimmed)}`,
    isSearch: true,
    display: `Search: ${trimmed}`,
  };
}

export function toBrowseFrameUrl(targetUrl: string, useProxy: boolean): string {
  if (!useProxy) return targetUrl;
  return `/api/browse?url=${encodeURIComponent(targetUrl)}`;
}

export function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

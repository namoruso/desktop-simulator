'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Search,
  ExternalLink,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import {
  normalizeBrowserInput,
  toBrowseFrameUrl,
  isAllowedUrl,
} from '@/lib/browserUrl';
import { AppShell, AppToolbar, ToolbarButton } from '@/components/ui/AppShell';

const HOME = 'https://www.wikipedia.org';
const LOAD_TIMEOUT_MS = 12000;

type BlockReason = 'timeout' | 'embed' | 'proxy-failed' | null;

export function Browser() {
  const [input, setInput] = useState(HOME);
  const [frameUrl, setFrameUrl] = useState(HOME);
  const [displayUrl, setDisplayUrl] = useState(HOME);
  const [useProxy, setUseProxy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockReason, setBlockReason] = useState<BlockReason>(null);
  const [history, setHistory] = useState<string[]>([HOME]);
  const [idx, setIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout>>();

  const clearLoadTimer = () => {
    if (loadTimer.current) clearTimeout(loadTimer.current);
  };

  const navigate = useCallback(
    (raw: string, forceProxy?: boolean) => {
      const { url, display } = normalizeBrowserInput(raw);
      if (!isAllowedUrl(url)) return;

      clearLoadTimer();
      setLoading(true);
      setBlockReason(null);
      setDisplayUrl(display);
      setInput(url);
      const proxy = forceProxy ?? useProxy;
      setFrameUrl(toBrowseFrameUrl(url, proxy));

      const nextHist = [...history.slice(0, idx + 1), url];
      setHistory(nextHist);
      setIdx(nextHist.length - 1);

      loadTimer.current = setTimeout(() => {
        setLoading(false);
        setBlockReason((prev) => prev ?? 'timeout');
      }, LOAD_TIMEOUT_MS);
    },
    [history, idx, useProxy]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url;
      if (url) navigate(url);
    };
    window.addEventListener('webos-browser-navigate', handler);
    return () => {
      window.removeEventListener('webos-browser-navigate', handler);
      clearLoadTimer();
    };
  }, [navigate]);

  const onLoad = () => {
    clearLoadTimer();
    setLoading(false);
  };

  const tryProxyFallback = () => {
    if (!useProxy) {
      setUseProxy(true);
      navigate(input, true);
    } else {
      setBlockReason('proxy-failed');
      setLoading(false);
    }
  };

  const back = () => {
    if (idx > 0) {
      const i = idx - 1;
      setIdx(i);
      navigate(history[i]);
    }
  };

  const forward = () => {
    if (idx < history.length - 1) {
      const i = idx + 1;
      setIdx(i);
      navigate(history[i]);
    }
  };

  const openExternal = () => {
    const { url } = normalizeBrowserInput(input);
    if (isAllowedUrl(url)) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppShell>
      <AppToolbar>
        <ToolbarButton onClick={back} title="Back" disabled={idx === 0}>
          <ArrowLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={forward}
          title="Forward"
          disabled={idx >= history.length - 1}
        >
          <ArrowRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => iframeRef.current?.contentWindow?.location.reload()}
          title="Reload"
        >
          <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
        </ToolbarButton>
        <ToolbarButton onClick={() => navigate(HOME)} title="Home">
          <Home size={16} />
        </ToolbarButton>

        <div className="relative flex flex-1 items-center">
          <Search size={14} className="absolute left-2.5 text-[var(--text-muted)]" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(input)}
            placeholder="Search the web or enter URL…"
            className="mac-field flex-1 py-2 pl-8 pr-3 text-[12px]"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate(input)}
          className="mac-btn mac-btn-primary px-4 py-2 text-[12px]"
        >
          Go
        </button>
        <ToolbarButton onClick={openExternal} title="Open in system browser">
          <ExternalLink size={16} />
        </ToolbarButton>
      </AppToolbar>

      <div className="flex items-center gap-2 border-b border-[var(--separator)] px-3 py-1 text-[10px] text-[var(--text-muted)]">
        <span className="flex-1 truncate">{displayUrl}</span>
        <button
          type="button"
          onClick={() => {
            const next = !useProxy;
            setUseProxy(next);
            navigate(input, next);
          }}
          className={`flex items-center gap-1 rounded px-2 py-0.5 ${
            useProxy ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'hover:bg-white/5'
          }`}
        >
          <Shield size={10} />
          {useProxy ? 'Proxy on' : 'Proxy off'}
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        {loading && !blockReason && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[var(--app-bg-elevated)] backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="text-xs text-[var(--text-muted)]">Loading page…</p>
          </div>
        )}

        {blockReason && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[var(--app-bg)] p-6 text-center">
            <AlertTriangle size={32} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {blockReason === 'timeout' && 'This page is taking too long to load'}
                {blockReason === 'proxy-failed' && 'Could not load via proxy either'}
                {blockReason === 'embed' && 'This site blocks embedded browsing'}
              </p>
              <p className="mt-2 max-w-md text-xs text-[var(--text-muted)]">
                Many websites block iframes (X-Frame-Options). Try enabling the
                proxy, or open the page in your system browser.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {!useProxy && (
                <button
                  type="button"
                  onClick={tryProxyFallback}
                  className="mac-btn mac-btn-primary px-4 py-2 text-[12px]"
                >
                  Try proxy mode
                </button>
              )}
              <button
                type="button"
                onClick={openExternal}
                className="mac-btn mac-btn-default px-4 py-2 text-[12px]"
              >
                Open externally
              </button>
              <button
                type="button"
                onClick={() => {
                  setBlockReason(null);
                  navigate(input);
                }}
                className="mac-btn mac-btn-default px-4 py-2 text-[12px]"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title="Web Browser"
          src={frameUrl}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={onLoad}
        />
      </div>
    </AppShell>
  );
}


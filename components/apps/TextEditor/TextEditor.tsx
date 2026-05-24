'use client';

import { useEffect, useState } from 'react';
import { persistence } from '@/hooks/usePersistence';

export function TextEditor() {
  const [filename, setFilename] = useState('untitled.txt');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    persistence.loadEditorFile(filename).then(setContent);
  }, [filename]);

  const save = async () => {
    await persistence.saveEditorFile(filename, content);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-2 py-1 text-xs">
        <input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="rounded border border-white/10 bg-black/30 px-2 py-1 font-mono"
        />
        <button
          type="button"
          onClick={save}
          className="rounded bg-[var(--accent)] px-3 py-1 text-white"
        >
          Save
        </button>
        {status && <span className="text-green-400">{status}</span>}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 resize-none bg-transparent p-3 font-mono text-sm text-slate-200 outline-none"
        spellCheck={false}
      />
    </div>
  );
}

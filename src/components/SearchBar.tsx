import { useEffect, useRef, useState } from 'react';

export function SearchBar({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  // Debounce input so each keystroke doesn't fire an RPC.
  const [local, setLocal] = useState(value);
  // The last value reported via onChange (or received from outside).
  const reported = useRef(value);

  // Take in values set from outside (Back/Forward, switching sections). The echo of our
  // own report is ignored: it can arrive after the user typed on (URL updates render
  // asynchronously), and adopting it would drop those keystrokes.
  useEffect(() => {
    if (value !== reported.current) {
      reported.current = value;
      setLocal(value);
    }
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== reported.current) {
        reported.current = local;
        onChange(local);
      }
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className="relative w-full">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
      </svg>
      <input
        type="search"
        value={local}
        // Search-first screens focus the box on arrival (long-standing behaviour). Revisit in
        // the accessibility pass: it moves screen-reader focus past the page heading.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}

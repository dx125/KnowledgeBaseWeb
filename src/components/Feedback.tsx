import { t } from '../i18n';

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
      {label}
    </div>
  );
}

export function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-lg font-medium text-slate-700">{t(locale, 'noResults')}</p>
      <p className="mt-1 text-sm text-slate-500">{t(locale, 'noResultsHint')}</p>
    </div>
  );
}

export function ErrorBox({ locale, message }: { locale: string; message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <strong>{t(locale, 'errorTitle')}:</strong> {message}
    </div>
  );
}

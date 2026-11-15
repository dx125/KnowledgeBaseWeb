import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Small fixed label so a mock build is never mistaken for the real backend.
function MockBadge() {
  return (
    <div
      style={{
        position: 'fixed', bottom: 8, left: 8, zIndex: 9999, padding: '2px 8px',
        borderRadius: 4, fontSize: 11, background: '#f59e0b', color: '#000',
        pointerEvents: 'none', opacity: 0.9,
      }}
    >
      MOCK DATA
    </div>
  );
}

// Mock mode (`npm run dev:mock` / `npm run build:mock`, values in .env.mock): MSW serves the
// KB API and Supabase Auth from synthetic fixtures in src/mocks. VITE_MOCK_API is unset in
// every other mode, so this is a no-op there and the mocks are not part of the build.
async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_MOCK_API !== '1') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'warn' });
}

// App is imported only after mocking is ready: importing it creates the Supabase auth
// client, which may refresh a stored session right away — that request must reach the mock.
enableMocking()
  .then(() => import('./App'))
  .then(({ default: App }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
        {import.meta.env.VITE_MOCK_API === '1' && <MockBadge />}
      </React.StrictMode>,
    );
  });

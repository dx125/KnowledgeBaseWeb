// The route table (see src/lib/paths.ts for the URL scheme).
//
// Screens are loaded lazily: each is its own chunk, fetched when its route is first
// matched. The shell (guards, layout, error fallback) ships with the app, and so do the
// libraries every screen needs. `HydrateFallback` shows while the first screen loads.
import type { RouteObject } from 'react-router';
import { AppLayout, type RouteHandle } from './AppLayout';
import { BootSpinner, LangRoute, RootLayout, RootRedirect, SessionGate } from './guards';
import { RouteError } from './RouteError';

const kbHome: RouteHandle = { mode: 'kb', sectionHome: true };
const kb: RouteHandle = { mode: 'kb' };
const faqHome: RouteHandle = { mode: 'faq', sectionHome: true };
const faq: RouteHandle = { mode: 'faq' };

const home = () => import('../routes/HomeRoute').then((m) => ({ Component: m.HomeRoute }));
const topic = () => import('../routes/TopicRoute').then((m) => ({ Component: m.TopicRoute }));
const notFound = () => import('../routes/NotFoundRoute').then((m) => ({ Component: m.NotFoundRoute }));

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    HydrateFallback: BootSpinner,
    children: [
      { index: true, element: <RootRedirect /> },
      {
        path: ':lang',
        element: <LangRoute />,
        children: [
          {
            element: <SessionGate />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  { index: true, handle: kbHome, lazy: home },
                  { path: 'topics/:topicSlug', handle: kb, lazy: topic },
                  { path: 'faq', handle: faqHome, lazy: home },
                  { path: 'faq/topics/:topicSlug', handle: faq, lazy: topic },
                  { path: '*', lazy: notFound },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

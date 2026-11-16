import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { PreferencesProvider } from './app/preferences';
import { routes } from './app/routes';
import { createQueryClient } from './data/queryClient';

export type AppRouter = ReturnType<typeof createBrowserRouter>;

/** The browser router over the app's route table; starts at the current window.location. */
export const createAppRouter = (): AppRouter => createBrowserRouter(routes);

/** The whole app: data cache → auth session → in-memory preferences → routes. */
export default function App({ router }: { router: AppRouter }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <RouterProvider router={router} />
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Supabase Auth session, shared through context.
//
// Every cached API response belongs to the user who fetched it, so the react-query cache is
// cleared whenever the signed-in user changes (sign-out, or a different account). It
// happens in the auth callback, before React renders as the new user, so nothing fetched
// for one user — e.g. internal cards — can be shown to the next.
import { useQueryClient } from '@tanstack/react-query';
import type { Session, User } from '@supabase/auth-js';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authClient } from '../lib/auth';

type AuthResult = Promise<{ error: { message: string } | null }>;

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** True until the stored session (if any) has been read. */
  loading: boolean;
  signIn: (email: string, password: string) => AuthResult;
  signUp: (email: string, password: string) => AuthResult;
  signOut: () => Promise<unknown>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const apply = (next: Session | null) => {
      const nextUserId = next?.user.id ?? null;
      if (nextUserId !== userIdRef.current) {
        userIdRef.current = nextUserId;
        void queryClient.cancelQueries();
        queryClient.clear();
      }
      setSession(next);
    };
    authClient.getSession().then(({ data }) => {
      if (!active) return;
      apply(data.session);
      setLoading(false);
    });
    const { data: sub } = authClient.onAuthStateChange((_event, next) => {
      if (active) apply(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn: (email, password) => authClient.signInWithPassword({ email, password }),
      signUp: (email, password) => authClient.signUp({ email, password }),
      signOut: () => authClient.signOut(),
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

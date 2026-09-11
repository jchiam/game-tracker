import { useState, useEffect } from 'react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { addToast } from '@/utils/toast';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setIsAuthLoading(false);
      })
      .catch((e) => {
        // Settle as signed-out rather than loading forever; the auth-state
        // subscription below still signs the user in if a later refresh succeeds.
        console.error(e);
        setSession(null);
        setIsAuthLoading(false);
        addToast("Couldn't check your sign-in. Please reload.", 'error');
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = (redirectTo?: string) =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo ? `${window.location.origin}${redirectTo}` : window.location.origin,
      },
    });

  const signOut = () => supabase.auth.signOut();

  return { session, isAuthLoading, signInWithGoogle, signOut };
}

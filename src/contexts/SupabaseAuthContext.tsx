import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthResult {
  error: Error | null;
}

interface SignInResult extends AuthResult {
  profile: Profile | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, options?: { full_name?: string }) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const withTimeout = async <T,>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentUser: User): Promise<Profile | null> => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle(),
        15000,
        'Loading profile timed out.',
      );

      if (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
        return null;
      }

      const loadedProfile = (data as Profile | null) ?? null;
      setProfile(loadedProfile);
      return loadedProfile;
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session: initialSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          15000,
          'Loading session timed out.',
        );

        if (!mounted) {
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await loadProfile(initialSession.user);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setLoading(true);
        void loadProfile(nextSession.user).finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
        'Sign in timed out. Please try again.',
      );

      if (error || !data.user) {
        return { error: error ?? new Error('Sign in failed.'), profile: null };
      }

      setSession(data.session);
      setUser(data.user);
      const loadedProfile = await loadProfile(data.user);
      return { error: null, profile: loadedProfile };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Sign in failed.'),
        profile: null,
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    options?: { full_name?: string },
  ): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: options?.full_name,
            },
          },
        }),
        15000,
        'Sign up timed out. Please try again.',
      );
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Sign up failed.'),
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.signOut(),
        10000,
        'Sign out timed out. Please try again.',
      );
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Sign out failed.'),
      };
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, options?: { full_name?: string }) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(
          session.user.id,
          session.user.email ?? '',
          (session.user.user_metadata?.full_name as string | undefined) ?? '',
        )
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Keep auth callback non-blocking to avoid deadlocks in sign-in flows.
        void loadProfile(
          session.user.id,
          session.user.email ?? '',
          (session.user.user_metadata?.full_name as string | undefined) ?? '',
        )
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string, email = '', fullName = '') => {
    try {
      const { data: profile, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        15000,
        'Loading profile timed out.',
      )

      if (error && error.code === 'PGRST116') {
        const { data: createdProfile, error: createError } = await withTimeout(
          supabase
            .from('profiles')
            .insert({
              user_id: userId,
              email,
              full_name: fullName,
              role: 'user',
            })
            .select('*')
            .single(),
          15000,
          'Creating profile timed out.',
        )

        if (createError) {
          console.error('Error creating profile:', createError)
          setProfile(null)
        } else {
          setProfile(createdProfile)
        }
      } else if (error) {
        console.error('Error loading profile:', error)
      } else {
        setProfile(profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      return await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        15000,
        'Sign in timed out. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, options?: { full_name?: string }) => {
    setLoading(true)
    try {
      return await withTimeout(
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
      )
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      return await withTimeout(
        supabase.auth.signOut(),
        10000,
        'Sign out timed out. Please try again.',
      )
    } finally {
      setProfile(null)
      setLoading(false)
    }
  }

  const isAdmin = profile?.role === 'admin'

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

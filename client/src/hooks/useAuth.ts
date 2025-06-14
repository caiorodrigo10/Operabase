import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, type SupabaseUser, type AuthSession } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error?: any }>;
  updateProfile: (updates: any) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  signUp: async () => ({}),
  updateProfile: async () => ({})
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Set a timeout to ensure loading doesn't hang forever
    timeoutId = setTimeout(() => {
      console.log('⏰ Auth timeout - stopping loading state');
      setLoading(false);
    }, 5000); // 5 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId); // Clear timeout on successful response
        
        if (error) {
          console.error('❌ Session error:', error);
          setLoading(false);
          return;
        }

        console.log('📊 Session:', session ? 'Found' : 'Not found');
        
        if (session?.user) {
          console.log('👤 User found, getting profile...');
          try {
            // Get profile data with timeout
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            );

            const { data: profile, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;

            if (profileError) {
              console.error('❌ Profile error:', profileError);
              // Still set user even if profile fetch fails
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email,
                role: 'user'
              });
            } else {
              console.log('📋 Profile:', profile);
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: profile?.name || session.user.email,
                role: profile?.role || 'user'
              });
            }
            setSession(session);
          } catch (error) {
            console.error('❌ Profile fetch failed:', error);
            // Fallback to basic user data
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.email,
              role: 'user'
            });
            setSession(session);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session ? 'Session exists' : 'No session');
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              // Get profile data
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.error('❌ Profile fetch error:', profileError);
                // Fallback to basic user data
                setUser({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.email,
                  role: 'user'
                });
              } else {
                setUser({
                  id: session.user.id,
                  email: session.user.email!,
                  name: profile?.name || session.user.email,
                  role: profile?.role || 'user'
                });
              }
              setSession(session);
            } catch (error) {
              console.error('❌ Auth state profile error:', error);
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email,
                role: 'user'
              });
              setSession(session);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
          }
          setLoading(false);
        } catch (error) {
          console.error('❌ Auth state change error:', error);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { error };

      // Profile will be loaded by the auth state change listener
      return { data };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) return { error };

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      return {};
    } catch (error) {
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
    updateProfile
  };
};

export { AuthContext };
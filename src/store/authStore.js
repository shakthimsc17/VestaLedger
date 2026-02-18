import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    initialize: async () => {
        if (get().initialized) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                set({ user: session.user, loading: false, initialized: true });
                get().fetchProfile(session.user.id);
            } else {
                set({ user: null, loading: false, initialized: true });
            }

            supabase.auth.onAuthStateChange(async (event, session) => {
                if (session?.user) {
                    set({ user: session.user });
                    get().fetchProfile(session.user.id);
                } else {
                    set({ user: null, profile: null });
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ loading: false, initialized: true });
        }
    },

    fetchProfile: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data) {
                set({ profile: data });
            } else if (!data) {
                // Create profile if it doesn't exist
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({ id: userId })
                    .select()
                    .maybeSingle();

                if (!createError && newProfile) {
                    set({ profile: newProfile });
                }
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
        }
    },

    signUp: async (email, password, displayName) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: displayName }
                }
            });
            if (error) throw error;
            set({ user: data.user, loading: false, initialized: true });
            if (data.user) get().fetchProfile(data.user.id);
            return { data, error: null };
        } catch (error) {
            set({ loading: false });
            return { data: null, error };
        }
    },

    signIn: async (email, password) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            set({ user: data.user, loading: false, initialized: true });
            if (data.user) get().fetchProfile(data.user.id);
            return { data, error: null };
        } catch (error) {
            set({ loading: false });
            return { data: null, error };
        }
    },

    signInWithGoogle: async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
    },

    resetPassword: async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    }
}));

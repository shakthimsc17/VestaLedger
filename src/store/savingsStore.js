import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

export const useSavingsStore = create((set, get) => ({
    savings: [],
    contributions: [],
    loading: false,

    fetchSavings: async () => {
        set({ loading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Auth session missing");

            const { data, error } = await supabase
                .from('savings')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            set({ savings: data || [], loading: false });
        } catch (error) {
            console.error('Fetch savings error:', error);
            set({ loading: false });
        }
    },

    fetchContributions: async () => {
        set({ loading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Auth session missing");

            const { data, error } = await supabase
                .from('savings_contributions')
                .select('*, savings(name)')
                .eq('user_id', session.user.id)
                .order('contribution_date', { ascending: false });
            if (error) throw error;
            set({ contributions: data || [], loading: false });
        } catch (error) {
            console.error('Fetch contributions error:', error);
            set({ loading: false });
        }
    },

    addSavings: async (saving) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: { message: "Auth session missing" } };

            const { data, error } = await supabase
                .from('savings')
                .insert(saving)
                .select()
                .single();
            if (error) {
                console.error("addSavings Supabase error:", error);
                throw error;
            }
            set(state => ({ savings: [data, ...state.savings] }));
            return { data, error: null };
        } catch (error) {
            console.error("addSavings unexpected error:", error);
            return { data: null, error };
        }
    },

    updateSavings: async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('savings')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error("updateSavings Supabase error:", error);
                throw error;
            }
            set(state => ({
                savings: state.savings.map(s => s.id === id ? data : s)
            }));
            return { data, error: null };
        } catch (error) {
            console.error("updateSavings unexpected error:", error);
            return { data: null, error };
        }
    },

    deleteSavings: async (id) => {
        try {
            const { error } = await supabase
                .from('savings')
                .delete()
                .eq('id', id);
            if (error) throw error;
            set(state => ({
                savings: state.savings.filter(s => s.id !== id)
            }));
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    recordContribution: async (id, userId) => {
        const { savings } = get();
        const saving = savings.find(s => s.id === id);
        if (!saving || !saving.recurring_contribution) return { error: { message: "Saving not found or no monthly contribution set" } };

        const amount = parseFloat(saving.recurring_contribution);
        const newTotal = parseFloat(saving.current_amount) + amount;

        const updates = { current_amount: newTotal };
        if (saving.next_contribution_date) {
            updates.next_contribution_date = dayjs(saving.next_contribution_date).add(1, 'month').format('YYYY-MM-DD');
        }

        try {
            // 1. Record the contribution in savings_contributions
            const { error: contributionError } = await supabase
                .from('savings_contributions')
                .insert({
                    saving_id: id,
                    user_id: userId,
                    amount: amount,
                    contribution_date: dayjs().format('YYYY-MM-DD')
                });
            if (contributionError) {
                console.error("recordContribution Supabase error (insert):", contributionError);
                throw contributionError;
            }

            // 2. Update the savings balance
            const { data, error } = await supabase
                .from('savings')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error("recordContribution Supabase error (update):", error);
                throw error;
            }

            set(state => ({
                savings: state.savings.map(s => s.id === id ? data : s)
            }));

            // Refresh contributions list
            get().fetchContributions();

            return { data, error: null };
        } catch (error) {
            console.error("recordContribution unexpected error:", error);
            return { data: null, error };
        }
    },

    getSavingsSummary: () => {
        const { savings } = get();
        const totalSavings = savings.reduce((sum, s) => sum + parseFloat(s.current_amount || 0), 0);
        const monthlyContribution = savings.reduce((sum, s) => sum + parseFloat(s.recurring_contribution || 0), 0);
        return { totalSavings, monthlyContribution, savingsCount: savings.length };
    }
}));

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

export const useLoanStore = create((set, get) => ({
    loans: [],
    payments: [],
    loading: false,

    fetchLoans: async () => {
        set({ loading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Auth session missing");

            const { data, error } = await supabase
                .from('loans')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            set({ loans: data || [], loading: false });
        } catch (error) {
            console.error('Fetch loans error:', error);
            set({ loading: false });
        }
    },

    fetchPayments: async () => {
        set({ loading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Auth session missing");

            const { data, error } = await supabase
                .from('loan_payments')
                .select('*, loans(name)')
                .eq('user_id', session.user.id)
                .order('payment_date', { ascending: false });
            if (error) throw error;
            set({ payments: data || [], loading: false });
        } catch (error) {
            console.error('Fetch payments error:', JSON.stringify(error, null, 2));
            set({ loading: false });
        }
    },

    addLoan: async (loan) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: { message: "Auth session missing" } };

            const { data, error } = await supabase
                .from('loans')
                .insert({ ...loan, status: 'active' })
                .select()
                .single();
            if (error) {
                console.error("addLoan Supabase error:", error);
                throw error;
            }
            set(state => ({ loans: [data, ...state.loans] }));
            return { data, error: null };
        } catch (error) {
            console.error("addLoan unexpected error:", error);
            return { data: null, error };
        }
    },

    updateLoan: async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('loans')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error("updateLoan Supabase error:", error);
                throw error;
            }
            set(state => ({
                loans: state.loans.map(l => l.id === id ? data : l)
            }));
            return { data, error: null };
        } catch (error) {
            console.error("updateLoan unexpected error:", error);
            return { data: null, error };
        }
    },

    deleteLoan: async (id) => {
        try {
            const { error } = await supabase
                .from('loans')
                .delete()
                .eq('id', id);
            if (error) throw error;
            set(state => ({
                loans: state.loans.filter(l => l.id !== id)
            }));
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    makePayment: async (id, userId) => {
        const { loans } = get();
        const loan = loans.find(l => l.id === id);
        if (!loan || !loan.recurring_payment) return { error: { message: "Loan not found or no EMI set" } };

        const paymentAmount = parseFloat(loan.recurring_payment);
        const newTotal = Math.max(0, parseFloat(loan.total_amount) - paymentAmount);
        const updates = { total_amount: newTotal };

        // If loan is paid off, mark as closed
        if (newTotal === 0) {
            updates.status = 'closed';
        }

        // Update next due date if exists
        if (loan.next_due_date) {
            updates.next_due_date = dayjs(loan.next_due_date).add(1, 'month').format('YYYY-MM-DD');
        }

        try {
            // 1. Record the payment in loan_payments
            const { error: paymentError } = await supabase
                .from('loan_payments')
                .insert({
                    loan_id: id,
                    user_id: userId,
                    amount: paymentAmount,
                    payment_date: dayjs().format('YYYY-MM-DD')
                });
            if (paymentError) {
                console.error("makePayment Supabase error (insert):", paymentError);
                throw paymentError;
            }

            // 2. Update the loan balance
            const { data, error } = await supabase
                .from('loans')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error("makePayment Supabase error (update):", error);
                throw error;
            }

            set(state => ({
                loans: state.loans.map(l => l.id === id ? data : l)
            }));

            // Refresh payments list
            get().fetchPayments();

            return { data, error: null };
        } catch (error) {
            console.error("makePayment unexpected error:", error);
            return { data: null, error };
        }
    },

    getLoanSummary: () => {
        const { loans } = get();
        const activeLoans = loans.filter(l => l.status !== 'closed');
        const totalDebt = activeLoans.reduce((sum, l) => sum + parseFloat(l.total_amount || 0), 0);
        const monthlyInstallment = activeLoans.reduce((sum, l) => sum + parseFloat(l.recurring_payment || 0), 0);
        return { totalDebt, monthlyInstallment, activeLoansCount: activeLoans.length };
    }
}));

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import dayjs from 'dayjs';

export const useExpenseStore = create((set, get) => ({
    expenses: [],
    categories: [],
    budgets: [],
    recurringExpenses: [],
    loading: false,
    filters: {
        category: 'all',
        dateRange: 'month',
        startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
        endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
        search: ''
    },

    // Categories
    fetchCategories: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let query = supabase.from('categories').select('*');

            if (session) {
                // Show default categories OR user specific ones
                query = query.or(`user_id.is.null,user_id.eq.${session.user.id}`);
            } else {
                query = query.is('user_id', null);
            }

            const { data, error } = await query
                .order('is_default', { ascending: false })
                .order('name');

            if (error) throw error;
            set({ categories: data || [] });
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    },

    addCategory: async (name, emoji, userId) => {
        try {
            console.log("Adding category:", { name, emoji, userId });
            const { data: { session } } = await supabase.auth.getSession();
            console.log("Current session user:", session?.user?.id);

            const { data, error } = await supabase
                .from('categories')
                .insert({ name, emoji, user_id: userId })
                .select()
                .single();
            if (error) throw error;
            set(state => ({ categories: [...state.categories, data] }));
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    updateCategory: async (id, name, emoji) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update({ name, emoji })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            set(state => ({
                categories: state.categories.map(c => c.id === id ? data : c)
            }));
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    deleteCategory: async (categoryId) => {
        try {
            // Delete related budgets
            await supabase.from('budgets').delete().eq('category_id', categoryId);

            // Delete related recurring expenses
            await supabase.from('recurring_expenses').delete().eq('category_id', categoryId);

            // Delete related expenses
            await supabase.from('expenses').delete().eq('category_id', categoryId);

            // Finally delete category
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;

            set(state => ({
                categories: state.categories.filter(c => c.id !== categoryId),
                expenses: state.expenses.filter(e => e.category_id !== categoryId),
                budgets: state.budgets.filter(b => b.category_id !== categoryId),
                recurringExpenses: state.recurringExpenses.filter(r => r.category_id !== categoryId)
            }));

            return { error: null };
        } catch (error) {
            console.error('Delete category error:', error);
            return { error };
        }
    },

    checkCategoryUsage: async (categoryId) => {
        try {
            const { count: expenseCount } = await supabase
                .from('expenses')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', categoryId);

            const { count: recurringCount } = await supabase
                .from('recurring_expenses')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', categoryId);

            return {
                expenseCount: expenseCount || 0,
                recurringCount: recurringCount || 0,
                total: (expenseCount || 0) + (recurringCount || 0)
            };
        } catch (error) {
            console.error('Check category usage error:', error);
            return { expenseCount: 0, recurringCount: 0, total: 0 };
        }
    },

    // Expenses
    fetchExpenses: async () => {
        set({ loading: true });
        const { filters } = get();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Auth session missing");

            let query = supabase
                .from('expenses')
                .select('*, categories(name, emoji)')
                .eq('user_id', session.user.id)
                .gte('date', filters.startDate)
                .lte('date', filters.endDate)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (filters.category !== 'all') {
                query = query.eq('category_id', filters.category);
            }

            if (filters.search) {
                query = query.ilike('note', `%${filters.search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            set({ expenses: data || [], loading: false });
        } catch (error) {
            console.error('Fetch expenses error:', error);
            set({ loading: false });
        }
    },

    addExpense: async (expense) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: { message: "Auth session missing" } };

            const { data, error } = await supabase
                .from('expenses')
                .insert(expense)
                .select('*, categories(name, emoji)')
                .single();
            if (error) {
                console.error("Add Expense Error:", error);
                throw error;
            }
            set(state => ({ expenses: [data, ...state.expenses] }));
            return { data, error: null };
        } catch (error) {
            console.error("addExpense unexpected error:", error);
            return { data: null, error };
        }
    },

    updateExpense: async (id, updates) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: { message: "Auth session missing" } };

            const { data, error } = await supabase
                .from('expenses')
                .update(updates)
                .eq('id', id)
                .select('*, categories(name, emoji)')
                .single();
            if (error) {
                console.error("Update Expense Error:", error);
                throw error;
            }
            set(state => ({
                expenses: state.expenses.map(e => e.id === id ? data : e)
            }));
            return { data, error: null };
        } catch (error) {
            console.error("updateExpense unexpected error:", error);
            return { data: null, error };
        }
    },

    deleteExpense: async (id) => {
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);
            if (error) throw error;
            set(state => ({
                expenses: state.expenses.filter(e => e.id !== id)
            }));
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    // Budgets
    fetchBudgets: async (month) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const monthStr = month || dayjs().startOf('month').format('YYYY-MM-DD');
            const { data, error } = await supabase
                .from('budgets')
                .select('*, categories(name, emoji)')
                .eq('month', monthStr)
                .eq('user_id', session.user.id);
            if (error) throw error;
            set({ budgets: data || [] });
        } catch (error) {
            console.error('Fetch budgets error:', error);
        }
    },

    setBudget: async (categoryId, amount, month, userId) => {
        const monthStr = month || dayjs().startOf('month').format('YYYY-MM-DD');
        try {
            console.log("Setting budget:", { categoryId, amount, monthStr, userId });
            const { data, error } = await supabase
                .from('budgets')
                .upsert(
                    { category_id: categoryId, amount, month: monthStr, user_id: userId },
                    { onConflict: 'user_id,category_id,month' }
                )
                .select('*, categories(name, emoji)')
                .single();

            if (error) {
                console.error("Supabase Budget Error:", error);
                throw error;
            }

            console.log("Budget set successfully:", data);
            set(state => ({
                budgets: state.budgets.some(b => b.id === data.id)
                    ? state.budgets.map(b => b.id === data.id ? data : b)
                    : [...state.budgets, data]
            }));
            return { data, error: null };
        } catch (error) {
            console.error('setBudget unexpected error:', error);
            return { data: null, error };
        }
    },

    // Recurring Expenses
    fetchRecurringExpenses: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('recurring_expenses')
                .select('*, categories(name, emoji)')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            set({ recurringExpenses: data || [] });
        } catch (error) {
            console.error('Fetch recurring expenses error:', error);
        }
    },

    addRecurringExpense: async (recurring) => {
        try {
            console.log("Adding recurring expense:", recurring);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { error: { message: "Auth session missing. Please re-login." } };
            }

            const { data, error } = await supabase
                .from('recurring_expenses')
                .insert(recurring)
                .select('*, categories(name, emoji)')
                .single();

            if (error) {
                console.error("Supabase Recurring Error:", error);
                throw error;
            }

            console.log("Recurring expense added successfully:", data);
            set(state => ({ recurringExpenses: [data, ...state.recurringExpenses] }));
            return { data, error: null };
        } catch (error) {
            console.error('addRecurringExpense unexpected error:', error);
            return { data: null, error };
        }
    },

    updateRecurringExpense: async (id, updates) => {
        try {
            console.log("Updating recurring expense:", id, updates);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { error: { message: "Auth session missing." } };
            }

            const { data, error } = await supabase
                .from('recurring_expenses')
                .update(updates)
                .eq('id', id)
                .select('*, categories(name, emoji)')
                .single();

            if (error) {
                console.error("Supabase Update Recurring Error:", error);
                throw error;
            }

            set(state => ({
                recurringExpenses: state.recurringExpenses.map(r => r.id === id ? data : r)
            }));
            return { data, error: null };
        } catch (error) {
            console.error('updateRecurringExpense unexpected error:', error);
            return { data: null, error };
        }
    },

    deleteRecurringExpense: async (id) => {
        try {
            const { error } = await supabase
                .from('recurring_expenses')
                .delete()
                .eq('id', id);
            if (error) throw error;
            set(state => ({
                recurringExpenses: state.recurringExpenses.filter(r => r.id !== id)
            }));
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    processRecurringExpense: async (id) => {
        const { recurringExpenses } = get();
        const rec = recurringExpenses.find(r => r.id === id);
        if (!rec) return { error: { message: "Recurring expense not found" } };

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: { message: "Auth session missing" } };

            // 1. Create a regular expense record
            const { error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    amount: rec.amount,
                    category_id: rec.category_id,
                    note: `Recurring: ${rec.note || ''}`,
                    date: dayjs().format('YYYY-MM-DD'),
                    user_id: session.user.id
                });
            if (expenseError) throw expenseError;

            // 2. Calculate next due date
            let nextDue = dayjs(rec.next_due);
            switch (rec.frequency) {
                case 'daily': nextDue = nextDue.add(1, 'day'); break;
                case 'weekly': nextDue = nextDue.add(7, 'day'); break;
                case 'monthly': nextDue = nextDue.add(1, 'month'); break;
                case 'yearly': nextDue = nextDue.add(1, 'year'); break;
                default: nextDue = nextDue.add(1, 'month');
            }

            // 3. Update recurring expense record
            const { data: updatedRec, error: updateError } = await supabase
                .from('recurring_expenses')
                .update({ next_due: nextDue.format('YYYY-MM-DD') })
                .eq('id', id)
                .select('*, categories(name, emoji)')
                .single();
            if (updateError) throw updateError;

            // 4. Update local state
            set(state => ({
                recurringExpenses: state.recurringExpenses.map(r => r.id === id ? updatedRec : r)
            }));

            // Refresh expenses list if filter matches
            get().fetchExpenses();

            return { data: updatedRec, error: null };
        } catch (error) {
            console.error("processRecurringExpense error:", error);
            return { data: null, error };
        }
    },

    // Filters
    setFilter: (key, value) => {
        set(state => ({
            filters: { ...state.filters, [key]: value }
        }));
    },

    setDateRange: (rangeType) => {
        const now = dayjs();
        let start, end;
        switch (rangeType) {
            case 'today':
                start = now.startOf('day');
                end = now.endOf('day');
                break;
            case 'week':
                start = now.startOf('week');
                end = now.endOf('week');
                break;
            case 'month':
                start = now.startOf('month');
                end = now.endOf('month');
                break;
            case 'year':
                start = now.startOf('year');
                end = now.endOf('year');
                break;
            default:
                start = now.startOf('month');
                end = now.endOf('month');
        }
        set(state => ({
            filters: {
                ...state.filters,
                dateRange: rangeType,
                startDate: start.format('YYYY-MM-DD'),
                endDate: end.format('YYYY-MM-DD')
            }
        }));
    },

    // Summary
    getSummary: () => {
        const { expenses } = get();
        const today = dayjs().format('YYYY-MM-DD');
        const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');

        const todayTotal = expenses
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const weekTotal = expenses
            .filter(e => e.date >= weekStart)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const monthTotal = expenses
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const categoryTotals = expenses.reduce((acc, e) => {
            const cat = e.categories?.name || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + parseFloat(e.amount);
            return acc;
        }, {});

        return { todayTotal, weekTotal, monthTotal, categoryTotals };
    },

    getComparison: async () => {
        const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('amount')
                .gte('date', lastMonthStart)
                .lte('date', lastMonthEnd);

            if (error) throw error;

            const lastMonthTotal = data.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            return { lastMonthTotal };
        } catch (error) {
            console.error('Comparison error:', error);
            return { lastMonthTotal: 0 };
        }
    }
}));

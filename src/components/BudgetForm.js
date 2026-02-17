"use client";
import { useState, useEffect } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import dayjs from "dayjs";
import toast from "react-hot-toast";

export default function BudgetForm({ category, initialAmount = "", onSuccess }) {
    const { user } = useAuthStore();
    const { setBudget } = useExpenseStore();
    const [amount, setAmount] = useState(initialAmount);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
            toast.error("Please enter a valid budget amount");
            return;
        }

        setLoading(true);
        const month = dayjs().startOf('month').format('YYYY-MM-DD');
        const { error } = await setBudget(category.id, parseFloat(amount), month, user.id);
        setLoading(false);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success(`Budget set for ${category.name}`);
            if (onSuccess) onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Setting monthly budget for <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{category.emoji} {category.name}</span>
                </p>
                <label className="input-label">Monthly Limit</label>
                <div style={{ position: 'relative' }}>
                    <span style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        fontSize: 14
                    }}>₹</span>
                    <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        style={{ paddingLeft: 34 }}
                        placeholder="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
            </div>

            <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
            >
                {loading ? "Saving..." : "Set Budget Limit"}
            </button>
        </form>
    );
}

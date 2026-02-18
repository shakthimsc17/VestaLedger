"use client";
import { useState, useEffect } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { HiOutlineCalendarDays } from "react-icons/hi2";

export default function ExpenseForm({ onSuccess, initialData = null }) {
    const { categories, fetchCategories, addExpense, updateExpense } = useExpenseStore();
    const { user } = useAuthStore();

    const [formData, setFormData] = useState({
        amount: initialData?.amount || "",
        category_id: initialData?.category_id || "",
        note: initialData?.note || "",
        date: initialData?.date || new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category_id || !formData.date) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        const expenseData = {
            ...formData,
            amount: parseFloat(formData.amount),
            user_id: user.id,
        };

        let result;
        if (initialData) {
            result = await updateExpense(initialData.id, expenseData);
        } else {
            result = await addExpense(expenseData);
        }

        setLoading(false);
        if (result.error) {
            toast.error(result.error.message);
        } else {
            toast.success(initialData ? "Expense updated!" : "Expense added!");
            setFormData({
                amount: "",
                category_id: "",
                note: "",
                date: new Date().toISOString().split('T')[0],
            });
            if (onSuccess) onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
                <label className="input-label">Amount</label>
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
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label className="input-label">Category</label>
                <select
                    className="input-field"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label className="input-label">Date</label>
                <div style={{ position: "relative" }}>
                    <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                    <input
                        type="date"
                        className="input-field"
                        style={{ paddingLeft: 36, cursor: "pointer" }}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        onClick={(e) => e.target.showPicker?.()}
                        required
                    />
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <label className="input-label">Note (Optional)</label>
                <textarea
                    className="input-field"
                    style={{ minHeight: 100, resize: 'vertical' }}
                    placeholder="What was this for?"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
            </div>

            <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
            >
                {loading ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Expense" : "Add Expense")}
            </button>
        </form>
    );
}

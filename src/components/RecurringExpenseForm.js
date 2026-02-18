"use client";
import { useState, useEffect } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { HiOutlineCalendarDays } from "react-icons/hi2";

export default function RecurringExpenseForm({ onSuccess, initialData = null }) {
    const { categories, fetchCategories, addRecurringExpense, updateRecurringExpense } = useExpenseStore();
    const { user } = useAuthStore();

    const [formData, setFormData] = useState({
        amount: initialData?.amount || "",
        category_id: initialData?.category_id || "",
        note: initialData?.note || "",
        frequency: initialData?.frequency || "monthly",
        next_due: initialData?.next_due || new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.category_id || !formData.next_due) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        const recurringData = {
            ...formData,
            amount: parseFloat(formData.amount),
            user_id: user.id,
        };

        let result;
        if (initialData) {
            result = await updateRecurringExpense(initialData.id, recurringData);
        } else {
            result = await addRecurringExpense(recurringData);
        }

        setLoading(false);
        if (result.error) {
            toast.error(result.error.message);
        } else {
            toast.success(initialData ? "Recurring expense updated!" : "Recurring expense added!");
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
                <label className="input-label">Frequency</label>
                <select
                    className="input-field"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label className="input-label">Next Due Date</label>
                <div style={{ position: "relative" }}>
                    <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                    <input
                        type="date"
                        className="input-field"
                        style={{ paddingLeft: 36, cursor: "pointer" }}
                        value={formData.next_due}
                        onChange={(e) => setFormData({ ...formData, next_due: e.target.value })}
                        onClick={(e) => e.target.showPicker?.()}
                        required
                    />
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <label className="input-label">Note (Optional)</label>
                <textarea
                    className="input-field"
                    style={{ minHeight: 80, resize: 'vertical' }}
                    placeholder="e.g. Rent, Netflix subscription..."
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
                {loading ? "Processing..." : (initialData ? "Update Recurring" : "Create Recurring")}
            </button>
        </form>
    );
}

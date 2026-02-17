"use client";
import { useEffect, useState } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import dayjs from "dayjs";
import {
    HiOutlineTrash,
    HiOutlinePencilSquare,
    HiOutlinePlus,
    HiOutlineClock,
    HiOutlineArrowPath
} from "react-icons/hi2";
import Modal from "@/components/Modal";
import RecurringExpenseForm from "@/components/RecurringExpenseForm";
import toast from "react-hot-toast";

export default function RecurringExpensesPage() {
    const { profile } = useAuthStore();
    const {
        recurringExpenses,
        fetchRecurringExpenses,
        deleteRecurringExpense
    } = useExpenseStore();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        fetchRecurringExpenses();
        setMounted(true);
    }, [fetchRecurringExpenses]);

    const currency = profile?.currency || "INR";
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
    });

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this recurring expense?")) {
            const { error } = await deleteRecurringExpense(id);
            if (error) toast.error(error.message);
            else toast.success("Recurring expense deleted");
        }
    };

    if (!mounted) return null;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Recurring Expenses</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Automated bills and subscriptions that repeat regularly
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary"
                >
                    <HiOutlinePlus size={18} />
                    Add Recurring
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20
            }}>
                {recurringExpenses.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}>
                        <div style={{ marginBottom: 12, opacity: 0.5 }}>
                            <HiOutlineArrowPath size={48} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No recurring expenses yet</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                            Set up automated logging for your rent, Netflix, gym and other periodic bills.
                        </p>
                        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary btn-sm">
                            Create your first recurring expense
                        </button>
                    </div>
                ) : (
                    recurringExpenses.map((rec) => (
                        <div key={rec.id} className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ display: 'flex', gap: 14 }}>
                                    <div style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background: 'var(--bg-input)',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 22
                                    }}>
                                        {rec.categories?.emoji || "📦"}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700 }}>{rec.note || rec.categories?.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                            <HiOutlineClock size={14} />
                                            <span style={{ textTransform: 'capitalize' }}>{rec.frequency}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-red)', fontFamily: "'JetBrains Mono', monospace" }}>
                                        {formatter.format(rec.amount)}
                                    </div>
                                    <div className="badge badge-purple" style={{ marginTop: 4 }}>Active</div>
                                </div>
                            </div>

                            <div style={{
                                padding: '12px 16px',
                                background: 'var(--bg-input)',
                                borderRadius: 10,
                                fontSize: 13,
                                marginBottom: 20
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Next Due Date</span>
                                    <span style={{ fontWeight: 600 }}>{dayjs(rec.next_due).format("DD MMM, YYYY")}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => {
                                        setEditingRecurring(rec);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ flex: 1 }}
                                >
                                    <HiOutlinePencilSquare size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(rec.id)}
                                    className="btn btn-danger btn-sm"
                                    style={{ flex: 1 }}
                                >
                                    <HiOutlineTrash size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Recurring Expense"
            >
                <RecurringExpenseForm
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        fetchRecurringExpenses();
                    }}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Recurring Expense"
            >
                <RecurringExpenseForm
                    initialData={editingRecurring}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        fetchRecurringExpenses();
                    }}
                />
            </Modal>
        </div>
    );
}

"use client";
import { useEffect, useState } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import dayjs from "dayjs";
import {
    HiOutlineTrash,
    HiOutlinePencilSquare,
    HiOutlineFunnel,
    HiOutlineMagnifyingGlass,
    HiOutlinePlusSmall
} from "react-icons/hi2";
import Modal from "@/components/Modal";
import ExpenseForm from "@/components/ExpenseForm";
import { TableRowSkeleton } from "@/components/Skeleton";
import toast from "react-hot-toast";

export default function ExpensesPage() {
    const { profile } = useAuthStore();
    const {
        expenses,
        categories,
        loading,
        filters,
        fetchExpenses,
        fetchCategories,
        setFilter,
        setDateRange,
        deleteExpense
    } = useExpenseStore();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        fetchCategories();
        setMounted(true);
    }, [fetchCategories]);

    useEffect(() => {
        if (mounted) fetchExpenses();
    }, [mounted, fetchExpenses, filters]);

    const currency = profile?.currency || "INR";
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
    });

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this expense?")) {
            const { error } = await deleteExpense(id);
            if (error) toast.error(error.message);
            else toast.success("Expense deleted");
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setIsEditModalOpen(true);
    };

    if (!mounted) return null;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Expenses</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Manage and track all your spending records
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card" style={{ padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {/* Search */}
                    <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                        <HiOutlineMagnifyingGlass
                            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                        />
                        <input
                            type="text"
                            className="input-field"
                            style={{ paddingLeft: 40 }}
                            placeholder="Search expenses..."
                            value={filters.search}
                            onChange={(e) => setFilter('search', e.target.value)}
                        />
                    </div>

                    {/* Category Filter */}
                    <div style={{ minWidth: 160 }}>
                        <select
                            className="input-field"
                            value={filters.category}
                            onChange={(e) => setFilter('category', e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Selector */}
                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                        {['today', 'week', 'month', 'year'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: filters.dateRange === range ? 'var(--bg-card)' : 'transparent',
                                    color: filters.dateRange === range ? 'var(--accent)' : 'var(--text-secondary)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Category</th>
                                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Note</th>
                                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                </>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: 60, textAlign: 'center' }}>
                                        <div style={{ marginBottom: 12, opacity: 0.5 }}>📦</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No expenses found for this period.</div>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((exp) => (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '16px 20px', fontSize: 14 }}>{dayjs(exp.date).format("DD MMM, YYYY")}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 16 }}>{exp.categories?.emoji || '📦'}</span>
                                                <span style={{ fontSize: 14 }}>{exp.categories?.name || 'Uncategorized'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--text-secondary)' }}>
                                            {exp.note || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No note</span>}
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, textAlign: 'right', color: 'var(--accent-red)', fontFamily: "'JetBrains Mono', monospace" }}>
                                            -{formatter.format(exp.amount)}
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleEdit(exp)}
                                                    className="btn btn-ghost btn-sm btn-icon"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    <HiOutlinePencilSquare size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="btn btn-ghost btn-sm btn-icon"
                                                    style={{ color: 'var(--accent-red)' }}
                                                >
                                                    <HiOutlineTrash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
        .table-row-hover:hover {
          background: rgba(255,255,255,0.01);
        }
      `}</style>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Expense"
            >
                <ExpenseForm
                    initialData={editingExpense}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        fetchExpenses();
                    }}
                />
            </Modal>
        </div>
    );
}

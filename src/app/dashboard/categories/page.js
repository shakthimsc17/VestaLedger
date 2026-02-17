"use client";
import { useEffect, useState } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import { HiOutlineTag, HiOutlinePlus, HiOutlineCurrencyDollar, HiOutlineTrash, HiOutlinePencilSquare } from "react-icons/hi2";
import Modal from "@/components/Modal";
import BudgetForm from "@/components/BudgetForm";
import { CardSkeleton } from "@/components/Skeleton";
import toast from "react-hot-toast";

const COMMON_EMOJIS = ["💰", "🍔", "🚗", "🏠", "💡", "🏥", "🎁", "✈️", "👔", "🎮", "🍿", "🏋️", "📚", "🐶", "🛒", "🛠️"];

export default function CategoriesPage() {
    const { user } = useAuthStore();
    const {
        categories,
        budgets,
        fetchCategories,
        fetchBudgets,
        addCategory,
        updateCategory,
        deleteCategory,
        checkCategoryUsage
    } = useExpenseStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: "", emoji: "📦" });
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchBudgets();
        setMounted(true);
    }, [fetchCategories, fetchBudgets]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) {
            toast.error("Category name is required");
            return;
        }
        setLoading(true);
        let result;
        if (editingCategory) {
            result = await updateCategory(editingCategory.id, newCategory.name, newCategory.emoji);
        } else {
            result = await addCategory(newCategory.name, newCategory.emoji, user.id);
        }
        setLoading(false);
        if (result.error) {
            toast.error(result.error.message);
        } else {
            toast.success(editingCategory ? "Category updated!" : "Category added!");
            setIsAddModalOpen(false);
            setEditingCategory(null);
            setNewCategory({ name: "", emoji: "📦" });
        }
    };

    const handleDelete = async (cat) => {
        if (cat.is_default) {
            toast.error("Standard categories cannot be deleted.");
            return;
        }

        const { total, expenseCount, recurringCount } = await checkCategoryUsage(cat.id);

        if (total > 0) {
            const confirmMsg = `WARNING: "${cat.name}" has ${expenseCount} expenses and ${recurringCount} recurring payments associated with it.\n\nDeleting this category will PERMANENTLY delete all associated data.\n\nAre you sure you want to proceed? Type "DELETE" to confirm:`;
            const userInput = prompt(confirmMsg);
            if (userInput !== "DELETE") return;
        } else {
            if (!confirm(`Are you sure you want to delete the "${cat.name}" category?`)) return;
        }

        const { error } = await deleteCategory(cat.id);
        if (error) {
            toast.error("Failed to delete category");
        } else {
            toast.success("Category deleted");
        }
    };

    if (!mounted) return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ width: '200px', height: '32px' }} className="skeleton" />
                <div style={{ width: '120px', height: '40px' }} className="skeleton" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Categories</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Organize your expenses with custom categories
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setNewCategory({ name: "", emoji: "📦" });
                        setIsAddModalOpen(true);
                    }}
                    className="btn btn-primary"
                >
                    <HiOutlinePlus size={18} />
                    New Category
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16
            }}>
                {categories.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        padding: '60px 40px',
                        textAlign: 'center',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border)'
                    }}>
                        <HiOutlineTag size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                        <h3 style={{ marginBottom: 8 }}>No categories yet</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                            You haven't set up any expense categories. Start by creating your own or run the seed script to get the standard set.
                        </p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn btn-primary"
                        >
                            <HiOutlinePlus size={18} />
                            Create Your First Category
                        </button>
                    </div>
                ) : categories.map((cat) => {
                    const budget = budgets.find(b => b.category_id === cat.id);
                    return (
                        <div key={cat.id} className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: 'var(--bg-input)',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontSize: 24
                                }}>
                                    {cat.emoji || "📦"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>{cat.name}</div>
                                    {cat.is_default && (
                                        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Default
                                        </span>
                                    )}
                                </div>
                                {budget && (
                                    <div className="badge badge-green" style={{ fontSize: 10 }}>₹{budget.amount}</div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setIsBudgetModalOpen(true);
                                    }}
                                    className="btn btn-ghost btn-sm btn-icon"
                                    style={{ color: budget ? 'var(--accent)' : 'var(--text-muted)' }}
                                    title={budget ? `Update Budget: ₹${budget.amount}` : "Set Budget"}
                                >
                                    <HiOutlineCurrencyDollar size={20} />
                                </button>

                                {!cat.is_default && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingCategory(cat);
                                                setNewCategory({ name: cat.name, emoji: cat.emoji });
                                                setIsAddModalOpen(true);
                                            }}
                                            className="btn btn-ghost btn-sm btn-icon"
                                            style={{ color: 'var(--text-secondary)' }}
                                            title="Edit Category"
                                        >
                                            <HiOutlinePencilSquare size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat)}
                                            className="btn btn-ghost btn-sm btn-icon"
                                            style={{ color: 'var(--accent-red)' }}
                                            title="Delete Category"
                                        >
                                            <HiOutlineTrash size={18} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {budget && (
                                <div style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8, fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Monthly Budget:</span>
                                    <span style={{ float: 'right', fontWeight: 600, color: 'var(--accent)' }}>₹{budget.amount}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                }}
                title={editingCategory ? "Edit Category" : "New Category"}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label className="input-label">Category Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Subscriptions"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label className="input-label">Icon / Emoji</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                            {COMMON_EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setNewCategory({ ...newCategory, emoji })}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        border: '1px solid',
                                        borderColor: newCategory.emoji === emoji ? 'var(--accent)' : 'var(--border)',
                                        background: newCategory.emoji === emoji ? 'var(--accent-dim)' : 'var(--bg-input)',
                                        fontSize: 20,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? (editingCategory ? "Updating..." : "Creating...") : (editingCategory ? "Update Category" : "Create Category")}
                    </button>
                </form>
            </Modal>

            {/* Budget Modal */}
            <Modal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                title="Monthly Budget"
            >
                {selectedCategory && (
                    <BudgetForm
                        category={selectedCategory}
                        initialAmount={budgets.find(b => b.category_id === selectedCategory.id)?.amount || ""}
                        onSuccess={() => {
                            setIsBudgetModalOpen(false);
                            fetchBudgets();
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}

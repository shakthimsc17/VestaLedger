"use client";
import { useEffect, useState } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import dayjs from "dayjs";
import Link from "next/link";
import {
    HiOutlineBanknotes,
    HiOutlineCalendarDays,
    HiOutlineArrowTrendingUp,
    HiOutlineArrowTrendingDown,
    HiOutlinePlusCircle,
    HiOutlineChartBar,
} from "react-icons/hi2";
import { Skeleton } from "@/components/Skeleton";

export default function DashboardPage() {
    const { profile } = useAuthStore();
    const {
        expenses,
        categories,
        budgets,
        fetchExpenses,
        fetchCategories,
        fetchBudgets,
        getSummary,
        setDateRange,
        getComparison,
    } = useExpenseStore();
    const [comparison, setComparison] = useState({ lastMonthTotal: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setDateRange("month");
        fetchCategories();
        fetchBudgets();
        const loadComparison = async () => {
            const result = await getComparison();
            setComparison(result);
        };
        loadComparison();
        setMounted(true);
    }, [fetchCategories, fetchBudgets, setDateRange, getComparison]);

    useEffect(() => {
        if (mounted) fetchExpenses();
    }, [mounted, fetchExpenses]);

    const summary = getSummary();
    const currency = profile?.currency || "INR";
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    });

    const recentExpenses = expenses.slice(0, 5);

    const categorySpending = Object.entries(summary.categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const totalMonthBudget = 0; // Will be populated when budgets are fetched

    const greetingHour = dayjs().hour();
    const greeting =
        greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div>
            {/* Greeting */}
            <div style={{ marginBottom: 32 }} className="animate-fade-in">
                <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
                    {greeting},{" "}
                    <span className="gradient-text">
                        {profile?.display_name || "there"}
                    </span>{" "}
                    👋
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Here&apos;s your spending overview for {dayjs().format("MMMM YYYY")}
                </p>
            </div>

            {/* Monthly Insight Banner */}
            {mounted && comparison.lastMonthTotal > 0 && (
                <div
                    className="card animate-fade-in"
                    style={{
                        padding: '16px 24px',
                        marginBottom: 32,
                        background: 'var(--accent-dim)',
                        border: '1px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--bg-primary)'
                        }}>
                            <HiOutlineArrowTrendingUp size={18} />
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>
                            {summary.monthTotal > comparison.lastMonthTotal ? (
                                <>You&apos;ve spent <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{Math.round((summary.monthTotal / comparison.lastMonthTotal - 1) * 100)}% more</span> than last month.</>
                            ) : (
                                <>You&apos;ve spent <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.round((1 - summary.monthTotal / comparison.lastMonthTotal) * 100)}% less</span> than last month. Keep it up!</>
                            )}
                        </p>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Last Month: {formatter.format(comparison.lastMonthTotal)}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 16,
                    marginBottom: 32,
                }}
            >
                {[
                    {
                        label: "Today",
                        value: formatter.format(summary.todayTotal),
                        icon: HiOutlineBanknotes,
                        color: "#00e5a0",
                        bg: "rgba(0,229,160,0.08)",
                    },
                    {
                        label: "This Week",
                        value: formatter.format(summary.weekTotal),
                        icon: HiOutlineCalendarDays,
                        color: "#7c6aff",
                        bg: "rgba(124,106,255,0.08)",
                    },
                    {
                        label: "This Month",
                        value: formatter.format(summary.monthTotal),
                        icon: HiOutlineArrowTrendingUp,
                        color: "#ff9f43",
                        bg: "rgba(255,159,67,0.08)",
                    },
                    {
                        label: "Transactions",
                        value: expenses.length,
                        icon: HiOutlineChartBar,
                        color: "#4da6ff",
                        bg: "rgba(77,166,255,0.08)",
                    },
                ].map((card, i) => (
                    <div
                        key={i}
                        className="card animate-slide-up"
                        style={{
                            padding: 22,
                            animationDelay: `${i * 0.08}s`,
                            animationFillMode: "both",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 14,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: "var(--text-secondary)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                {card.label}
                            </span>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: card.bg,
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <card.icon style={{ fontSize: 18, color: card.color }} />
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: 24,
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: card.color,
                            }}
                        >
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Two column layout */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                }}
                className="dashboard-grid"
            >
                {/* Recent Expenses */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div
                        style={{
                            padding: "18px 22px",
                            borderBottom: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>
                            Recent Expenses
                        </h2>
                        <Link
                            href="/dashboard/expenses"
                            style={{
                                fontSize: 12,
                                color: "var(--accent)",
                                textDecoration: "none",
                            }}
                        >
                            View all →
                        </Link>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                        {!mounted ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} style={{ padding: "10px 22px", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Skeleton width="36px" height="36px" borderRadius="8px" />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton width="60%" height="14px" style={{ marginBottom: 4 }} />
                                            <Skeleton width="30%" height="10px" />
                                        </div>
                                        <Skeleton width="50px" height="16px" />
                                    </div>
                                </div>
                            ))
                        ) : recentExpenses.length === 0 ? (
                            <div
                                style={{
                                    padding: "40px 22px",
                                    textAlign: "center",
                                    color: "var(--text-muted)",
                                }}
                            >
                                <HiOutlineBanknotes
                                    size={32}
                                    style={{ marginBottom: 8, opacity: 0.5 }}
                                />
                                <p style={{ fontSize: 13, marginBottom: 12 }}>
                                    No expenses yet
                                </p>
                                <Link
                                    href="/dashboard/expenses"
                                    className="btn btn-primary btn-sm"
                                >
                                    <HiOutlinePlusCircle size={14} />
                                    Add your first expense
                                </Link>
                            </div>
                        ) : (
                            recentExpenses.map((exp, i) => (
                                <div
                                    key={exp.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "10px 22px",
                                        transition: "background 0.2s",
                                        borderBottom:
                                            i < recentExpenses.length - 1
                                                ? "1px solid var(--border)"
                                                : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 8,
                                            background: "var(--bg-input)",
                                            display: "grid",
                                            placeItems: "center",
                                            fontSize: 16,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {exp.categories?.emoji || "📦"}
                                    </div>
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {exp.note || exp.categories?.name || "Expense"}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            {dayjs(exp.date).format("MMM D")} ·{" "}
                                            {exp.categories?.name || "Uncategorized"}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            fontFamily: "'JetBrains Mono', monospace",
                                            color: "var(--accent-red)",
                                        }}
                                    >
                                        -{formatter.format(exp.amount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Budget Status */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div
                        style={{
                            padding: "18px 22px",
                            borderBottom: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>
                            Budget Status
                        </h2>
                        <Link
                            href="/dashboard/categories"
                            style={{
                                fontSize: 12,
                                color: "var(--accent)",
                                textDecoration: "none",
                            }}
                        >
                            Set Budgets →
                        </Link>
                    </div>
                    <div style={{ padding: "18px 22px" }}>
                        {!mounted ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Skeleton width="40%" height="14px" />
                                        <Skeleton width="30%" height="14px" />
                                    </div>
                                    <Skeleton width="100%" height="8px" borderRadius="4px" />
                                </div>
                            ))
                        ) : budgets.length === 0 ? (
                            <div
                                style={{
                                    padding: "40px 0",
                                    textAlign: "center",
                                    color: "var(--text-muted)",
                                }}
                            >
                                <p style={{ fontSize: 13, marginBottom: 12 }}>
                                    No budgets set for this month
                                </p>
                                <Link
                                    href="/dashboard/categories"
                                    className="btn btn-secondary btn-sm"
                                >
                                    Configure Budgets
                                </Link>
                            </div>
                        ) : (
                            budgets.map((budget) => {
                                const spent = summary.categoryTotals[budget.categories?.name] || 0;
                                const percentage = Math.min(Math.round((spent / budget.amount) * 100), 100);
                                const isOver = spent > budget.amount;
                                const color = isOver ? "var(--accent-red)" : percentage > 80 ? "var(--accent-orange)" : "var(--accent)";

                                return (
                                    <div key={budget.id} style={{ marginBottom: 20 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: 6,
                                                fontSize: 13,
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>{budget.categories?.emoji} {budget.categories?.name}</span>
                                            <span
                                                style={{
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    color: isOver ? 'var(--accent-red)' : 'var(--text-secondary)',
                                                }}
                                            >
                                                {formatter.format(spent)} / {formatter.format(budget.amount)}
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${percentage}%`,
                                                    background: color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Responsive */}
            <style jsx>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}

"use client";
import { useEffect, useState, useMemo } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
import { useLoanStore } from "@/store/loanStore";
import { useSavingsStore } from "@/store/savingsStore";
import dayjs from "dayjs";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Sector, AreaChart, Area, Legend
} from 'recharts';
import {
    HiOutlineChartPie,
    HiOutlineArrowTrendingUp,
    HiOutlineCalendar,
    HiOutlineArrowDownTray,
    HiOutlineAdjustmentsHorizontal
} from "react-icons/hi2";

const COLORS = ['#00e5a0', '#7c6aff', '#ff9f43', '#4da6ff', '#ff6b6b', '#ffd166', '#a55eea', '#4b7bec'];

export default function ReportsPage() {
    const { profile } = useAuthStore();
    const { expenses, filters, setFilter, setDateRange, fetchExpenses } = useExpenseStore();
    const { loans, fetchLoans, payments, fetchPayments } = useLoanStore();
    const { savings, fetchSavings } = useSavingsStore();

    useEffect(() => {
        if (!filters.dateRange) setDateRange("month");
    }, [filters.dateRange, setDateRange]);

    useEffect(() => {
        fetchExpenses();
        fetchLoans();
        fetchSavings();
        fetchPayments();
    }, [fetchExpenses, fetchLoans, fetchSavings, fetchPayments, filters.dateRange, filters.startDate, filters.endDate]);

    const currency = profile?.currency || "INR";
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    });

    // Data processing for Daily Spending Bar Chart
    const dailyData = useMemo(() => {
        const dataMap = {};
        const start = dayjs(filters.startDate);
        const end = dayjs(filters.endDate);

        // Initialize days
        let current = start;
        while (current.isBefore(end) || current.isSame(end, 'day')) {
            dataMap[current.format('YYYY-MM-DD')] = 0;
            current = current.add(1, 'day');
        }

        expenses.forEach(exp => {
            if (dataMap[exp.date] !== undefined) {
                dataMap[exp.date] += parseFloat(exp.amount);
            }
        });

        return Object.keys(dataMap).sort().map(date => ({
            date: dayjs(date).format('DD MMM'),
            amount: dataMap[date]
        }));
    }, [expenses, filters.startDate, filters.endDate]);

    // Data processing for Category Donut Chart
    const categoryData = useMemo(() => {
        const summary = expenses.reduce((acc, exp) => {
            const cat = exp.categories?.name || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount);
            return acc;
        }, {});

        return Object.entries(summary)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [expenses]);

    const totalSpend = useMemo(() =>
        categoryData.reduce((sum, item) => sum + item.value, 0),
        [categoryData]);

    // Data for Savings Progress
    const savingsProgress = useMemo(() => {
        return savings
            .filter(s => s.target_amount > 0)
            .map(s => ({
                name: s.name,
                emoji: s.emoji || '💰',
                current: parseFloat(s.current_amount || 0),
                target: parseFloat(s.target_amount),
                percent: Math.min(100, Math.round((parseFloat(s.current_amount || 0) / parseFloat(s.target_amount)) * 100))
            }))
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 4);
    }, [savings]);

    // Data for Debt Reduction
    const debtReduction = useMemo(() => {
        if (loans.length === 0) return null;

        let totalInitial = 0;
        let totalCurrent = 0;

        loans.forEach(loan => {
            const current = parseFloat(loan.total_amount || 0);
            totalCurrent += current;

            if (loan.initial_amount) {
                totalInitial += parseFloat(loan.initial_amount);
            } else {
                // Reconstruct initial amount if missing: current balance + sum of all payments for this loan
                const loanPayments = payments
                    .filter(p => p.loan_id === loan.id)
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                totalInitial += current + loanPayments;
            }
        });

        const totalPaid = Math.max(0, totalInitial - totalCurrent);
        const percent = totalInitial > 0 ? Math.round((totalPaid / totalInitial) * 100) : 0;

        return {
            totalPaid,
            totalInitial,
            percent
        };
    }, [loans, payments]);

    // Removed early return to allow showing loans and savings reports even if expenses are empty

    const handleExportCSV = () => {
        const headers = ['Date', 'Category', 'Note', 'Amount'];
        const rows = expenses.map(exp => [
            exp.date,
            exp.categories?.name || 'Uncategorized',
            exp.note || '',
            exp.amount
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `vestaledger-report-${filters.dateRange}-${dayjs().format('YYYY-MM-DD')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Reports & Insights</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Detailed breakdown of your finances for {dayjs(filters.startDate).format('MMM D')} — {dayjs(filters.endDate).format('MMM D, YYYY')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
                        <HiOutlineArrowDownTray size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Period Selector Toggle */}
            <div style={{
                display: 'inline-flex',
                gap: 4,
                background: 'var(--bg-card)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                marginBottom: 24
            }}>
                {['week', 'month', 'year'].map(range => (
                    <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            border: 'none',
                            cursor: 'pointer',
                            background: filters.dateRange === range ? 'var(--accent-dim)' : 'transparent',
                            color: filters.dateRange === range ? 'var(--accent)' : 'var(--text-secondary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {range}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>

                {/* Main Spending Bar Chart */}
                <div className="card" style={{ gridColumn: 'span 8', padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Spending Over Time</h3>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Daily totals</div>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip content={<CustomTooltip formatter={formatter} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar
                                    dataKey="amount"
                                    fill="var(--accent)"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown Donut Chart */}
                <div className="card" style={{ gridColumn: 'span 4', padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Category Breakdown</h3>
                    <div style={{ width: '100%', height: 220, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip formatter={formatter} />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {formatter.format(totalSpend)}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        {categoryData.slice(0, 4).map((entry, index) => (
                            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.name}</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round((entry.value / totalSpend) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Area Trend Chart */}
                <div className="card" style={{ gridColumn: 'span 12', padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Cumulative Growth</h3>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total spending progress</div>
                    </div>
                    <div style={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData.reduce((acc, curr, i) => {
                                const prevTotal = i > 0 ? acc[i - 1].total : 0;
                                acc.push({ ...curr, total: prevTotal + curr.amount });
                                return acc;
                            }, [])}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="var(--accent)"
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Savings & Debt Progress Section */}
                <div className="card" style={{ gridColumn: 'span 12', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ padding: 10, borderRadius: 12, background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                            <HiOutlineArrowTrendingUp size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Financial Progress</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tracking your goals and debt reduction</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                        {/* Savings Goals */}
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>Savings Goals</span>
                                <span className="badge badge-purple" style={{ fontSize: 10 }}>{savings.length} Active</span>
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                {savingsProgress.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                                        No savings goals trackable yet
                                    </div>
                                ) : (
                                    savingsProgress.map(goal => (
                                        <div key={goal.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                                <span style={{ fontWeight: 600 }}>{goal.emoji} {goal.name}</span>
                                                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{goal.percent}%</span>
                                            </div>
                                            <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${goal.percent}%`,
                                                        background: 'linear-gradient(90deg, var(--accent) 0%, #a55eea 100%)',
                                                        borderRadius: 4,
                                                        transition: 'width 1s ease-out'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                                                <span>{formatter.format(goal.current)}</span>
                                                <span>Goal: {formatter.format(goal.target)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Debt Reduction */}
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Debt Reduction</h4>
                            {debtReduction ? (
                                <div style={{
                                    padding: '24px',
                                    background: 'var(--bg-input)',
                                    borderRadius: 16,
                                    border: '1px solid var(--border)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Total Progress</div>
                                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-red)' }}>{debtReduction.percent}%</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Repaid</div>
                                                <div style={{ fontSize: 16, fontWeight: 700 }}>{formatter.format(debtReduction.totalPaid)}</div>
                                            </div>
                                        </div>

                                        <div style={{ height: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${debtReduction.percent}%`,
                                                    background: 'var(--accent-red)',
                                                    borderRadius: 6,
                                                    transition: 'width 1s ease-out'
                                                }}
                                            />
                                        </div>

                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center' }}>
                                            Remaining Debt: <span style={{ fontWeight: 700, marginLeft: 6 }}>{formatter.format(debtReduction.totalInitial - debtReduction.totalPaid)}</span>
                                        </div>
                                    </div>

                                    {/* Decorative background circle */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '-20px',
                                        bottom: '-20px',
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: 'var(--accent-red)',
                                        opacity: 0.05,
                                        zIndex: 1
                                    }} />
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                                    No active loans found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media (max-width: 1024px) {
          .card {
            grid-column: span 12 !important;
          }
        }
      `}</style>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)'
            }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                    {formatter?.format ? formatter.format(payload[0].value) : payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

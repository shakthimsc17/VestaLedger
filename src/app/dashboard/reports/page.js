"use client";
import { useEffect, useState, useMemo } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuthStore } from "@/store/authStore";
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!filters.dateRange) setDateRange("month");
        setMounted(true);
    }, [filters.dateRange, setDateRange]);

    useEffect(() => {
        if (mounted) fetchExpenses();
    }, [mounted, fetchExpenses, filters.dateRange, filters.startDate, filters.endDate]);

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

    if (!mounted) return null;

    const CustomTooltip = ({ active, payload, label }) => {
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
                        {formatter.format(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

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
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
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
                                <Tooltip content={<CustomTooltip />} />
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

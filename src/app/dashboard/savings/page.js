"use client";
import { useEffect, useState } from "react";
import { useSavingsStore } from "@/store/savingsStore";
import { useAuthStore } from "@/store/authStore";
import { HiOutlinePlusCircle, HiOutlineArrowTrendingUp, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineDocumentArrowDown, HiOutlineQueueList, HiOutlineClock, HiOutlineCalendarDays, HiOutlinePencil } from "react-icons/hi2";
import Modal from "@/components/Modal";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SavingsPage() {
    const { profile, user } = useAuthStore();
    const { savings, contributions, fetchSavings, fetchContributions, addSavings, updateSavings, deleteSavings, recordContribution, loading } = useSavingsStore();
    const [activeTab, setActiveTab] = useState("savings"); // savings, history
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [savingToDelete, setSavingToDelete] = useState(null);
    const [editingSaving, setEditingSaving] = useState(null);

    // History Filters
    const [historyFilters, setHistoryFilters] = useState({
        savingId: "all",
        startDate: dayjs().startOf('month').format("YYYY-MM-DD"),
        endDate: dayjs().endOf('month').format("YYYY-MM-DD"),
    });

    const [formData, setFormData] = useState({
        name: "",
        type: "savings_account",
        current_amount: "",
        target_amount: "",
        recurring_contribution: "",
        duration: "", // months
        start_date: dayjs().format("YYYY-MM-DD"),
        next_contribution_date: "",
    });

    useEffect(() => {
        fetchSavings();
        fetchContributions();
    }, [fetchSavings, fetchContributions]);

    // Unified handle change to manage calculations
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };

            // Auto-calculate target amount based on monthly contribution and duration
            if (name === "recurring_contribution" || name === "duration") {
                if (next.recurring_contribution && next.duration) {
                    const calculatedTarget = parseFloat(next.recurring_contribution) * parseInt(next.duration);
                    next.target_amount = calculatedTarget.toString();
                }
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            user_id: user.id,
            current_amount: parseFloat(formData.current_amount) || 0,
            target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
            recurring_contribution: formData.recurring_contribution ? parseFloat(formData.recurring_contribution) : null,
            duration: formData.duration ? parseInt(formData.duration) : null,
            start_date: formData.start_date || null,
            next_contribution_date: formData.next_contribution_date || null,
        };

        let result;
        if (editingSaving) {
            result = await updateSavings(editingSaving.id, payload);
        } else {
            result = await addSavings(payload);
        }

        if (!result.error) {
            toast.success(editingSaving ? "Savings record updated!" : "Savings record created!");
            setIsModalOpen(false);
            setEditingSaving(null);
            setFormData({
                name: "",
                type: "savings_account",
                current_amount: "",
                target_amount: "",
                recurring_contribution: "",
                duration: "",
                start_date: dayjs().format("YYYY-MM-DD"),
                next_contribution_date: "",
            });
        } else {
            toast.error(result.error.message);
        }
    };

    const handleContribution = async (id) => {
        const { error } = await recordContribution(id, user.id);
        if (!error) {
            toast.success("Contribution recorded!");
        } else {
            toast.error(error.message);
        }
    };

    const handleDelete = async () => {
        if (!savingToDelete) return;
        const { error } = await deleteSavings(savingToDelete);
        if (!error) {
            toast.success("Savings record deleted");
            setIsDeleteModalOpen(false);
            setSavingToDelete(null);
        } else {
            toast.error(error.message);
        }
    };

    const currency = profile?.currency || "INR";
    const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    });

    const filteredContributions = contributions.filter(c => {
        const matchesSaving = historyFilters.savingId === "all" || c.saving_id === historyFilters.savingId;
        const matchesDate = c.contribution_date >= historyFilters.startDate && c.contribution_date <= historyFilters.endDate;
        return matchesSaving && matchesDate;
    });

    const exportToPDF = () => {
        const doc = new jsPDF();

        if (activeTab === "savings") {
            const title = "Savings & Investments Summary";
            const filename = "savings_summary.pdf";

            doc.setFontSize(18);
            doc.text(title, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${dayjs().format("MMM D, YYYY HH:mm")}`, 14, 30);

            const tableColumn = ["Name", "Type", "Current Bal", "Target", "Monthly", "Progress"];
            const tableRows = savings.map(s => [
                s.name,
                s.type.replace('_', ' ').charAt(0).toUpperCase() + s.type.replace('_', ' ').slice(1),
                formatter.format(s.current_amount),
                s.target_amount ? formatter.format(s.target_amount) : "N/A",
                s.recurring_contribution ? formatter.format(s.recurring_contribution) : "N/A",
                s.target_amount ? `${Math.round((s.current_amount / s.target_amount) * 100)}%` : "N/A"
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            doc.save(filename);
        } else {
            const title = "Savings Contribution History Report";
            const filename = "savings_history.pdf";

            doc.setFontSize(18);
            doc.text(title, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Period: ${dayjs(historyFilters.startDate).format("MMM D")} - ${dayjs(historyFilters.endDate).format("MMM D, YYYY")}`, 14, 30);

            const tableColumn = ["Date", "Saving Name", "Amount Contributed"];
            const tableRows = filteredContributions.map(c => [
                dayjs(c.contribution_date).format("MMM D, YYYY"),
                c.savings?.name || "N/A",
                formatter.format(c.amount)
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [39, 174, 96], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            doc.save(filename);
        }

        toast.success("PDF exported successfully!");
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Savings & Investments</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Watch your wealth grow</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ background: "var(--bg-input)", padding: 4, borderRadius: 10, display: "flex", gap: 4 }}>
                        <button
                            onClick={() => setActiveTab("savings")}
                            style={{
                                padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                                background: activeTab === "savings" ? "var(--bg-card)" : "transparent",
                                color: activeTab === "savings" ? "var(--accent)" : "var(--text-muted)",
                                boxShadow: activeTab === "savings" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                                transition: "all 0.2s"
                            }}
                        >
                            <HiOutlineQueueList size={16} />
                            Manage
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            style={{
                                padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                                background: activeTab === "history" ? "var(--bg-card)" : "transparent",
                                color: activeTab === "history" ? "var(--accent)" : "var(--text-muted)",
                                boxShadow: activeTab === "history" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                                transition: "all 0.2s"
                            }}
                        >
                            <HiOutlineClock size={16} />
                            History
                        </button>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={exportToPDF} className="btn btn-secondary btn-sm" disabled={(activeTab === 'savings' ? savings.length : filteredContributions.length) === 0}>
                        <HiOutlineDocumentArrowDown size={18} />
                        Export PDF
                    </button>
                    <button onClick={() => {
                        setEditingSaving(null);
                        setFormData({
                            name: "",
                            type: "savings_account",
                            current_amount: "",
                            target_amount: "",
                            recurring_contribution: "",
                            duration: "",
                            start_date: dayjs().format("YYYY-MM-DD"),
                            next_contribution_date: "",
                        });
                        setIsModalOpen(true);
                    }} className="btn btn-primary btn-sm">
                        <HiOutlinePlusCircle size={18} />
                        Add Saving
                    </button>
                </div>
            </div>

            {activeTab === "savings" ? (
                <>

                    {savings.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: 16, border: "1px dashed var(--border-color)" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No savings found</h3>
                            <p style={{ color: "var(--text-muted)", maxWidth: 300, margin: "0 auto" }}>
                                Start building your wealth by adding your first savings goal.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                            {savings.map((saving) => (
                                <div key={saving.id} className="card animate-slide-up" style={{ padding: 24 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10, background: "var(--accent-dim)",
                                                display: "grid", placeItems: "center", color: "var(--accent)"
                                            }}>
                                                <HiOutlineArrowTrendingUp size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{saving.name}</h3>
                                                <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{saving.type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={() => {
                                                    setEditingSaving(saving);
                                                    setFormData({
                                                        name: saving.name,
                                                        type: saving.type,
                                                        current_amount: saving.current_amount.toString(),
                                                        target_amount: saving.target_amount ? saving.target_amount.toString() : "",
                                                        recurring_contribution: saving.recurring_contribution ? saving.recurring_contribution.toString() : "",
                                                        duration: saving.duration ? saving.duration.toString() : "",
                                                        start_date: saving.start_date || dayjs(saving.created_at).format("YYYY-MM-DD"),
                                                        next_contribution_date: saving.next_contribution_date || "",
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                                                title="Edit Saving"
                                            >
                                                <HiOutlinePencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSavingToDelete(saving.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                                                title="Delete Saving"
                                            >
                                                <HiOutlineTrash size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--accent)" }}>
                                            {formatter.format(saving.current_amount)}
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Current Balance</div>
                                    </div>

                                    {/* Saving Progress */}
                                    {saving.target_amount && (
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                                <span>Progress to {formatter.format(saving.target_amount)}</span>
                                                <span style={{ fontWeight: 600 }}>{Math.round((saving.current_amount / saving.target_amount) * 100)}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${Math.min((saving.current_amount / saving.target_amount) * 100, 100)}%`, background: "var(--accent)" }} />
                                            </div>
                                            {saving.duration && (
                                                <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                                                    <span>Target Timeline</span>
                                                    <span>{contributions.filter(c => c.saving_id === saving.id).length} / {saving.duration} Months</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {saving.recurring_contribution && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ padding: "12px", background: "var(--bg-input)", borderRadius: 8, fontSize: 13 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <span>Monthly contribution</span>
                                                    <span style={{ fontWeight: 600 }}>{formatter.format(saving.recurring_contribution)}</span>
                                                </div>
                                                {saving.next_contribution_date && (
                                                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                                                        <span>Next Deposit</span>
                                                        <span>{dayjs(saving.next_contribution_date).format("MMM D")}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleContribution(saving.id)}
                                                className="btn btn-secondary btn-sm"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >
                                                <HiOutlineCheckCircle size={16} />
                                                Record Contribution
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: 24, borderBottom: "1px solid var(--border-color)", background: "var(--bg-input-dim)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginLeft: 2 }}>SELECT SAVING</label>
                                <select
                                    className="input-field" style={{ padding: "8px 12px", minWidth: 200 }}
                                    value={historyFilters.savingId} onChange={e => setHistoryFilters({ ...historyFilters, savingId: e.target.value })}
                                >
                                    <option value="all">All Savings</option>
                                    {savings.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginLeft: 2 }}>FROM</label>
                                <div style={{ position: "relative" }}>
                                    <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                                    <input
                                        type="date" className="input-field" style={{ padding: "8px 12px 8px 36px", cursor: "pointer" }}
                                        value={historyFilters.startDate} onChange={e => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                                        onClick={(e) => e.target.showPicker?.()}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginLeft: 2 }}>TO</label>
                                <div style={{ position: "relative" }}>
                                    <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                                    <input
                                        type="date" className="input-field" style={{ padding: "8px 12px 8px 36px", cursor: "pointer" }}
                                        value={historyFilters.endDate} onChange={e => setHistoryFilters({ ...historyFilters, endDate: e.target.value })}
                                        onClick={(e) => e.target.showPicker?.()}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ background: "var(--bg-input)", borderBottom: "1px solid var(--border-color)" }}>
                                    <th style={{ padding: "16px", fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>DATE</th>
                                    <th style={{ padding: "16px", fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>SAVING GOAL</th>
                                    <th style={{ padding: "16px", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textAlign: "right" }}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContributions.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                                            No contributions found for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredContributions.map((c) => (
                                        <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                            <td style={{ padding: "16px", fontSize: 14 }}>{dayjs(c.contribution_date).format("MMM D, YYYY")}</td>
                                            <td style={{ padding: "16px", fontSize: 14, fontWeight: 500 }}>{c.savings?.name || "N/A"}</td>
                                            <td style={{ padding: "16px", textAlign: "right", fontWeight: 600, color: "var(--accent)" }}>
                                                {formatter.format(c.amount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingSaving(null);
                }}
                title={editingSaving ? "Edit Saving Details" : "Add New Saving/Investment"}
            >
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ marginBottom: 16 }}>
                        <label className="input-label">Name</label>
                        <input
                            name="name" type="text" required placeholder="e.g. Emergency Fund"
                            className="input-field"
                            value={formData.name} onChange={handleFormChange}
                        />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div>
                            <label className="input-label">Type</label>
                            <select name="type" className="input-field" value={formData.type} onChange={handleFormChange}>
                                <option value="savings_account">Savings Account</option>
                                <option value="fd">Fixed Deposit (FD)</option>
                                <option value="sip">SIP / Mutual Fund</option>
                                <option value="gold">Gold</option>
                                <option value="other">Other Investment</option>
                            </select>
                        </div>
                        <div>
                            <label className="input-label">Duration (Months - Opt)</label>
                            <input
                                name="duration" type="number" placeholder="e.g. 12"
                                className="input-field"
                                value={formData.duration} onChange={handleFormChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div>
                            <label className="input-label">Current Amount</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                                <input
                                    name="current_amount" type="number" required placeholder="0.00"
                                    className="input-field" style={{ paddingLeft: 34 }}
                                    value={formData.current_amount} onChange={handleFormChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Monthly Contribution (Opt)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                                <input
                                    name="recurring_contribution" type="number" placeholder="0.00"
                                    className="input-field" style={{ paddingLeft: 34 }}
                                    value={formData.recurring_contribution} onChange={handleFormChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label className="input-label">Target Amount (Auto if Duration set)</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                            <input
                                name="target_amount" type="number" placeholder="0.00"
                                className="input-field" style={{ paddingLeft: 34 }}
                                value={formData.target_amount} onChange={handleFormChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                        <div>
                            <label className="input-label">Start Date</label>
                            <div style={{ position: "relative" }}>
                                <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                                <input
                                    name="start_date" type="date" className="input-field" style={{ padding: "8px 12px 8px 36px", cursor: "pointer" }}
                                    value={formData.start_date} onChange={handleFormChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Next Deposit (Opt)</label>
                            <div style={{ position: "relative" }}>
                                <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                                <input
                                    name="next_contribution_date" type="date" className="input-field" style={{ padding: "8px 12px 8px 36px", cursor: "pointer" }}
                                    value={formData.next_contribution_date} onChange={handleFormChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        {editingSaving ? "Update Saving Details" : "Create Saving Record"}
                    </button>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Savings Record?">
                <div style={{ padding: '8px 0' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Are you sure you want to delete this savings record? This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                        <button onClick={handleDelete} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-red)', color: 'white' }}>Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

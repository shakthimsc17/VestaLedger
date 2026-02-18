"use client";
import React, { useEffect, useState } from "react";
import { useLoanStore } from "@/store/loanStore";
import { useAuthStore } from "@/store/authStore";
import { HiOutlinePlusCircle, HiOutlineCreditCard, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineDocumentArrowDown, HiOutlineEye, HiOutlineEyeSlash, HiOutlineQueueList, HiOutlineClock, HiOutlineCalendarDays, HiOutlinePencil } from "react-icons/hi2";
import Modal from "@/components/Modal";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DebtsPage() {
    const { profile, user } = useAuthStore();
    const { loans, payments, fetchLoans, fetchPayments, addLoan, updateLoan, deleteLoan, makePayment, loading } = useLoanStore();
    const [activeTab, setActiveTab] = useState("loans"); // loans, history
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loanToDelete, setLoanToDelete] = useState(null);
    const [editingLoan, setEditingLoan] = useState(null);
    const [viewPaid, setViewPaid] = useState(false);

    // History Filters
    const [historyFilters, setHistoryFilters] = useState({
        loanId: "all",
        startDate: dayjs().startOf('month').format("YYYY-MM-DD"),
        endDate: dayjs().endOf('month').format("YYYY-MM-DD"),
    });

    const [formData, setFormData] = useState({
        name: "",
        type: "bank",
        total_amount: "",
        recurring_payment: "",
        duration: "", // months
        start_date: dayjs().format("YYYY-MM-DD"),
        next_due_date: "",
    });

    useEffect(() => {
        fetchLoans();
        fetchPayments();
    }, [fetchLoans, fetchPayments]);

    // Unified handle change to manage calculations
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };

            // Auto-calculate total amount based on EMI and duration
            if (name === "recurring_payment" || name === "duration") {
                if (next.recurring_payment && next.duration) {
                    const calculatedTotal = parseFloat(next.recurring_payment) * parseInt(next.duration);
                    next.total_amount = calculatedTotal.toString();
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
            total_amount: parseFloat(formData.total_amount) || 0,
            recurring_payment: formData.recurring_payment ? parseFloat(formData.recurring_payment) : null,
            duration: formData.duration ? parseInt(formData.duration) : null,
            next_due_date: formData.next_due_date || null,
        };

        let result;
        if (editingLoan) {
            result = await updateLoan(editingLoan.id, payload);
        } else {
            // Create new loan record
            result = await addLoan(payload);
        }

        if (!result.error) {
            toast.success(editingLoan ? "Loan updated!" : "Loan record created!");
            setIsModalOpen(false);
            setEditingLoan(null);
            setFormData({
                name: "",
                type: "bank",
                total_amount: "",
                recurring_payment: "",
                duration: "",
                start_date: dayjs().format("YYYY-MM-DD"),
                next_due_date: "",
            });
        } else {
            toast.error(result.error.message);
        }
    };

    const handleDelete = async () => {
        if (!loanToDelete) return;
        const { error } = await deleteLoan(loanToDelete);
        if (!error) {
            toast.success("Loan deleted");
            setIsDeleteModalOpen(false);
            setLoanToDelete(null);
        } else {
            toast.error(error.message);
        }
    };

    const handlePayment = async (id) => {
        const { error } = await makePayment(id, user.id);
        if (!error) {
            toast.success("Payment recorded!");
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

    const filteredLoans = loans.filter(loan =>
        viewPaid ? loan.status === 'closed' : loan.status !== 'closed'
    );

    const filteredPayments = payments.filter(p => {
        const matchesLoan = historyFilters.loanId === "all" || p.loan_id === historyFilters.loanId;
        const matchesDate = p.payment_date >= historyFilters.startDate && p.payment_date <= historyFilters.endDate;
        return matchesLoan && matchesDate;
    });

    const exportToPDF = () => {
        const doc = new jsPDF();

        if (activeTab === "loans") {
            const title = viewPaid ? "Paid Debts Report" : "Active Debts Report";
            const filename = viewPaid ? "paid_debts.pdf" : "active_debts.pdf";

            doc.setFontSize(18);
            doc.text(title, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${dayjs().format("MMM D, YYYY HH:mm")}`, 14, 30);

            const tableColumn = ["Loan Name", "Type", "Amount", "EMI", "Start Date", "Status"];
            const tableRows = filteredLoans.map(loan => [
                loan.name,
                loan.type.charAt(0).toUpperCase() + loan.type.slice(1),
                formatter.format(loan.total_amount),
                loan.recurring_payment ? formatter.format(loan.recurring_payment) : "N/A",
                dayjs(loan.start_date).format("MMM D, YYYY"),
                loan.status.charAt(0).toUpperCase() + loan.status.slice(1)
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            doc.save(filename);
        } else {
            const title = "Debt Payment History Report";
            const filename = "payment_history.pdf";

            doc.setFontSize(18);
            doc.text(title, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Period: ${dayjs(historyFilters.startDate).format("MMM D")} - ${dayjs(historyFilters.endDate).format("MMM D, YYYY")}`, 14, 30);

            const tableColumn = ["Date", "Loan Name", "Amount Paid"];
            const tableRows = filteredPayments.map(p => [
                dayjs(p.payment_date).format("MMM D, YYYY"),
                p.loans?.name || "N/A",
                formatter.format(p.amount)
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
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
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Debts & Loans</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Track your financial liabilities and repayments</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ background: "var(--bg-input)", padding: 4, borderRadius: 10, display: "flex", gap: 4 }}>
                        <button
                            onClick={() => setActiveTab("loans")}
                            style={{
                                padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                                background: activeTab === "loans" ? "var(--bg-card)" : "transparent",
                                color: activeTab === "loans" ? "var(--text-primary)" : "var(--text-muted)",
                                display: "flex", alignItems: "center", gap: 8, transition: "0.2s"
                            }}
                        >
                            <HiOutlineQueueList size={18} />
                            Manage Loans
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            style={{
                                padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                                background: activeTab === "history" ? "var(--bg-card)" : "transparent",
                                color: activeTab === "history" ? "var(--text-primary)" : "var(--text-muted)",
                                display: "flex", alignItems: "center", gap: 8, transition: "0.2s"
                            }}
                        >
                            <HiOutlineClock size={18} />
                            Payment History
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === "loans" ? (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={() => setViewPaid(!viewPaid)}
                                className={`btn ${viewPaid ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            >
                                {viewPaid ? <HiOutlineEye size={18} /> : <HiOutlineEyeSlash size={18} />}
                                {viewPaid ? "Show Active" : "Show Paid (Closed)"}
                            </button>
                            <button onClick={exportToPDF} className="btn btn-secondary btn-sm" disabled={filteredLoans.length === 0}>
                                <HiOutlineDocumentArrowDown size={18} />
                                Export PDF
                            </button>
                        </div>
                        <button onClick={() => {
                            setEditingLoan(null);
                            setFormData({
                                name: "",
                                type: "bank",
                                total_amount: "",
                                recurring_payment: "",
                                duration: "",
                                start_date: dayjs().format("YYYY-MM-DD"),
                                next_due_date: "",
                            });
                            setIsModalOpen(true);
                        }} className="btn btn-primary btn-sm">
                            <HiOutlinePlusCircle size={18} />
                            Add Loan
                        </button>
                    </div>

                    {filteredLoans.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", borderRadius: 16, border: "1px dashed var(--border-color)" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>{viewPaid ? "✅" : "💸"}</div>
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No {viewPaid ? "paid" : "active"} debts found</h3>
                            <p style={{ color: "var(--text-muted)", maxWidth: 300, margin: "0 auto" }}>
                                {viewPaid ? "You haven't fully paid off any loans yet." : "Congratulations! You have no active debts."}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                            {filteredLoans.map((loan) => (
                                <div key={loan.id} className="card animate-slide-up" style={{ padding: 24 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10, background: loan.status === 'closed' ? "var(--bg-input)" : "var(--accent-red-dim)",
                                                display: "grid", placeItems: "center", color: loan.status === 'closed' ? "var(--text-muted)" : "var(--accent-red)"
                                            }}>
                                                <HiOutlineCreditCard size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 600, textDecoration: loan.status === 'closed' ? 'line-through' : 'none' }}>{loan.name}</h3>
                                                <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{loan.type} Loan {loan.status === 'closed' && '(Closed)'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={() => {
                                                    setEditingLoan(loan);
                                                    setFormData({
                                                        name: loan.name,
                                                        type: loan.type,
                                                        total_amount: loan.total_amount.toString(),
                                                        recurring_payment: loan.recurring_payment ? loan.recurring_payment.toString() : "",
                                                        duration: loan.duration ? loan.duration.toString() : "",
                                                        start_date: loan.start_date || dayjs(loan.created_at).format("YYYY-MM-DD"),
                                                        next_due_date: loan.next_due_date || "",
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                                                title="Edit Loan"
                                            >
                                                <HiOutlinePencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setLoanToDelete(loan.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                                                title="Delete Loan"
                                            >
                                                <HiOutlineTrash size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: loan.status === 'closed' ? "var(--text-muted)" : "var(--accent-red)" }}>
                                            {formatter.format(loan.total_amount)}
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{loan.status === 'closed' ? "Total Paid" : "Remaining Balance"}</div>
                                    </div>

                                    {/* Installment Progress */}
                                    {loan.duration && (
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 12 }}>
                                                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Repayment Progress</span>
                                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                                    {payments.filter(p => p.loan_id === loan.id).length} / {loan.duration} Months
                                                </span>
                                            </div>
                                            <div style={{ width: "100%", height: 6, background: "var(--bg-input)", borderRadius: 10, overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        width: `${Math.min(100, (payments.filter(p => p.loan_id === loan.id).length / loan.duration) * 100)}%`,
                                                        height: "100%",
                                                        background: loan.status === 'closed' ? "var(--text-muted)" : "linear-gradient(90deg, var(--accent-red), #ff6b6b)",
                                                        borderRadius: 10,
                                                        transition: "width 0.5s ease-out"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {loan.status !== 'closed' && loan.recurring_payment && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ padding: "12px", background: "var(--bg-input)", borderRadius: 8, fontSize: 13 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <span>Monthly EMI</span>
                                                    <span style={{ fontWeight: 600 }}>{formatter.format(loan.recurring_payment)}</span>
                                                </div>
                                                {loan.next_due_date && (
                                                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                                                        <span>Next Due</span>
                                                        <span>{dayjs(loan.next_due_date).format("MMM D, YYYY")}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handlePayment(loan.id)}
                                                className="btn btn-secondary btn-sm"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >
                                                <HiOutlineCheckCircle size={16} />
                                                Mark as Paid (Reduce Balance)
                                            </button>
                                        </div>
                                    )}

                                    {loan.status === 'closed' && (
                                        <div style={{ padding: "12px", background: "var(--bg-input)", borderRadius: 8, fontSize: 13, border: "1px solid var(--border-color)", borderStyle: "dashed", textAlign: "center", color: "var(--text-muted)" }}>
                                            This loan was closed on {dayjs(loan.updated_at).format("MMM D, YYYY")}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="card animate-fade-in" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginLeft: 2 }}>LOAN</label>
                                <select
                                    className="input-field" style={{ minWidth: 150, padding: "8px 12px" }}
                                    value={historyFilters.loanId} onChange={e => setHistoryFilters({ ...historyFilters, loanId: e.target.value })}
                                >
                                    <option value="all">All Loans</option>
                                    {loans.map(loan => <option key={loan.id} value={loan.id}>{loan.name}</option>)}
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
                        <button onClick={exportToPDF} className="btn btn-secondary btn-sm" disabled={filteredPayments.length === 0}>
                            <HiOutlineDocumentArrowDown size={18} />
                            Export History PDF
                        </button>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600 }}>Date</th>
                                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600 }}>Loan Name</th>
                                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                                            No payment records found for the selected period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map(p => (
                                        <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                            <td style={{ padding: "12px 16px" }}>{dayjs(p.payment_date).format("MMM D, YYYY")}</td>
                                            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{p.loans?.name || "Deleted Loan"}</td>
                                            <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "var(--accent-red)" }}>
                                                {formatter.format(p.amount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Loan Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingLoan(null);
                }}
                title={editingLoan ? "Edit Loan Details" : "Add New Loan Record"}
            >
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ marginBottom: 16 }}>
                        <label className="input-label">Loan Name</label>
                        <input
                            type="text" required placeholder="e.g. HDFC Home Loan"
                            className="input-field" name="name"
                            value={formData.name} onChange={handleFormChange}
                        />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label className="input-label">Loan Type</label>
                        <select className="input-field" name="type" value={formData.type} onChange={handleFormChange}>
                            <option value="bank">Bank Loan</option>
                            <option value="jewelry">Jewelry Loan</option>
                            <option value="personal">Personal Loan</option>
                            <option value="credit_card">Credit Card Debt</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label className="input-label">Monthly EMI</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                                <input
                                    type="number" placeholder="0.00"
                                    className="input-field" style={{ paddingLeft: 34 }}
                                    name="recurring_payment"
                                    value={formData.recurring_payment} onChange={handleFormChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Duration (Months)</label>
                            <input
                                type="number" placeholder="e.g. 12"
                                className="input-field" name="duration"
                                value={formData.duration} onChange={handleFormChange}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label className="input-label">Total Amount Owed {formData.recurring_payment && formData.duration && '(Calculated)'}</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>₹</span>
                            <input
                                type="number" required placeholder="0.00"
                                className="input-field" style={{ paddingLeft: 34 }}
                                name="total_amount"
                                value={formData.total_amount} onChange={handleFormChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div>
                            <label className="input-label">Start Date</label>
                            <div style={{ position: "relative" }}>
                                <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 1 }} />
                                <input
                                    type="date" required
                                    className="input-field" name="start_date"
                                    style={{ paddingLeft: 40, cursor: "pointer" }}
                                    value={formData.start_date} onChange={handleFormChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Next Due (Optional)</label>
                            <div style={{ position: "relative" }}>
                                <HiOutlineCalendarDays size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", zIndex: 1 }} />
                                <input
                                    type="date"
                                    className="input-field" name="next_due_date"
                                    style={{ paddingLeft: 40, cursor: "pointer" }}
                                    value={formData.next_due_date} onChange={handleFormChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        {editingLoan ? "Update Loan Details" : "Create Loan Record"}
                    </button>
                </form>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Loan?">
                <div style={{ padding: '8px 0' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Are you sure you want to delete this loan record? This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                        <button onClick={handleDelete} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-red)', color: 'white' }}>Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

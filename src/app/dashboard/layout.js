"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import {
    HiOutlineHome,
    HiOutlinePlusCircle,
    HiOutlineChartBar,
    HiOutlineCog6Tooth,
    HiOutlineArrowRightOnRectangle,
    HiOutlineBars3,
    HiOutlineXMark,
    HiOutlineTag,
    HiOutlineBanknotes,
    HiOutlineArrowPath,
} from "react-icons/hi2";
import Modal from "@/components/Modal";
import ExpenseForm from "@/components/ExpenseForm";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: HiOutlineHome },
    { href: "/dashboard/expenses", label: "Expenses", icon: HiOutlineBanknotes },
    { href: "/dashboard/expenses/recurring", label: "Recurring", icon: HiOutlineArrowPath },
    { href: "/dashboard/categories", label: "Categories", icon: HiOutlineTag },
    { href: "/dashboard/reports", label: "Reports", icon: HiOutlineChartBar },
    { href: "/dashboard/settings", label: "Settings", icon: HiOutlineCog6Tooth },
];

export default function DashboardLayout({ children }) {
    const { user, profile, initialize, initialized, signOut } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        initialize();
        setMounted(true);
    }, [initialize]);

    useEffect(() => {
        if (initialized && !user) {
            router.push("/auth/signin");
        }
    }, [initialized, user, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push("/");
    };

    if (!mounted || !initialized || !user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--bg-primary)",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #00e5a0, #00c98a)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 20,
                            margin: "0 auto 16px",
                            animation: "pulse-glow 2s infinite",
                        }}
                    >
                        💸
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 40,
                    }}
                    className="animate-fade-in"
                />
            )}

            {/* Sidebar */}
            <aside
                style={{
                    width: 260,
                    background: "var(--bg-secondary)",
                    borderRight: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    position: "fixed",
                    top: 0,
                    bottom: 0,
                    left: sidebarOpen ? 0 : -260,
                    zIndex: 50,
                    transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
                }}
                className="sidebar-desktop"
            >
                {/* Logo */}
                <div
                    style={{
                        padding: "20px 20px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: "linear-gradient(135deg, #00e5a0, #00c98a)",
                                display: "grid",
                                placeItems: "center",
                                fontSize: 16,
                                boxShadow: "0 0 16px rgba(0,229,160,0.25)",
                            }}
                        >
                            💸
                        </div>
                        <span
                            style={{
                                fontSize: 17,
                                fontWeight: 800,
                                background: "linear-gradient(90deg, #00e5a0, #b3fff1)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            VestaLedger
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="sidebar-close-btn"
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            display: "none",
                        }}
                    >
                        <HiOutlineXMark size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                        }}
                    >
                        {navItems.map((item) => {
                            const isActive =
                                item.href === "/dashboard"
                                    ? pathname === "/dashboard"
                                    : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        textDecoration: "none",
                                        fontSize: 14,
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? "#00e5a0" : "var(--text-secondary)",
                                        background: isActive
                                            ? "rgba(0,229,160,0.08)"
                                            : "transparent",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <item.icon
                                        size={20}
                                        style={{ color: isActive ? "#00e5a0" : "var(--text-muted)" }}
                                    />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User section */}
                <div
                    style={{
                        padding: "16px 14px",
                        borderTop: "1px solid var(--border)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: "var(--accent-purple-dim)",
                                display: "grid",
                                placeItems: "center",
                                fontSize: 14,
                                fontWeight: 700,
                                color: "var(--accent-purple)",
                            }}
                        >
                            {(profile?.display_name || user.email)?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {profile?.display_name || "User"}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {user.email}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="btn btn-ghost btn-sm"
                        style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            color: "var(--accent-red)",
                        }}
                    >
                        <HiOutlineArrowRightOnRectangle size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main
                style={{
                    flex: 1,
                    marginLeft: 260,
                    minHeight: "100vh",
                    position: "relative",
                }}
                className="main-content"
            >
                {/* Top bar */}
                <header
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 28px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg-primary)",
                        position: "sticky",
                        top: 0,
                        zIndex: 30,
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="mobile-menu-btn"
                        style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                            display: "none",
                        }}
                    >
                        <HiOutlineBars3 size={24} />
                    </button>
                    <div />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn btn-primary btn-sm"
                    >
                        <HiOutlinePlusCircle size={16} />
                        Add Expense
                    </button>
                </header>

                {/* Content */}
                <div style={{ padding: 28, position: "relative", zIndex: 1 }}>
                    {children}
                </div>

                {/* Add Expense Modal */}
                <Modal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title="Add Expense"
                >
                    <ExpenseForm onSuccess={() => {
                        setIsAddModalOpen(false);
                        // We might need to trigger a refresh here if on dashboard or expenses page
                        // The store handles state updates, so views should re-render automatically
                    }} />
                </Modal>
            </main>

            {/* Responsive styles */}
            <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-desktop {
            left: ${sidebarOpen ? "0" : "-260px"} !important;
          }
          .sidebar-close-btn {
            display: block !important;
          }
          .main-content {
            margin-left: 0 !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .sidebar-desktop {
            left: 0 !important;
          }
        }
      `}</style>
        </div>
    );
}

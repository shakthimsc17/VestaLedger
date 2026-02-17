"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { HiOutlineUser, HiOutlineCurrencyDollar, HiOutlineLockClosed } from "react-icons/hi2";

const CURRENCIES = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export default function SettingsPage() {
    const { user, profile, fetchProfile } = useAuthStore();
    const [displayName, setDisplayName] = useState("");
    const [currency, setCurrency] = useState("INR");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || "");
            setCurrency(profile.currency || "INR");
        }
        setMounted(true);
    }, [profile]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    display_name: displayName,
                    currency: currency,
                    updated_at: new Date().toISOString(),
                });


            if (error) throw error;
            await fetchProfile(user.id);
            toast.success("Profile updated!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Manage your account preferences and financial settings
                </p>
            </div>

            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <HiOutlineUser size={20} style={{ color: 'var(--accent)' }} />
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Profile Information</h2>
                </div>
                <form onSubmit={handleUpdateProfile}>
                    <div style={{ marginBottom: 20 }}>
                        <label className="input-label">Display Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label className="input-label">Preferred Currency</label>
                        <select
                            className="input-field"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>

            <div className="card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <HiOutlineLockClosed size={20} style={{ color: 'var(--accent-red)' }} />
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Security</h2>
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--accent-dim)', borderRadius: 8, border: '1px solid var(--accent)', marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: 'var(--accent)', lineHeight: 1.5 }}>
                        To change your password or delete your account, please contact support or use the &quot;Forgot Password&quot; flow during sign-in.
                    </p>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Account connected: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.email}</span>
                </p>
            </div>
        </div>
    );
}

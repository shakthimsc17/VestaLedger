"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";

export default function SignUpPage() {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { signUp, signInWithGoogle } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setSubmitting(true);
        const { error } = await signUp(email, password, displayName);
        setSubmitting(false);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Account created! Check your email to confirm.");
            router.push("/auth/signin");
        }
    };

    const handleGoogle = async () => {
        const { error } = await signInWithGoogle();
        if (error) toast.error(error.message);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                position: "relative",
                zIndex: 1,
            }}
        >
            <div
                className="animate-scale-in"
                style={{
                    width: "100%",
                    maxWidth: 440,
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textDecoration: "none",
                        marginBottom: 36,
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #00e5a0, #00c98a)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 18,
                            boxShadow: "0 0 20px rgba(0,229,160,0.3)",
                        }}
                    >
                        💸
                    </div>
                    <span
                        style={{
                            fontSize: 20,
                            fontWeight: 800,
                            background: "linear-gradient(90deg, #00e5a0, #b3fff1)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        VestaLedger
                    </span>
                </Link>

                {/* Card */}
                <div className="card" style={{ padding: 32 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                        Create your account
                    </h1>
                    <p
                        style={{
                            color: "var(--text-secondary)",
                            fontSize: 14,
                            marginBottom: 28,
                        }}
                    >
                        Start tracking your expenses for free
                    </p>

                    {/* Google Button */}
                    <button
                        type="button"
                        onClick={handleGoogle}
                        className="btn btn-secondary"
                        style={{ width: "100%", marginBottom: 20, padding: "12px 20px" }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            margin: "4px 0 20px",
                        }}
                    >
                        <div
                            style={{ flex: 1, height: 1, background: "var(--border)" }}
                        ></div>
                        <span
                            style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}
                        >
                            or
                        </span>
                        <div
                            style={{ flex: 1, height: 1, background: "var(--border)" }}
                        ></div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label className="input-label" htmlFor="displayName">
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label className="input-label" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label className="input-label" htmlFor="password">
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="input-field"
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        padding: 4,
                                    }}
                                >
                                    {showPassword ? (
                                        <HiOutlineEyeSlash size={18} />
                                    ) : (
                                        <HiOutlineEye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label className="input-label" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input-field"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                            style={{ width: "100%", padding: "12px 20px" }}
                        >
                            {submitting ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <p
                        style={{
                            textAlign: "center",
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            marginTop: 20,
                        }}
                    >
                        Already have an account?{" "}
                        <Link
                            href="/auth/signin"
                            style={{ color: "var(--accent)", textDecoration: "none" }}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

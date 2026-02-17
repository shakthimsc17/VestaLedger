"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import {
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineDevicePhoneMobile,
  HiOutlineBolt,
} from "react-icons/hi2";

const features = [
  {
    icon: HiOutlineCurrencyDollar,
    title: "Expense Tracking",
    desc: "Log expenses in seconds with smart categories and quick-add shortcuts.",
    color: "#00e5a0",
  },
  {
    icon: HiOutlineChartBar,
    title: "Visual Reports",
    desc: "Beautiful charts and insights to understand your spending patterns.",
    color: "#7c6aff",
  },
  {
    icon: HiOutlineSparkles,
    title: "Budget Goals",
    desc: "Set monthly budgets per category and track your progress in real time.",
    color: "#ff9f43",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Secure & Private",
    desc: "Your data is encrypted and protected with row-level security.",
    color: "#4da6ff",
  },
  {
    icon: HiOutlineDevicePhoneMobile,
    title: "Works Everywhere",
    desc: "Responsive design that works perfectly on desktop, tablet, and mobile.",
    color: "#ff6b6b",
  },
  {
    icon: HiOutlineBolt,
    title: "Lightning Fast",
    desc: "Built with Next.js for blazing fast performance and instant page loads.",
    color: "#ffd166",
  },
];

export default function LandingPage() {
  const { user, initialize, initialized } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  useEffect(() => {
    if (initialized && user) {
      router.push("/dashboard");
    }
  }, [initialized, user, router]);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/auth/signin" className="btn btn-ghost">
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 32px 60px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="badge badge-green animate-fade-in"
          style={{ marginBottom: 24 }}
        >
          ✨ Free forever · No credit card required
        </div>
        <h1
          className="animate-slide-up"
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
            maxWidth: 700,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Track Every Penny.
          <br />
          <span className="gradient-text">Spend Smarter.</span>
        </h1>
        <p
          className="animate-slide-up"
          style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            maxWidth: 540,
            margin: "0 auto 40px",
            lineHeight: 1.6,
            animationDelay: "0.1s",
          }}
        >
          A beautiful, free expense tracker that helps you understand where your
          money goes. Set budgets, track habits, and save more.
        </p>
        <div
          className="animate-slide-up"
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
            animationDelay: "0.2s",
          }}
        >
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            🚀 Start Tracking Free
          </Link>
          <Link href="#features" className="btn btn-secondary btn-lg">
            Learn More
          </Link>
        </div>

        {/* Stats */}
        <div
          className="animate-slide-up"
          style={{
            display: "flex",
            gap: 32,
            justifyContent: "center",
            marginTop: 60,
            flexWrap: "wrap",
            animationDelay: "0.3s",
          }}
        >
          {[
            { num: "$0", label: "Cost", color: "#00e5a0" },
            { num: "100%", label: "Private", color: "#7c6aff" },
            { num: "∞", label: "Expenses", color: "#ff9f43" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: s.color,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 32px 100px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 48,
          }}
        >
          Everything you need to{" "}
          <span className="gradient-text">take control</span>
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="card card-glow animate-slide-up"
              style={{
                padding: 28,
                animationDelay: `${i * 0.1}s`,
                animationFillMode: "both",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${f.color}15`,
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 16,
                }}
              >
                <f.icon style={{ fontSize: 22, color: f.color }} />
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "28px 32px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        VestaLedger · Free Expense Tracker · Built with ❤️
      </footer>
    </div>
  );
}

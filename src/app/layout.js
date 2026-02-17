import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "VestaLedger — Smart Expense Tracker",
  description: "Track your spending, set budgets, and gain insights into your financial habits. A free micro SaaS expense tracker.",
  keywords: ["expense tracker", "budget", "finance", "spending", "money management"],
  openGraph: {
    title: "VestaLedger — Smart Expense Tracker",
    description: "Track your spending, set budgets, and gain insights into your financial habits.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#111524',
              color: '#e8ecf4',
              border: '1px solid #1e2540',
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#00e5a0',
                secondary: '#06080d',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff6b6b',
                secondary: '#06080d',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

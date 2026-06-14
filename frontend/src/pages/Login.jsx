import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { SegmentIQLogo } from "../components/Logo";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";

/* ── Brand panel feature highlights ──────────────────── */
const FEATURES = [
  {
    icon: Users,
    title: "Unified Customer View",
    desc: "360° customer profiles with full interaction history.",
  },
  {
    icon: BarChart3,
    title: "AI-Powered Segments",
    desc: "Intelligent segmentation that adapts to your data.",
  },
  {
    icon: Zap,
    title: "Campaign Automation",
    desc: "Launch multi-channel campaigns in minutes.",
  },
];

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      toast.error("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);

      toast.success("Welcome back! Redirecting…", { duration: 1500 });

      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        "Invalid credentials. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
            fontSize: "13.5px",
            border: "1px solid var(--color-surface-border)",
            boxShadow: "var(--shadow-panel)",
          },
        }}
      />

      <div style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "var(--font-sans)",
      }}>

        {/* ── Left Brand Panel ───────────────────────── */}
        <div style={{
          display: "none",
          flex: "0 0 420px",
          background: "#f1f5f9",
          borderRight: "1px solid #e2e8f0",
          padding: "48px 40px",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
          className="login-brand-panel"
        >
          {/* Decorative subtle circles */}
          <div style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.04)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            bottom: "80px",
            left: "-40px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.03)",
            pointerEvents: "none",
          }} />

          {/* Logo mark */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
              }}>
                <SegmentIQLogo size={36} />
              </div>
              <div>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}>SegmentIQ</p>
                <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Enterprise CRM</p>
              </div>
            </div>

            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "26px",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.3,
              marginBottom: "12px",
            }}>
              Your customers,<br />
              <span style={{ color: "#2563eb" }}>intelligently managed.</span>
            </h2>
            <p style={{
              fontSize: "13.5px",
              color: "#4b5168",
              lineHeight: 1.7,
              marginBottom: "40px",
            }}>
              The enterprise CRM built for modern revenue teams. Segment smarter, engage better, and close faster.
            </p>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(99,102,241,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color="#6366f1" />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1a1d2e", margin: "0 0 2px" }}>{title}</p>
                    <p style={{ fontSize: "12px", color: "#8891a8", margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom trust note */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "32px",
          }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span style={{ fontSize: "11.5px", color: "#4b5168" }}>
              SOC 2 compliant · 256-bit encryption · GDPR ready
            </span>
          </div>
        </div>

        {/* ── Right: Login Form ──────────────────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          padding: "32px 24px",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "380px",
          }}>
            {/* Mobile logo (only shows when brand panel is hidden) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "32px",
            }}
              className="mobile-logo"
            >
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <SegmentIQLogo size={32} />
              </div>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 800,
                color: "#1a1d2e",
              }}>SegmentIQ</span>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: "28px" }}>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 800,
                color: "#1a1d2e",
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}>
                Sign in to your account
              </h1>
              <p style={{ fontSize: "13px", color: "#8891a8", margin: 0 }}>
                Enter your credentials to access your workspace.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} noValidate>
              <div style={{ marginBottom: "16px" }}>
                <label className="crm-label" htmlFor="login-email">
                  Email address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={14}
                    color="var(--color-text-muted)"
                    style={{
                      position: "absolute",
                      left: "11px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="crm-input"
                    style={{ paddingLeft: "34px" }}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label className="crm-label" htmlFor="login-password">
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={14}
                    color="var(--color-text-muted)"
                    style={{
                      position: "absolute",
                      left: "11px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="crm-input"
                    style={{ paddingLeft: "34px", paddingRight: "40px" }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                      fontSize: "11px",
                      padding: "2px 4px",
                    }}
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div style={{ textAlign: "right", marginBottom: "20px" }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#6366f1",
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="crm-btn-primary"
                style={{ width: "100%", padding: "11px", fontSize: "14px" }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      width: "14px", height: "14px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }} />
                    Signing in…
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Sign In <ArrowRight size={14} />
                  </span>
                )}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>

            {/* ── SSO Divider ──────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 16px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--color-surface-border)" }} />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>or continue with</span>
              <div style={{ flex: 1, height: "1px", background: "var(--color-surface-border)" }} />
            </div>

            {/* ── Google SSO Button ────────────────── */}
            <button
              type="button"
              onClick={() => toast.info("Google OAuth — backend integration ready", { icon: "🔐" })}
              style={{
                width: "100%", padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(218,220,224,0.80)",
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                cursor: "pointer",
                transition: "all 0.18s ease",
                marginBottom: "8px",
                fontSize: "13.5px", fontWeight: 600, color: "#3c4043",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.98)"; e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.10)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.06)"; }}
            >
              {/* Google G Logo */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            {/* ── LinkedIn SSO Button ───────────────── */}
            <button
              type="button"
              onClick={() => toast.info("LinkedIn OAuth — backend integration ready", { icon: "💼" })}
              style={{
                width: "100%", padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(0,119,181,0.25)",
                boxShadow: "0 1px 6px rgba(0,119,181,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                cursor: "pointer",
                transition: "all 0.18s ease",
                marginBottom: "20px",
                fontSize: "13.5px", fontWeight: 600, color: "#0077B5",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,247,255,0.98)"; e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,119,181,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,119,181,0.06)"; }}
            >
              {/* LinkedIn Logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077B5">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Continue with LinkedIn
            </button>

            {/* Sign up link */}
            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
              Don't have an account?{" "}
              <Link
                to="/signup"
                style={{
                  color: "#6366f1",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Create one free →
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* Responsive: show brand panel on md+ screens */}
      <style>{`
        @media (min-width: 768px) {
          .login-brand-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </>
  );
}

export default Login;
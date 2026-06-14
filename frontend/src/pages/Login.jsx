import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { SegmentIQLogo } from "../components/Logo";
import { PrismLogo } from "../components/Logo";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3,
  Zap,
  X,
  ChevronRight,
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

/* ── Prism AI Greeting Widget ─────────────────────────── */
const PRISM_TIPS = [
  "Hi! I'm Prism ✨ — SegmentIQ's AI assistant.",
  "Upload a CSV to auto-analyze your customer segments!",
  "I can generate campaign ideas, revenue insights & more.",
  "Ask me anything about your CRM data, anytime.",
  "Get started — sign in or create a free account! 🚀",
];

function PrismGreet() {
  const [visible, setVisible] = useState(true);
  const [tipIdx, setTipIdx]   = useState(0);
  const [fade, setFade]       = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIdx(i => (i + 1) % PRISM_TIPS.length);
        setFade(true);
      }, 350);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px",
      zIndex: 200, maxWidth: "260px",
      animation: "prismGreetIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      <style>{`
        @keyframes prismGreetIn { from { opacity:0; transform:translateY(30px) scale(0.88); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes tipFade { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Chat bubble */}
      <div style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(199,210,254,0.60)",
        borderRadius: "16px 16px 4px 16px",
        padding: "14px 16px",
        boxShadow: "0 16px 48px rgba(99,102,241,0.18), 0 4px 12px rgba(15,23,42,0.08)",
        marginBottom: "8px",
        position: "relative",
      }}>
        <button onClick={() => setVisible(false)} style={{
          position: "absolute", top: "8px", right: "8px",
          background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", padding: "2px", borderRadius: "4px",
        }}>
          <X size={11} />
        </button>
        <p style={{
          fontSize: "12.5px", lineHeight: 1.5, color: "#1e293b",
          margin: 0, paddingRight: "16px",
          opacity: fade ? 1 : 0,
          transition: "opacity 0.30s ease",
          minHeight: "36px",
        }}>
          {PRISM_TIPS[tipIdx]}
        </p>
        <div style={{
          display: "flex", gap: "3px", marginTop: "8px", justifyContent: "flex-end",
        }}>
          {PRISM_TIPS.map((_, i) => (
            <div key={i} style={{
              width: i === tipIdx ? 16 : 5, height: 5, borderRadius: 99,
              background: i === tipIdx ? "#6366f1" : "rgba(199,210,254,0.60)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>
      </div>

      {/* Avatar row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Prism AI</p>
          <p style={{ fontSize: "9.5px", color: "#6366f1", margin: 0, fontWeight: 600 }}>● Online</p>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: "11px",
          background: "linear-gradient(135deg,#6366f1,#818cf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
        }}>
          <PrismLogo size={20} />
        </div>
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      await loginWithGoogle(response.credential);
      toast.success("Welcome back! Redirecting…", { duration: 1500 });
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (typeof window.google !== "undefined") {
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const resolvedClientId = (googleClientId && googleClientId !== "undefined")
          ? googleClientId
          : "662384752311-3b47hrvdcaf7vc38utiogrps4dt3v43a.apps.googleusercontent.com";

        window.google.accounts.id.initialize({
          client_id: resolvedClientId,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: 380, shape: "rectangular" }
        );
      }
    };
    
    if (typeof window.google === "undefined") {
      const interval = setInterval(() => {
        if (typeof window.google !== "undefined") {
          initGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      initGoogle();
    }
  }, [loginWithGoogle]);

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
                  onClick={() => {
                    const emailInput = prompt("Enter your registered email address to receive reset instructions:");
                    if (emailInput && emailInput.trim()) {
                      toast.success("Password reset instructions sent to " + emailInput.trim(), { icon: "📧" });
                    }
                  }}
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", width: "100%", minHeight: "44px" }}>
              <div id="google-signin-btn" style={{ width: "100%" }}></div>
            </div>

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

      <PrismGreet />
    </>
  );
}

export default Login;
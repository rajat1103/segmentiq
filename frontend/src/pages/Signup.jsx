import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { SegmentIQLogo } from "../components/Logo";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

/* ── Password strength helper ─────────────────────────── */
function getStrength(pw) {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Weak",   color: "#ef4444" };
  if (score === 2) return { level: 2, label: "Fair",   color: "#f59e0b" };
  if (score === 3) return { level: 3, label: "Good",   color: "#3b82f6" };
  return              { level: 4, label: "Strong", color: "#10b981" };
}

function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setLoading(true);
      await loginWithGoogle(response.credential);
      toast.success("Account created and signed in! Redirecting…", { duration: 1500 });
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
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-btn"),
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

  const strength = getStrength(password);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the terms to continue.");
      return;
    }

    try {
      setLoading(true);
      await signup(name, email, password);
      toast.success("Account created! Please sign in.", { duration: 2500 });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        "Signup failed. Please try again.";
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
        <div
          className="signup-brand-panel"
          style={{
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
        >
          {/* Decorative subtle blobs */}
          <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.04)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            bottom: "100px",
            left: "-30px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.03)",
            pointerEvents: "none",
          }} />

          <div>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.15)",
              }}>
                <Sparkles size={18} color="#fff" />
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
              Start for free,<br />
              <span style={{ color: "#2563eb" }}>scale as you grow.</span>
            </h2>
            <p style={{
              fontSize: "13.5px",
              color: "#4b5168",
              lineHeight: 1.7,
              marginBottom: "36px",
            }}>
              Join thousands of revenue teams already using SegmentIQ to understand their customers better and grow faster.
            </p>

            {/* Value props */}
            {[
              "No credit card required to start",
              "Full access to all core CRM features",
              "AI-powered segmentation included",
              "Onboarding support from day one",
            ].map((item) => (
              <div key={item} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}>
                <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#4b5168" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "12px",
            background: "rgba(16,185,129,0.07)",
            borderRadius: "8px",
            border: "1px solid rgba(16,185,129,0.15)",
            marginTop: "24px",
          }}>
            <ShieldCheck size={15} color="#10b981" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "11.5px", color: "#4b5168" }}>
              Your data is encrypted end-to-end and never shared.
            </span>
          </div>
        </div>

        {/* ── Right: Signup Form ─────────────────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          padding: "32px 24px",
        }}>
          <div style={{ width: "100%", maxWidth: "380px" }}>

            {/* Mobile logo */}
            <div
              className="mobile-logo-signup"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "32px",
              }}
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
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 800,
                color: "#1a1d2e",
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}>
                Create your account
              </h1>
              <p style={{ fontSize: "13px", color: "#8891a8", margin: 0 }}>
                Get started with SegmentIQ CRM today.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} noValidate>

              {/* Name */}
              <div style={{ marginBottom: "14px" }}>
                <label className="crm-label" htmlFor="signup-name">Full name</label>
                <div style={{ position: "relative" }}>
                  <User
                    size={14}
                    color="var(--color-text-muted)"
                    style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="crm-input"
                    style={{ paddingLeft: "34px" }}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: "14px" }}>
                <label className="crm-label" htmlFor="signup-email">Work email</label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={14}
                    color="var(--color-text-muted)"
                    style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                  <input
                    id="signup-email"
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

              {/* Password + strength meter */}
              <div style={{ marginBottom: "16px" }}>
                <label className="crm-label" htmlFor="signup-password">Password</label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={14}
                    color="var(--color-text-muted)"
                    style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                  <input
                    id="signup-password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="crm-input"
                    style={{ paddingLeft: "34px", paddingRight: "44px" }}
                    autoComplete="new-password"
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

                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                          flex: 1,
                          height: "3px",
                          borderRadius: "99px",
                          background: i <= strength.level ? strength.color : "#e8eaf2",
                          transition: "background 0.2s ease",
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: "11px", color: strength.color, margin: 0, fontWeight: 500 }}>
                      {strength.label} password
                    </p>
                  </div>
                )}
              </div>

              {/* Terms checkbox */}
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "9px",
                marginBottom: "20px",
              }}>
                <input
                  id="signup-terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    marginTop: "2px",
                    accentColor: "#6366f1",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <label
                  htmlFor="signup-terms"
                  style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5, cursor: "pointer" }}
                >
                  I agree to the{" "}
                  <button type="button" style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, fontSize: "12px", cursor: "pointer", padding: 0 }}>
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button type="button" style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, fontSize: "12px", cursor: "pointer", padding: 0 }}>
                    Privacy Policy
                  </button>
                </label>
              </div>

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="crm-btn-primary"
                style={{
                  width: "100%",
                  padding: "11px",
                  fontSize: "14px",
                  background: agreed ? "var(--color-brand-500)" : "#a5b4fc",
                  borderColor: agreed ? "var(--color-brand-600)" : "#a5b4fc",
                }}
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
                    Creating account…
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Create account <ArrowRight size={14} />
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", width: "100%", minHeight: "44px" }}>
              <div id="google-signup-btn" style={{ width: "100%" }}></div>
            </div>

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

            {/* Sign in link */}
            <p style={{
              textAlign: "center",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              margin: "20px 0 0",
            }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
                Sign in →
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* Responsive */}
      <style>{`
        @media (min-width: 768px) {
          .signup-brand-panel { display: flex !important; }
          .mobile-logo-signup { display: none !important; }
        }
      `}</style>
    </>
  );
}

export default Signup;
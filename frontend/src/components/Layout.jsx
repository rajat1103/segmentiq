import { useState, useEffect, useRef } from "react";
import { Sparkles, Database, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getStats } from "../services/api";

function BackgroundOrbs() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}>
      <div className="orb orb-pink"   style={{ top: "-5%",  left: "8%",  width: "480px", height: "480px", animationDelay: "0s"   }} />
      <div className="orb orb-sky"    style={{ top: "35%",  left: "60%", width: "520px", height: "520px", animationDelay: "1.5s" }} />
      <div className="orb orb-violet" style={{ top: "65%",  left: "5%",  width: "420px", height: "420px", animationDelay: "3s"   }} />
      <div className="orb orb-mint"   style={{ top: "10%",  left: "75%", width: "460px", height: "460px", animationDelay: "0.8s" }} />
      <div className="orb orb-indigo" style={{ top: "80%",  left: "50%", width: "380px", height: "380px", animationDelay: "2.2s" }} />
    </div>
  );
}

function Layout({ children }) {
  const isDark = document.documentElement.classList.contains("dark");
  const bgGradient = isDark
    ? "linear-gradient(135deg, #0d1117 0%, #090d16 50%, #0a0f1e 100%)"
    : "linear-gradient(135deg, #fce7f3 0%, #e0f2fe 28%, #f0fdf4 56%, #ede9fe 100%)";

  const [showWelcome, setShowWelcome] = useState(false);
  const [modalTilt, setModalTilt] = useState({ x: 0, y: 0 });
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [seedError, setSeedError] = useState(null);
  const modalRef = useRef(null);

  const handleModalMouseMove = (e) => {
    if (!modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -6;
    const tiltY = (x / (rect.width / 2)) * 6;
    setModalTilt({ x: tiltX, y: tiltY });
  };

  const handleModalMouseLeave = () => {
    setModalTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const dismissed = localStorage.getItem("onboarding_dismissed") === "true";

      if (dismissed) return;

      try {
        const res = await getStats();
        if (!res.data || res.data.total_customers === 0) {
          setShowWelcome(true);
        }
      } catch (err) {
        console.error("Layout onboarding check failure:", err);
        setShowWelcome(true);
      }
    };

    checkOnboarding();
  }, []);

  const handleStartFresh = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setShowWelcome(false);
  };

  const handleSeedRealData = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      const { seedDatabase } = await import("../services/api");
      await seedDatabase();
      setSeedSuccess(true);
      localStorage.setItem("onboarding_dismissed", "true");
      setTimeout(() => {
        setShowWelcome(false);
        window.location.reload();
      }, 1800);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Seed failed. Is the backend running?";
      setSeedError(msg);
    } finally {
      setSeeding(false);
    }
  };

  const getUserFirstName = () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(window.atob(base64));
        const email = payload?.sub || "";
        const prefix = email.split("@")[0];
        return prefix.split(/[._\-]/)[0].charAt(0).toUpperCase() + prefix.split(/[._\-]/)[0].slice(1);
      }
    } catch (e) { /* ignore */ }
    return "there";
  };

  const firstName = getUserFirstName();

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: bgGradient,
      backgroundAttachment: "fixed",
      overflow: "hidden",
      position: "relative",
      transition: "background 0.4s ease",
    }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes modalEntrance {
          from { opacity: 0; transform: scale(0.96) translate3d(0, 12px, 0); }
          to { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
        }
        @keyframes laserScan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.3; }
          100% { top: 0%; opacity: 0.8; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-gradient {
          background: linear-gradient(135deg, #6366f1, #d946ef);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px 28px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99,102,241,0.40);
        }
        .btn-gradient:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(217, 70, 239, 0.50);
        }
      `}</style>

      {/* Dynamic Background Mesh Orbs */}
      <BackgroundOrbs />


      {/* Onboarding Welcome Modal */}
      {showWelcome && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(15, 23, 42, 0.30)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <div
            ref={modalRef}
            onMouseMove={handleModalMouseMove}
            onMouseLeave={handleModalMouseLeave}
            style={{
              width: "100%",
              maxWidth: "460px",
              background: isDark ? "rgba(10, 10, 25, 0.75)" : "rgba(255, 255, 255, 0.55)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: isDark ? "1px solid rgba(99,102,241,0.30)" : "1px solid rgba(99,102,241,0.25)",
              borderRadius: "24px",
              boxShadow: isDark
                ? "0 30px 80px rgba(0,0,0,0.85), 0 0 30px rgba(99, 102, 241, 0.20)"
                : "0 30px 70px rgba(99, 102, 241, 0.15), 0 0 20px rgba(99, 102, 241, 0.10)",
              padding: "40px",
              margin: "20px",
              textAlign: "center",
              transform: `perspective(1000px) rotateX(${modalTilt.x}deg) rotateY(${modalTilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
              transition: "transform 0.1s ease-out, box-shadow 0.3s ease",
              position: "relative",
              overflow: "hidden",
              animation: "modalEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Holographic scanner line */}
            <div style={{
              position: "absolute",
              left: 0,
              width: "100%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, #ec4899, #6366f1, #ec4899, transparent)",
              boxShadow: "0 0 8px #6366f1, 0 0 16px #ec4899",
              pointerEvents: "none",
              animation: "laserScan 3s infinite linear",
            }} />

            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6366f1, #d946ef)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 20px rgba(99, 102, 241, 0.25)",
            }}>
              <Sparkles size={26} color="white" />
            </div>

            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 800,
              color: isDark ? "#fff" : "#1a1d2e",
              margin: "0 0 10px",
              letterSpacing: "-0.02em",
            }}>
              Welcome to SegmentIQ, {firstName}!
            </h2>

            <p style={{
              fontSize: "13.5px",
              color: isDark ? "#94a3b8" : "#4b5168",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}>
              Your workspace is ready. Seed sample records or initialize a fresh live workspace before opening the analytics dashboard.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Option 1: Seed Real Data via Backend */}
              <button
                onClick={handleSeedRealData}
                disabled={seeding || seedSuccess}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  background: seedSuccess
                    ? "linear-gradient(135deg, #059669, #10b981)"
                    : "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: seeding || seedSuccess ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                  opacity: seeding ? 0.85 : 1,
                  transition: "all 0.25s ease",
                }}
              >
                {seedSuccess ? (
                  <><CheckCircle2 size={14} /> Data Seeded! Loading…</>
                ) : seeding ? (
                  <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Seeding Database…</>
                ) : (
                  <><Database size={14} /> Load Sample Data (Backend)</>
                )}
              </button>

              {/* Seed error message */}
              {seedError && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: "7px",
                  padding: "9px 12px", borderRadius: "8px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                }}>
                  <AlertCircle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "11.5px", color: "#ef4444", lineHeight: 1.4 }}>{seedError}</span>
                </div>
              )}

              {/* Option 3: Start empty */}
              <button
                onClick={handleStartFresh}
                style={{
                  width: "100%",
                  padding: "9px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "transparent",
                  color: isDark ? "#64748b" : "#94a3b8",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = isDark ? "#94a3b8" : "#64748b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#64748b" : "#94a3b8"; }}
              >
                Start with empty workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Sidebar */}
      <div style={{ position: "relative", zIndex: 20, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main Content Column */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
        position: "relative",
        zIndex: 10,
      }}>
        {/* Sticky Topbar */}
        <Topbar />

        {/* Scrollable Page Content */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
        }}>
          <div className="crm-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PlasmaGlobe from "../components/PlasmaGlobe";
import SciFiGlobe from "../components/SciFiGlobe";
import {
  Sparkles,
  LogOut,
  ArrowRight,
  ArrowDown,
  Loader2,
  Globe,
  Compass,
} from "lucide-react";
import { Toaster } from "react-hot-toast";

/* ─── Moving Starfield Background Canvas Component ─────── */
function StarfieldBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    const stars = [];
    const starCount = 180;
    const speed = 2.0;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
      });
    }

    const draw = () => {
      ctx.fillStyle = "rgba(2, 2, 5, 0.28)"; // Space black trail effect
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < starCount; i++) {
        const star = stars[i];
        star.z -= speed;

        if (star.z <= 0) {
          star.z = width;
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
        }

        const sx = (star.x / star.z) * (width / 2) + width / 2;
        const sy = (star.y / star.z) * (height / 2) + height / 2;

        if (sx < 0 || sx > width || sy < 0 || sy > height) {
          continue;
        }

        const size = (1 - star.z / width) * 2.8;
        const alpha = 1 - star.z / width;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

/* ─── Main Onboarding Page ──────────────────────────────── */
export default function Welcome() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(1); // 1: Holographic Sync, 2: Operational Network Map

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else {
        const completed = localStorage.getItem(`onboarding_completed_${user?.email}`) === "true";
        if (completed) {
          navigate("/command-center");
        }
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleEnterWorkspace = () => {
    if (user?.email) {
      localStorage.setItem(`onboarding_completed_${user.email}`, "true");
      localStorage.setItem("onboarding_dismissed", "true");
      navigate("/command-center");
    }
  };

  if (loading || !user) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#020205"
      }}>
        <Loader2 size={40} className="animate-spin" color="#6366f1" />
      </div>
    );
  }

  const firstName = user.name ? user.name.split(" ")[0] : "Cohort Designer";

  return (
    <div style={{
      background: "#020205",
      color: "white",
      minHeight: "100vh",
      position: "relative",
      fontFamily: "var(--font-sans)",
      overflow: "hidden",
      boxSizing: "border-box"
    }}>
      <Toaster position="top-right" />
      <StarfieldBackground />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glowPulse {
          0%, 100% { border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 0 20px rgba(99, 102, 241, 0.15); }
          50% { border-color: rgba(236, 72, 153, 0.6); box-shadow: 0 0 35px rgba(236, 72, 153, 0.35); }
        }
        @keyframes laserScan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.3; }
          100% { top: 0%; opacity: 0.8; }
        }
        .laser-scanner {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #ec4899, #6366f1, #ec4899, transparent);
          box-shadow: 0 0 10px #6366f1, 0 0 20px #ec4899;
          pointer-events: none;
          animation: laserScan 2.5s infinite linear;
        }
        .btn-gradient {
          background: linear-gradient(135deg, #6366f1, #d946ef);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px 28px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.22s ease;
          box-shadow: 0 4px 14px rgba(99,102,241,0.40);
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(217, 70, 239, 0.50);
        }
        .glass-onboarding-panel {
          background: rgba(10, 10, 25, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 24px;
          padding: 36px;
          width: 100%;
          max-width: 640px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.85);
          animation: glowPulse 5s infinite ease-in-out;
          position: relative;
        }
        .full-slide {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 24px;
          box-sizing: border-box;
          position: relative;
          z-index: 10;
        }
      `}</style>

      {/* Global Exit */}
      <button
        onClick={logout}
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "99px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.04)",
          color: "#94a3b8",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          transition: "all 0.2s",
          zIndex: 30,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
      >
        <LogOut size={13} /> Exit Portal
      </button>

      {/* Vertical Slider Wrapper */}
      <div style={{
        transform: `translateY(${(slide - 1) * -100}vh)`,
        transition: "transform 0.8s cubic-bezier(0.77, 0, 0.175, 1)",
        height: "200vh",
      }}>
        {/* SLIDE 1: HOLOGRAPHIC TELEMETRY SYNC */}
        <div className="full-slide">
          <div className="glass-onboarding-panel" style={{ position: "relative" }}>
            <div className="laser-scanner" />
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center" }}>
              <div>
                <span style={{
                  fontSize: "10px", fontWeight: 800, color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "4px 10px", borderRadius: "99px",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "inline-block", marginBottom: "10px"
                }}>
                  System Telemetry Ready
                </span>
                <h2 style={{ fontSize: "26px", fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.02em" }}>
                  Holographic Telemetry Sync
                </h2>
                <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: "4px 0 0" }}>
                  Welcome to SegmentIQ, {firstName}. Connecting active node pipelines.
                </p>
              </div>

              {/* 3D Plasma Globe telemetric scanner container */}
              <div style={{
                position: "relative",
                height: "240px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "inset 0 0 30px rgba(99, 102, 241, 0.10)",
              }}>
                <PlasmaGlobe height="240px" />
                <div style={{
                  position: "absolute", bottom: "14px", left: "14px",
                  display: "flex", flexDirection: "column", gap: "4px",
                  textAlign: "left",
                }}>
                  <p style={{ fontSize: "8.5px", color: "#8891a8", fontFamily: "var(--font-mono)", margin: 0 }}>NODE STATUS: READY</p>
                  <p style={{ fontSize: "8.5px", color: "#10b981", fontFamily: "var(--font-mono)", margin: 0 }}>TEL NETWORKS: ONLINE</p>
                </div>
              </div>

              <div style={{
                padding: "14px 18px", borderRadius: "12px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "left",
              }}>
                <blockquote style={{
                  margin: 0, fontStyle: "italic", fontSize: "12.5px",
                  color: "#cbd5e1", lineHeight: 1.6, fontWeight: 500,
                }}>
                  "Data without context is just noise. SegmentIQ bridges the gap between regional telemetry and automated campaign output. Your workspace environment is now fully synchronized."
                </blockquote>
                <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#a5b4fc", margin: "6px 0 0", textAlign: "right" }}>
                  — Rishabh Raj, Founder & Architect
                </p>
              </div>

              <button
                onClick={() => setSlide(2)}
                className="btn-gradient"
                style={{ width: "100%", padding: "14px", fontSize: "14px" }}
              >
                View Operational Network Map <ArrowDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* SLIDE 2: OPERATIONAL NETWORK & ROTATING SCI-FI GLOBE */}
        <div className="full-slide" style={{ background: "transparent" }}>
          <div className="glass-onboarding-panel" style={{ maxWidth: "860px", width: "90%", padding: "30px", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: "10px", fontWeight: 800, color: "#3b82f6",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  background: "rgba(59, 130, 246, 0.1)",
                  padding: "4px 10px", borderRadius: "99px",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "inline-block", marginBottom: "8px"
                }}>
                  Operational Core Locations
                </span>
                <h2 style={{ fontSize: "24px", fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.01em" }}>
                  Operational Network & Pipeline Expansion
                </h2>
                <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: "4px 0 0" }}>
                  Explore active regions and coordinate sync vectors before entering the workspace.
                </p>
              </div>

              {/* SciFi Globe integration */}
              <div style={{
                height: "360px",
                width: "100%",
                background: "rgba(255, 255, 255, 0.01)",
                border: "1px solid rgba(255, 255, 255, 0.04)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.8)",
                position: "relative"
              }}>
                <SciFiGlobe />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                <button
                  onClick={() => setSlide(1)}
                  style={{
                    background: "transparent", border: "none", color: "#a5b4fc",
                    fontSize: "13px", cursor: "pointer", fontWeight: 600,
                  }}
                >
                  ← Back to Telemetry Sync
                </button>

                <button
                  onClick={handleEnterWorkspace}
                  className="btn-gradient"
                  style={{ padding: "12px 32px" }}
                >
                  Enter CRM Command Center <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

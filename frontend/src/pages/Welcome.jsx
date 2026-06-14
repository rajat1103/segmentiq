import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PlasmaGlobe from "../components/PlasmaGlobe";
import {
  Sparkles,
  LogOut,
  Upload,
  FileSpreadsheet,
  Check,
  ArrowRight,
  Loader2,
  Database,
  Server,
  Play,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { createCustomer, resetDatabase, seedDatabase, importCustomersBulk } from "../services/api";

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

/* ─── Main Onboarding Component ────────────────────────── */
export default function Welcome() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Hello, 2: Setup Data, 3: Live Globe Telemetry
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dataOption, setDataOption] = useState(null); // 'csv' or 'fresh'
  
  // CSV Importer States
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  
  // Loader status for other choices
  const [seedingLoader, setSeedingLoader] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else {
        const completed = localStorage.getItem(`onboarding_completed_${user?.email}`) === "true";
        if (completed && step !== 3) {
          navigate("/dashboard");
        }
      }
    }
  }, [isAuthenticated, user, loading, navigate, step]);

  // Handle card 3D tilt coordinates
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // 3D rotation thresholds
    const tiltX = (y / (rect.height / 2)) * -6;
    const tiltY = (x / (rect.width / 2)) * 6;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // CSV Drag and drop / select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleCSVFile(file);
  };

  const handleCSVFile = (file) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please select a valid CSV spreadsheet.");
      return;
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = parseCSVText(text);
      if (rows.length === 0) {
        toast.error("No valid records found in this CSV.");
      } else {
        setParsedRows(rows);
        toast.success(`Successfully loaded ${rows.length} rows from CSV!`);
      }
    };
    reader.readAsText(file);
  };

  // Basic CSV parsing engine
  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      // Handles quoted strings containing commas
      const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
      const row = matches.map((val) => val.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      data.push(obj);
    }
    return data;
  };

  // Map header fields dynamically to backend models
  const mapCSVRowToCustomer = (row) => {
    const findValue = (keys) => {
      const foundKey = Object.keys(row).find((k) => keys.some((key) => k.includes(key)));
      return foundKey ? row[foundKey] : "";
    };

    const name = findValue(["name"]) || "Unknown Customer";
    const email = findValue(["email", "mail"]) || `${name.toLowerCase().replace(/\s+/g, ".")}@segmentiq-user.in`;
    const phone = findValue(["phone", "mobile", "tel"]) || "+91 99000-00000";
    const cityVal = findValue(["city", "town", "loc"]) || "Bangalore";
    const cities = ["Bangalore", "Delhi", "Chennai", "Pune", "Hyderabad", "Mumbai"];
    let city = cities.find((c) => c.toLowerCase() === cityVal.toLowerCase()) || "Bangalore";

    const genderVal = findValue(["gender", "sex"]) || "Male";
    const gender = ["Male", "Female", "Other"].find((g) => g.toLowerCase() === genderVal.toLowerCase()) || "Male";

    const age = parseInt(findValue(["age"]), 10) || 28;
    const total_orders = parseInt(findValue(["order", "purchase"]), 10) || 0;
    const total_spend = parseFloat(findValue(["spent", "spend", "revenue", "amount"])) || 0.0;

    return {
      name,
      email,
      phone,
      city,
      gender,
      age,
      total_orders,
      total_spend,
    };
  };

  // Execute CSV customer insertions
  const executeCSVImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setImportTotal(1);
    setImportProgress(0);

    try {
      const models = parsedRows.map((row) => {
        const mapped = mapCSVRowToCustomer(row);
        return {
          name: mapped.name,
          email: mapped.email,
          phone: mapped.phone,
          city: mapped.city,
          gender: mapped.gender,
          age: mapped.age,
          total_spent: mapped.total_spend,
        };
      });

      const res = await importCustomersBulk(models);
      setImportProgress(1);
      const { imported, updated } = res.data;
      toast.success(`Successfully ingested dataset: ${imported} imported, ${updated} updated.`);
      
      setTimeout(() => {
        setStep(3);
      }, 1200);
    } catch (err) {
      console.error("CSV bulk import error:", err);
      toast.error(err?.response?.data?.detail || "Ingestion failure. Check CSV structure.");
    } finally {
      setImporting(false);
    }
  };

  // Seed sample dataset on backend
  const handleSeedSampleData = async () => {
    setSeedingLoader(true);
    try {
      await seedDatabase();
      toast.success("Sample dataset loaded successfully.");
      setStep(3);
    } catch (err) {
      console.error("Seed backend failed:", err);
      toast.error("Unable to seed sample data. Is the backend running?");
    } finally {
      setSeedingLoader(false);
    }
  };

  // Clean slate start fresh
  const handleStartFresh = async () => {
    setSeedingLoader(true);

    try {
      await resetDatabase();
      toast.success("Database initialized as fresh slate!");
      setStep(3);
    } catch (err) {
      console.error("Reset database failed:", err);
      toast.error("Could not reset backend database. Please try again.");
    } finally {
      setSeedingLoader(false);
    }
  };


  // Enter Workspace Final Trigger
  const handleEnterWorkspace = () => {
    if (user?.email) {
      localStorage.setItem(`onboarding_completed_${user.email}`, "true");
      localStorage.setItem("onboarding_dismissed", "true");
      toast.success("Holographic workspace ready. Initializing...", { duration: 1500 });
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
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
    <>
      <Toaster position="top-right" />
      <StarfieldBackground />

      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        zIndex: 10,
        padding: "24px",
        fontFamily: "var(--font-sans)",
        overflowY: "auto",
        boxSizing: "border-box",
      }}>
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
          .glass-onboarding-panel {
            background: rgba(10, 10, 25, 0.60);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(35px);
            -webkit-backdrop-filter: blur(35px);
            border-radius: 24px;
            padding: 40px;
            width: 100%;
            max-width: 680px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.85);
            animation: glowPulse 5s infinite ease-in-out;
            position: relative;
            z-index: 20;
          }
          .option-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 14px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .option-card:hover {
            background: rgba(99, 102, 241, 0.08);
            border-color: rgba(99, 102, 241, 0.35);
            transform: translateY(-2px);
          }
          .option-card.selected {
            background: rgba(99, 102, 241, 0.15);
            border-color: rgba(99, 102, 241, 0.60);
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
          }
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
            justifyContent: center;
            gap: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 14px rgba(99,102,241,0.40);
          }
          .btn-gradient:hover:not(:disabled) {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(217, 70, 239, 0.50);
          }
          .btn-gradient:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .btn-outline {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #cbd5e1;
            padding: 12px 24px;
            font-weight: 600;
            font-size: 13.5px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-outline:hover {
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
          }
          .importer-dropzone {
            border: 2px dashed rgba(99, 102, 241, 0.35);
            background: rgba(99, 102, 241, 0.02);
            border-radius: 14px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
          }
          .importer-dropzone:hover {
            border-color: rgba(217, 70, 239, 0.60);
            background: rgba(217, 70, 239, 0.03);
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
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
        >
          <LogOut size={13} /> Exit Portal
        </button>

        {/* Floating 3D Tilt Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="glass-onboarding-panel"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1, 1, 1)`,
            transition: "transform 0.1s ease-out, box-shadow 0.3s ease",
          }}
        >
          {/* STEP 1: INITIAL GREETING */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  background: "linear-gradient(135deg, #6366f1, #d946ef)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 25px rgba(99,102,241,0.35)",
                }}>
                  <Sparkles size={26} color="white" />
                </div>
              </div>

              <div>
                <h1 style={{
                  fontSize: "30px", fontWeight: 900, color: "white",
                  margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2,
                }}>
                  Initialize Cohort Telemetry
                </h1>
                <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                  SegmentIQ Enterprise Setup Gateway
                </p>
              </div>

              <p style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: 1.6, margin: "10px 0" }}>
                Welcome, <span style={{ color: "#a5b4fc", fontWeight: 700 }}>{firstName}</span>. A new workspace has been prepared. Before entering the CRM dashboard, you must select how you wish to seed and map your target datasets.
              </p>

              <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                <button onClick={() => setStep(2)} className="btn-gradient">
                  Activate Setup Wizard <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SETUP DATA INITIALIZATION WIZARD */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "white", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                  Workspace Data Ingestion
                </h2>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                  Select how you want to configure your initial databases.
                </p>
              </div>

              {/* Ingestion choice grid */}
              {!dataOption && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  
                  {/* Option 1: CSV upload */}
                  <div onClick={() => setDataOption("csv")} className="option-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: "rgba(16, 185, 129, 0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FileSpreadsheet size={18} color="#10b981" />
                      </div>
                      <div>
                        <p style={{ fontSize: "14.5px", fontWeight: 700, color: "white", margin: 0 }}>Import Customer Database (CSV)</p>
                        <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: 0 }}>Upload custom spreadsheet records to populate active nodes.</p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Sample data seeding */}
                  <button
                    onClick={handleSeedSampleData}
                    disabled={seedingLoader}
                    className="option-card"
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: "rgba(99, 102, 241, 0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Database size={18} color="#6366f1" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "14.5px", fontWeight: 700, color: "white", margin: 0 }}>Load sample dataset</p>
                        <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: 0 }}>Hydrate backend records instantly for live analytics.</p>
                      </div>
                      {seedingLoader && <Loader2 size={16} className="animate-spin" color="#6366f1" />}
                    </div>
                  </button>

                  {/* Option 3: Clean slate */}
                  <button
                    onClick={handleStartFresh}
                    disabled={seedingLoader}
                    className="option-card"
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Server size={18} color="#ef4444" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "14.5px", fontWeight: 700, color: "white", margin: 0 }}>Empty Database (Clean Slate)</p>
                        <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: 0 }}>Start clean. Zero customer data stored, direct database writes active.</p>
                      </div>
                      {seedingLoader && <Loader2 size={16} className="animate-spin" color="#ef4444" />}
                    </div>
                  </button>
                </div>
              )}

              {/* CSV Upload Workflow */}
              {dataOption === "csv" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  
                  {/* File Upload zone */}
                  {!csvFile ? (
                    <div
                      className="importer-dropzone"
                      onClick={() => document.getElementById("csv-file-picker").click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files[0]) handleCSVFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <Upload size={32} color="#a5b4fc" style={{ marginBottom: "12px" }} />
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "white", margin: "0 0 4px" }}>
                        Drag and drop your telemetry CSV here
                      </p>
                      <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: 0 }}>
                        Accepts standard comma-separated spreadsheets
                      </p>
                      <input
                        id="csv-file-picker"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      padding: "16px", borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                        <FileSpreadsheet size={20} color="#10b981" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13.5px", fontWeight: 700, color: "white", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {csvFile.name}
                          </p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                            {(csvFile.size / 1024).toFixed(1)} KB · {parsedRows.length} records detected
                          </p>
                        </div>
                        <button
                          onClick={() => { setCsvFile(null); setParsedRows([]); }}
                          style={{
                            background: "transparent", border: "none", color: "#ef4444", fontSize: "11.5px", cursor: "pointer", fontWeight: 700
                          }}
                        >
                          Reset
                        </button>
                      </div>

                      {/* Header schema verification alert */}
                      <div style={{
                        display: "flex", gap: "8px", padding: "10px 12px", borderRadius: "8px",
                        background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)",
                        marginBottom: "14px",
                      }}>
                        <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: "11.5px", color: "#a7f3d0", margin: 0, lineHeight: 1.4 }}>
                          Auto-mapped fields: <span style={{ fontFamily: "var(--font-mono)", color: "white" }}>name</span>, <span style={{ fontFamily: "var(--font-mono)", color: "white" }}>email</span>, <span style={{ fontFamily: "var(--font-mono)", color: "white" }}>city</span>, <span style={{ fontFamily: "var(--font-mono)", color: "white" }}>total_spend</span>. Real-time telemetry translation active.
                        </p>
                      </div>

                      {/* Progress bar when importing */}
                      {importing && (
                        <div style={{ marginBottom: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                            <span>Uploading customers to database...</span>
                            <span>{importProgress} / {importTotal}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{
                              width: `${(importProgress / importTotal) * 100}%`,
                              height: "100%", background: "linear-gradient(to right, #6366f1, #d946ef)",
                              transition: "width 0.1s ease",
                            }} />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={executeCSVImport}
                        disabled={importing}
                        className="btn-gradient"
                        style={{ width: "100%" }}
                      >
                        {importing ? (
                          <>
                            <Loader2 size={13} className="animate-spin" /> Ingesting Database...
                          </>
                        ) : (
                          <>
                            Activate and Import {parsedRows.length} Records <Play size={11} fill="white" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setDataOption(null)}
                    style={{
                      background: "transparent", border: "none", color: "#a5b4fc",
                      fontSize: "12.5px", cursor: "pointer", fontWeight: 600,
                      alignSelf: "flex-start", padding: 0
                    }}
                  >
                    ← Back to Ingestion Methods
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: HOLOGRAPHIC SCANNING & PLASMA GLOBE RENDER */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center", position: "relative" }}>
              
              {/* Absolute Laser Scanning Line Overlay */}
              <div className="laser-scanner" />

              <div>
                <span style={{
                  fontSize: "10.5px", fontWeight: 800, color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "4px 10px", borderRadius: "99px",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "inline-block", marginBottom: "10px"
                }}>
                  Ingestion complete · Active
                </span>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.02em" }}>
                  Holographic Telemetry Sync
                </h2>
                <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: "4px 0 0" }}>
                  Active node coordination pipeline mapping nodes.
                </p>
              </div>

              {/* 3D Plasma Globe telemetric scanner container */}
              <div style={{
                position: "relative",
                height: "280px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "inset 0 0 30px rgba(99, 102, 241, 0.10)",
              }}>
                <PlasmaGlobe height="280px" />
                <div style={{
                  position: "absolute", bottom: "14px", left: "14px",
                  display: "flex", flexDirection: "column", gap: "4px",
                  textAlign: "left",
                }}>
                  <p style={{ fontSize: "8.5px", color: "#8891a8", fontFamily: "var(--font-mono)", margin: 0 }}>NODE STATUS: COMPILED</p>
                  <p style={{ fontSize: "8.5px", color: "#10b981", fontFamily: "var(--font-mono)", margin: 0 }}>TEL NETWORKS: ONLINE</p>
                </div>
              </div>

              <div style={{
                padding: "16px 20px", borderRadius: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "left",
              }}>
                <blockquote style={{
                  margin: 0, fontStyle: "italic", fontSize: "13px",
                  color: "#cbd5e1", lineHeight: 1.6, fontWeight: 500,
                }}>
                  "Data without context is just noise. SegmentIQ bridges the gap between regional telemetry and automated campaign output. Your workspace environment is now fully synchronized."
                </blockquote>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc", margin: "6px 0 0", textAlign: "right" }}>
                  — Rishabh Raj, Founder & Architect
                </p>
              </div>

              <button
                onClick={handleEnterWorkspace}
                className="btn-gradient"
                style={{ width: "100%", padding: "14px", fontSize: "14px" }}
              >
                Enter My CRM Workspace <Play size={12} fill="white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * CSVUploadModal.jsx — Reusable CSV database importer modal.
 * Premium Glassmorphic design conforming to the application standard.
 */
import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Check, Loader2, Play } from "lucide-react";
import toast from "react-hot-toast";
import { importCustomersBulk } from "../services/api";

export default function CSVUploadModal({ isOpen, onClose, onSuccess }) {
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle file select
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
        toast.success(`Loaded ${rows.length} rows successfully!`);
      }
    };
    reader.readAsText(file);
  };

  // CSV parsing engine
  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV regex matching values inside/outside quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const row = matches.map((val) => val.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      data.push(obj);
    }
    return data;
  };

  // Row mapping logic matching Welcome.jsx but supporting total_spent
  const mapCSVRowToCustomer = (row) => {
    const findValue = (keys) => {
      const foundKey = Object.keys(row).find((k) => keys.some((key) => k.includes(key)));
      return foundKey ? row[foundKey] : "";
    };

    const name = findValue(["name"]) || "Unknown Customer";
    const email = findValue(["email", "mail"]) || `${name.toLowerCase().replace(/\s+/g, ".")}@segmentiq-user.in`;
    const phone = findValue(["phone", "mobile", "tel"]) || null;
    const cityVal = findValue(["city", "town", "loc"]) || "Bangalore";
    const cities = ["Bangalore", "Delhi", "Chennai", "Pune", "Hyderabad", "Mumbai"];
    let city = cities.find((c) => c.toLowerCase() === cityVal.toLowerCase()) || "Bangalore";

    const genderVal = findValue(["gender", "sex"]) || "Male";
    const gender = ["Male", "Female", "Other"].find((g) => g.toLowerCase() === genderVal.toLowerCase()) || "Male";

    const age = parseInt(findValue(["age"]), 10) || 28;
    const total_spend = parseFloat(findValue(["spent", "spend", "revenue", "amount"])) || 0.0;

    return {
      name,
      email,
      phone,
      city,
      gender,
      age,
      total_spent: total_spend,
    };
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);

    try {
      const models = parsedRows.map((row) => mapCSVRowToCustomer(row));
      
      // Call bulk API
      const res = await importCustomersBulk(models);
      const { imported, updated } = res.data;
      
      toast.success(`Successfully imported ${imported} and updated ${updated} records!`);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Ingestion error occurred.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCsvFile(null);
    setParsedRows([]);
    setImporting(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={importing ? null : handleClose} style={{
        position: "fixed", inset: 0, background: "rgba(26,29,46,0.30)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        zIndex: 100, animation: "crmFadeIn 0.18s ease"
      }} />

      {/* Modal */}
      <div className="glass-card-strong" style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: "460px",
        zIndex: 101, display: "flex", flexDirection: "column",
        padding: "24px", animation: "crmFadeIn 0.20s ease",
        color: "var(--color-text-primary)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, margin: 0 }}>
              Bulk Customer Ingestion
            </h2>
            <p style={{ fontSize: "11.5px", color: "var(--color-text-muted)", margin: 0 }}>
              Ingest spreadsheet records into the live database.
            </p>
          </div>
          <button onClick={handleClose} disabled={importing} style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)"
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!csvFile ? (
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleCSVFile(e.dataTransfer.files[0]);
              }}
              style={{
                border: "2px dashed rgba(99, 102, 241, 0.35)",
                background: "rgba(99, 102, 241, 0.02)",
                borderRadius: "12px", padding: "32px 20px",
                textAlign: "center", cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.35)"; e.currentTarget.style.background = "rgba(99, 102, 241, 0.02)"; }}
            >
              <Upload size={28} color="#6366f1" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 4px" }}>
                Drag and drop customer CSV here
              </p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>
                Click to browse files (accepts .csv)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div style={{
              padding: "16px", borderRadius: "10px",
              background: "rgba(99, 102, 241, 0.04)",
              border: "1px solid rgba(99, 102, 241, 0.12)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <FileSpreadsheet size={22} color="#10b981" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {csvFile.name}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>
                    {(csvFile.size / 1024).toFixed(1)} KB · {parsedRows.length} rows detected
                  </p>
                </div>
                <button
                  onClick={() => { setCsvFile(null); setParsedRows([]); }}
                  disabled={importing}
                  style={{
                    background: "transparent", border: "none", color: "#ef4444", fontSize: "11.5px", cursor: "pointer", fontWeight: 700
                  }}
                >
                  Clear
                </button>
              </div>

              {/* Mappings */}
              <div style={{
                display: "flex", gap: "8px", padding: "10px", borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)",
                marginBottom: "14px"
              }}>
                <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: "11px", color: "#065f46", margin: 0, lineHeight: 1.4 }}>
                  Mapped: <strong>name</strong>, <strong>email</strong>, <strong>phone</strong>, <strong>city</strong>, <strong>gender</strong>, <strong>age</strong>, and <strong>total_spent</strong>. Real-time synchrony active.
                </p>
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="glass-btn-primary"
                style={{ width: "100%", padding: "11px", display: "flex", gap: "8px", justifyContent: "center" }}
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Ingesting Dataset...
                  </>
                ) : (
                  <>
                    Import {parsedRows.length} Customers <Play size={10} fill="white" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

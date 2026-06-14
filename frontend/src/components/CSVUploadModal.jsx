/**
 * CSVUploadModal.jsx — Reusable CSV database importer modal.
 * Premium Glassmorphic design conforming to the application standard.
 *
 * FIXES:
 *  - Replaced broken regex CSV parser with a standards-compliant state-machine
 *    parser that correctly handles quoted fields, embedded commas, and newlines.
 *    This eliminates the "100 rows → 300 customers" tripling bug.
 *  - After successful import: stores raw CSV + summary in DatasetContext so
 *    Prism AI can access it without requiring a separate file upload.
 */
import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Check, Loader2, Play, Database } from "lucide-react";
import toast from "react-hot-toast";
import { importCustomersBulk } from "../services/api";
import { useDataset } from "../context/DatasetContext";

export default function CSVUploadModal({ isOpen, onClose, onSuccess }) {
  const [csvFile,    setCsvFile]    = useState(null);
  const [csvRawText, setCsvRawText] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [importing,  setImporting]  = useState(false);
  const fileInputRef = useRef(null);
  const { setDataset } = useDataset();

  if (!isOpen) return null;

  /* ── Drag & Drop ──────────────────────────────────────── */
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
      setCsvRawText(text);
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No valid records found in this CSV.");
      } else {
        setParsedRows(rows);
        toast.success(`Loaded ${rows.length} rows successfully!`);
      }
    };
    reader.readAsText(file);
  };

  /* ── Standards-compliant CSV parser (RFC 4180) ────────────────────────
     Handles:
       • Quoted fields containing commas, newlines, and escaped quotes ("")
       • Windows (CRLF) and Unix (LF) line endings
       • Leading/trailing whitespace outside quotes
   ───────────────────────────────────────────────────────────────────── */
  const parseCSV = (text) => {
    const DELIMITER = ",";
    const rows = [];
    let insideQuote = false;
    let currentField = "";
    let currentRow = [];

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (insideQuote && next === '"') {
          // Escaped quote inside a quoted field
          currentField += '"';
          i++; // skip next quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (ch === DELIMITER && !insideQuote) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if ((ch === "\n" || (ch === "\r" && next === "\n")) && !insideQuote) {
        if (ch === "\r") i++; // skip the \n of CRLF
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some(f => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (ch === "\r" && !insideQuote) {
        // Lone CR (old Mac line ending)
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some(f => f !== "")) rows.push(currentRow);
        currentRow = [];
      } else {
        currentField += ch;
      }
    }

    // Flush remaining field/row
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f !== "")) rows.push(currentRow);

    if (rows.length < 2) return [];

    // First row = headers
    const headers = rows[0].map(h => h.toLowerCase().replace(/['"]/g, "").trim());
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = (row[idx] || "").replace(/^"|"$/g, "").trim();
      });
      // Skip completely blank rows
      if (Object.values(obj).some(v => v !== "")) {
        data.push(obj);
      }
    }

    return data;
  };

  /* ── Field mapping ────────────────────────────────────── */
  const mapCSVRowToCustomer = (row) => {
    const findValue = (keys) => {
      const foundKey = Object.keys(row).find(k =>
        keys.some(key => k.includes(key))
      );
      return foundKey ? row[foundKey] : "";
    };

    const name      = findValue(["name"])                                    || "Unknown Customer";
    const emailRaw  = findValue(["email", "mail"]);
    const email     = emailRaw || `${name.toLowerCase().replace(/\s+/g, ".")}@segmentiq-user.in`;
    const phone     = findValue(["phone", "mobile", "tel"]) || null;
    const cityVal   = findValue(["city", "town", "loc"])    || "Bangalore";

    const VALID_CITIES = ["Bangalore", "Delhi", "Chennai", "Pune", "Hyderabad", "Mumbai"];
    const city = VALID_CITIES.find(c => c.toLowerCase() === cityVal.toLowerCase()) || cityVal || "Bangalore";

    const genderVal = findValue(["gender", "sex"])          || "Male";
    const VALID_GENDERS = ["Male", "Female", "Other"];
    const gender = VALID_GENDERS.find(g => g.toLowerCase() === genderVal.toLowerCase()) || "Male";

    const age         = parseInt(findValue(["age"]), 10)    || 28;
    const total_spent = parseFloat(findValue(["spent", "spend", "revenue", "amount", "total_spent"])) || 0.0;

    return { name, email, phone, city, gender, age, total_spent };
  };

  /* ── Import handler ───────────────────────────────────── */
  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);

    try {
      const models = parsedRows.map(row => mapCSVRowToCustomer(row));

      // Deduplicate by email within the batch itself (CSV may have duplicate rows)
      const seen = new Set();
      const uniqueModels = models.filter(m => {
        const key = m.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const res = await importCustomersBulk(uniqueModels);
      const { imported, updated } = res.data;

      toast.success(`Successfully imported ${imported} and updated ${updated} records!`);

      // ── Sync dataset to Prism AI context ─────────────────
      const cities = [...new Set(uniqueModels.map(m => m.city).filter(Boolean))];
      const genders = uniqueModels.reduce((acc, m) => {
        acc[m.gender] = (acc[m.gender] || 0) + 1;
        return acc;
      }, {});
      const avgAge = uniqueModels.length
        ? Math.round(uniqueModels.reduce((s, m) => s + (m.age || 0), 0) / uniqueModels.length)
        : 0;
      const totalRevenue = uniqueModels.reduce((s, m) => s + (m.total_spent || 0), 0);

      setDataset({
        fileName:     csvFile.name,
        uploadedAt:   new Date().toISOString(),
        totalRows:    uniqueModels.length,
        csvText:      csvRawText,
        summary: {
          totalCustomers: uniqueModels.length,
          cities,
          genderBreakdown: genders,
          averageAge: avgAge,
          totalRevenue: totalRevenue.toFixed(2),
          avgSpend: uniqueModels.length
            ? (totalRevenue / uniqueModels.length).toFixed(2)
            : "0.00",
        },
      });

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
    setCsvRawText("");
    setParsedRows([]);
    setImporting(false);
    onClose();
  };

  /* ── UI ─────────────────────────────────────────────── */
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
            <p style={{ fontSize: "11.5px", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
              Ingest spreadsheet records · auto-syncs to Prism AI
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
                Click to browse · accepts .csv · auto-syncs to Prism AI
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
                  onClick={() => { setCsvFile(null); setParsedRows([]); setCsvRawText(""); }}
                  disabled={importing}
                  style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "11.5px", cursor: "pointer", fontWeight: 700 }}
                >
                  Clear
                </button>
              </div>

              {/* Field mapping confirmation */}
              <div style={{
                display: "flex", gap: "8px", padding: "10px", borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)",
                marginBottom: "10px"
              }}>
                <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: "11px", color: "#065f46", margin: 0, lineHeight: 1.4 }}>
                  Mapped: <strong>name</strong>, <strong>email</strong>, <strong>phone</strong>, <strong>city</strong>, <strong>gender</strong>, <strong>age</strong>, and <strong>total_spent</strong>.
                </p>
              </div>

              {/* Prism sync notice */}
              <div style={{
                display: "flex", gap: "8px", padding: "9px", borderRadius: "8px",
                background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
                marginBottom: "14px"
              }}>
                <Database size={13} color="#6366f1" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: "11px", color: "#4338ca", margin: 0, lineHeight: 1.4 }}>
                  Dataset will be <strong>auto-synced to Prism AI</strong> — no separate upload needed.
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

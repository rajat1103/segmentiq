import { useState, useRef, useCallback, useEffect } from "react";
import { PrismLogo } from "../components/Logo";
import { aiChat, aiGenerateSegment, aiGenerateMessage } from "../services/api";
import {
  Sparkles, Send, Upload, FileText, Trash2, X, Plus,
  Brain, Search, MessageSquare, ChevronRight, Clock,
  Paperclip, CornerDownLeft, LayoutGrid, SlidersHorizontal,
  Database, Zap, Users, BarChart3, FileSearch, CheckCircle2,
  AlertCircle, Loader2, BookOpen, Hash, Tag, Star,
  ChevronDown, Copy, ThumbsUp, ThumbsDown, RotateCcw,
  Maximize2, ArrowUpRight,
} from "lucide-react";


function buildAiReply(query, attachments, docs) {
  const lines = [];
  if (query) {
    lines.push(`Received your request: "${query}".`);
  } else {
    lines.push("Received an attachment request. Share a question to activate context-aware analysis.");
  }

  if (docs.length > 0) {
    lines.push(`I am referencing ${docs.length} indexed document${docs.length > 1 ? "s" : ""}: ${docs.map((doc) => doc.name).join(", ")}.`);
  } else {
    lines.push("No indexed knowledge documents are available yet. Upload a file to provide workspace context.");
  }

  if (attachments.length > 0) {
    lines.push(`Attached file${attachments.length > 1 ? "s" : ""}: ${attachments.map((file) => file.name).join(", ")}.`);
  }

  lines.push("This workspace is a live AI shell. Connect a model or backend integration to unlock guided CRM recommendations.");
  return lines.join("\n\n");
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */

/* Markdown-like renderer for AI messages */
function MarkdownMessage({ content }) {
  const lines = content.split("\n");
  return (
    <div style={{ fontSize: "13px", lineHeight: 1.7, color: "#1a1d2e" }}>
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
          return <p key={i} style={{ fontWeight: 700, margin: "8px 0 4px" }}>{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("# "))  return <h3 key={i} style={{ fontSize: "15px", fontWeight: 800, margin: "10px 0 6px", color: "#1a1d2e" }}>{line.slice(2)}</h3>;
        if (line.startsWith("## ")) return <h4 key={i} style={{ fontSize: "14px", fontWeight: 700, margin: "8px 0 4px", color: "#1a1d2e" }}>{line.slice(3)}</h4>;
        if (line.startsWith("- "))  return <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}><span style={{ color: "#6366f1", flexShrink: 0, marginTop: "3px" }}>•</span><span>{renderInline(line.slice(2))}</span></div>;
        if (line.startsWith("|") && line.endsWith("|")) return <TableRow key={i} line={line} />;
        if (line.match(/^\d+\. /)) return <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}><span style={{ color: "#6366f1", fontWeight: 700, minWidth: "18px" }}>{line.match(/^(\d+)/)[1]}.</span><span>{renderInline(line.replace(/^\d+\. /, ""))}</span></div>;
        if (!line.trim()) return <div key={i} style={{ height: "6px" }} />;
        return <p key={i} style={{ margin: "3px 0" }}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))   return <code key={i} style={{ background: "#f0f1f8", padding: "1px 5px", borderRadius: "3px", fontSize: "12px", fontFamily: "monospace", color: "#4338ca" }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function TableRow({ line }) {
  const cells = line.split("|").filter(c => c.trim() && c.trim() !== "---");
  if (!cells.length) return null;
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #f0f1f8", marginBottom: "2px" }}>
      {cells.map((c, i) => (
        <div key={i} style={{ flex: 1, padding: "4px 8px", fontSize: "12px", background: i === 0 ? "#f8f9fe" : "transparent", fontWeight: i === 0 ? 600 : 400 }}>
          {renderInline(c.trim())}
        </div>
      ))}
    </div>
  );
}

/* Typing indicator */
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px" }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "#2563eb",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <PrismLogo size={18} />
      </div>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#a5b4fc",
            animation: `typingBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: "11.5px", color: "#8891a8" }}>Prism is thinking…</span>
    </div>
  );
}

/* File badge */
function FileBadge({ file, onRemove }) {
  const ext = file.type ? (ACCEPTED_TYPES[file.type] || { label: file.name.split(".").pop().toUpperCase(), color: "#6366f1", bg: "#eef2ff" }) : { label: "FILE", color: "#6366f1", bg: "#eef2ff" };
  const sizeKb = (file.size / 1024).toFixed(1);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "6px 10px", borderRadius: "7px",
      background: ext.bg, border: `1px solid ${ext.color}20`,
      maxWidth: "220px",
    }}>
      <span style={{ fontSize: "9px", fontWeight: 800, color: ext.color, background: `${ext.color}20`, padding: "2px 5px", borderRadius: "3px" }}>
        {ext.label}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "11.5px", fontWeight: 600, color: "#1a1d2e", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </p>
        <p style={{ fontSize: "10px", color: "#8891a8", margin: 0 }}>{sizeKb} KB</p>
      </div>
      {onRemove && (
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#8891a8", padding: "1px", flexShrink: 0 }}>
          <X size={12} />
        </button>
      )}
    </div>
  );
}

/* Knowledge base document card */
function DocCard({ doc, onDelete }) {
  const statusCfg = {
    ready:      { icon: CheckCircle2, color: "#10b981", label: "Indexed"    },
    processing: { icon: Loader2,      color: "#f59e0b", label: "Processing" },
    error:      { icon: AlertCircle,  color: "#ef4444", label: "Error"      },
  }[doc.status] || { icon: CheckCircle2, color: "#10b981", label: "Ready" };

  const StatusIcon = statusCfg.icon;

  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: "10px",
      border: "1px solid rgba(226,232,255,0.60)",
      background: "rgba(255,255,255,0.70)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      marginBottom: "8px",
      transition: "all 0.13s ease",
      boxShadow: "0 2px 8px rgba(99,102,241,0.05)",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(165,180,252,0.60)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(226,232,255,0.60)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.05)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: ACCEPTED_TYPES[doc.type]?.bg || "#eef2ff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText size={14} color={ACCEPTED_TYPES[doc.type]?.color || "#6366f1"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "12.5px", fontWeight: 600, color: "#1a1d2e", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              display: "flex", alignItems: "center", gap: "3px",
              fontSize: "10.5px", color: statusCfg.color, fontWeight: 600,
            }}>
              <StatusIcon size={10} style={{ animation: doc.status === "processing" ? "spin 1s linear infinite" : "none" }} />
              {statusCfg.label}
            </span>
            <span style={{ fontSize: "10px", color: "#b9bece" }}>·</span>
            <span style={{ fontSize: "10.5px", color: "#8891a8" }}>{doc.size}</span>
            {doc.chunks && (
              <>
                <span style={{ fontSize: "10px", color: "#b9bece" }}>·</span>
                <span style={{ fontSize: "10.5px", color: "#8891a8" }}>{doc.chunks} chunks</span>
              </>
            )}
          </div>
          {doc.tags?.length > 0 && (
            <div style={{ display: "flex", gap: "4px", marginTop: "5px", flexWrap: "wrap" }}>
              {doc.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: "9.5px", fontWeight: 600, padding: "1px 6px", borderRadius: "99px",
                  background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(doc.id)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#8891a8", padding: "2px", flexShrink: 0,
          borderRadius: "4px",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fee2e2"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#8891a8"; e.currentTarget.style.background = "none"; }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SEGMENT AI PAGE
   ═══════════════════════════════════════════════════════ */
export default function SegmentAI() {
  /* ── Panel layout state ──────────────────────────── */
  const [leftPanel,  setLeftPanel]  = useState("kb");     // "kb" | "sessions" | "templates"
  const [rightPanel, setRightPanel] = useState("context");// "context" | "sources"
  const [showRight,  setShowRight]  = useState(true);

  /* ── Chat state ──────────────────────────────────── */
  const [input,      setInput]      = useState("");
  const [isTyping,   setIsTyping]   = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [sessions, setSessions] = useState([{ ...DEFAULT_SESSION, messages: [] }]);
  const [activeSession, setActiveSession] = useState(DEFAULT_SESSION.id);
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

  /* ── Knowledge base state ────────────────────────── */
  const [kbDocs, setKbDocs] = useState([]);
  const [dragOver,   setDragOver]   = useState(false);
  const kbFileRef = useRef(null);

  const activeSessionData = sessions.find((s) => s.id === activeSession) || sessions[0];
  const activeMessages = activeSessionData?.messages || [];

  /* ── Auto-scroll ───────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isTyping]);

  /* ── Send message handler ────────────────────────── */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !attachments.length) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
      attachments: [...attachments],
      ts: new Date(),
    };

    setSessions(prev => prev.map((session) => {
      if (session.id !== activeSession) return session;
      return { ...session, messages: [...session.messages, userMsg] };
    }));
    setInput("");
    setAttachments([]);
    setIsTyping(true);

    try {
      // Build message history for context (last 12 messages)
      const currentMessages = sessions.find(s => s.id === activeSession)?.messages || [];
      const historyForApi = [...currentMessages, userMsg]
        .slice(-12)
        .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));

      // Call real Groq API
      const res = await aiChat(historyForApi);
      const aiReply = res.data.reply;

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: aiReply,
        ts: new Date(),
        sources: [],
        model: res.data.model,
        tokens: res.data.tokens_used,
      };

      setSessions(prev => prev.map((session) => {
        if (session.id !== activeSession) return session;
        return { ...session, messages: [...session.messages, aiMsg] };
      }));
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || "Failed to reach Prism AI. Check that GROQ_API_KEY is set in Render.";
      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: `⚠️ **Connection Error**\n\n${errorMsg}\n\nPlease verify your Groq API key is correctly set in the Render dashboard environment variables.`,
        ts: new Date(),
        sources: [],
      };
      setSessions(prev => prev.map((session) => {
        if (session.id !== activeSession) return session;
        return { ...session, messages: [...session.messages, aiMsg] };
      }));
    } finally {
      setIsTyping(false);
    }
  }, [input, attachments, sessions, activeSession]);


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* ── Template insert ─────────────────────────────── */
  const insertTemplate = (prompt) => {
    setInput(prompt);
    setLeftPanel("kb");
  };

  /* ── KB upload ───────────────────────────────────── */
  const handleKBUpload = (files) => {
    const newDocs = Array.from(files).map(f => ({
      id:     Date.now() + Math.random(),
      name:   f.name,
      size:   `${(f.size / 1024).toFixed(0)} KB`,
      type:   f.type,
      status: "processing",
      tags:   [],
    }));
    setKbDocs(prev => [...prev, ...newDocs]);
    // Simulate processing → ready after 2.5s
    setTimeout(() => {
      setKbDocs(prev => prev.map(d =>
        newDocs.find(n => n.id === d.id) ? { ...d, status: "ready", chunks: Math.floor(100 + Math.random() * 900) } : d
      ));
    }, 2500);
  };

  /* ── Chat file attach ────────────────────────────── */
  const handleChatFileAttach = (files) => {
    setAttachments(prev => [...prev, ...Array.from(files)]);
  };

  /* ── Copy message ────────────────────────────────── */
  const copyMsg = (content) => navigator.clipboard.writeText(content);

  const totalIndexed = kbDocs.filter(d => d.status === "ready").length;
  const totalChunks  = kbDocs.filter(d => d.status === "ready").reduce((s, d) => s + (d.chunks || 0), 0);
  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes crmFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .ai-msg-action { opacity: 0; transition: opacity 0.15s ease; }
        .ai-msg-wrap:hover .ai-msg-action { opacity: 1; }
      `}</style>

      {/* ══════════════════════════════════════════════
          TOP BAR — AI Workspace Header
      ══════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "14px",
        paddingBottom: "14px",
        borderBottom: "1px solid rgba(226,232,255,0.55)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "11px", flexShrink: 0,
            background: "#2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(37,99,235,0.15)",
          }}>
            <PrismLogo size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, color: "#1a1d2e", margin: 0 }}>
                AI Workspace
              </h1>
              <span style={{
                background: "rgba(239, 246, 255, 0.90)",
                color: "#2563eb", fontSize: "9.5px", fontWeight: 800,
                padding: "2px 8px", borderRadius: "99px",
                border: "1px solid #bfdbfe", letterSpacing: "0.06em",
              }}>
                BETA
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "#8891a8", margin: 0 }}>
              Live workspace · {totalIndexed} documents indexed · {totalChunks.toLocaleString()} chunks
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Model selector mock */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", borderRadius: "8px",
            border: "1px solid rgba(199,210,254,0.55)",
            background: "rgba(238,242,255,0.70)",
            backdropFilter: "blur(10px)",
            cursor: "pointer", fontSize: "12px",
            color: "#4338ca", fontWeight: 600,
          }}>
            <Brain size={13} color="#6366f1" />
            Live AI model
            <ChevronDown size={12} color="#8891a8" />
          </div>

          <button
            onClick={() => setShowRight(v => !v)}
            className="crm-btn-secondary"
            style={{ fontSize: "12px" }}
          >
            <SlidersHorizontal size={13} />
            {showRight ? "Hide" : "Show"} Context
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN 3-PANEL WORKSPACE
      ══════════════════════════════════════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: showRight ? "240px 1fr 260px" : "240px 1fr",
        gap: "14px",
        height: "calc(100vh - 190px)",
        minHeight: "500px",
      }}>

        {/* ── LEFT PANEL ────────────────────────────── */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "rgba(255,255,255,0.68)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(226,232,255,0.60)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
        }}>
          {/* Left panel tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(226,232,255,0.55)",
            background: "rgba(248,249,254,0.70)",
            flexShrink: 0,
          }}>
            {[
              { id: "kb",        icon: Database,     tip: "Knowledge Base" },
              { id: "sessions",  icon: MessageSquare, tip: "Sessions" },
              { id: "templates", icon: LayoutGrid,    tip: "Templates" },
            ].map(({ id, icon: Icon, tip }) => (
              <button key={id} onClick={() => setLeftPanel(id)} title={tip} style={{
                flex: 1, padding: "10px 6px", border: "none", background: "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                borderBottom: leftPanel === id ? "2px solid #6366f1" : "2px solid transparent",
                color: leftPanel === id ? "#6366f1" : "#8891a8",
                transition: "all 0.13s ease",
                marginBottom: "-1px",
              }}>
                <Icon size={15} />
              </button>
            ))}
          </div>

          {/* Left panel content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>

            {/* Knowledge Base panel */}
            {leftPanel === "kb" && (
              <>
                {/* KB stats strip */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                  {[
                    { label: "Documents", value: kbDocs.length, color: "#6366f1" },
                    { label: "Chunks",    value: totalChunks.toLocaleString(), color: "#10b981" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: "8px 10px", borderRadius: "7px", background: "#f8f9fe", border: "1px solid #eceef5" }}>
                      <p style={{ fontSize: "10px", fontWeight: 600, color: "#8891a8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, color, margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Upload drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleKBUpload(e.dataTransfer.files); }}
                  onClick={() => kbFileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "#6366f1" : "#c7d2fe"}`,
                    borderRadius: "8px",
                    padding: "14px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: dragOver ? "#eef2ff" : "#f8f9fe",
                    marginBottom: "12px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Upload size={18} color={dragOver ? "#6366f1" : "#a5b4fc"} style={{ margin: "0 auto 6px" }} />
                  <p style={{ fontSize: "11.5px", fontWeight: 600, color: "#4338ca", margin: "0 0 2px" }}>
                    {dragOver ? "Drop to add to KB" : "Drop files or click"}
                  </p>
                  <p style={{ fontSize: "10px", color: "#8891a8", margin: 0 }}>PDF, CSV, XLSX, TXT, PNG</p>
                  <input ref={kbFileRef} type="file" multiple accept=".pdf,.csv,.xlsx,.txt,.png,.jpg" style={{ display: "none" }}
                    onChange={e => handleKBUpload(e.target.files)} />
                </div>

                {/* Document list */}
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>
                  Indexed Documents
                </p>
                {kbDocs.map(doc => (
                  <DocCard key={doc.id} doc={doc} onDelete={id => setKbDocs(prev => prev.filter(d => d.id !== id))} />
                ))}
              </>
            )}

            {/* Sessions panel */}
            {leftPanel === "sessions" && (
              <>
                <button
                  onClick={() => {
                    const nextSession = {
                      id: `s${Date.now()}`,
                      title: `Session ${sessions.length + 1}`,
                      time: "Just now",
                    };
                    setSessions(prev => [nextSession, ...prev]);
                    setActiveSession(nextSession.id);
                    setMessages([]);
                  }}
                  className="crm-btn-primary"
                  style={{ width: "100%", marginBottom: "12px", fontSize: "12px", padding: "8px" }}
                >
                  <Plus size={13} /> New Session
                </button>
                {sessions.map((s) => (
                  <div key={s.id} onClick={() => setActiveSession(s.id)} style={{
                    padding: "10px 11px", borderRadius: "7px", marginBottom: "4px",
                    cursor: "pointer", border: "1px solid transparent",
                    background: activeSession === s.id ? "#eef2ff" : "transparent",
                    borderColor: activeSession === s.id ? "#c7d2fe" : "transparent",
                    transition: "all 0.13s ease",
                  }}
                    onMouseEnter={e => { if (activeSession !== s.id) e.currentTarget.style.background = "#f8f9fe"; }}
                    onMouseLeave={e => { if (activeSession !== s.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <MessageSquare size={13} color={activeSession === s.id ? "#6366f1" : "#8891a8"} style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "12px", fontWeight: activeSession === s.id ? 700 : 500, color: "#1a1d2e", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.title}
                        </p>
                        <p style={{ fontSize: "10px", color: "#8891a8", margin: 0, display: "flex", alignItems: "center", gap: "3px" }}>
                          <Clock size={9} /> {s.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Templates panel */}
            {leftPanel === "templates" && (
              <>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
                  Prompt Templates
                </p>
                {PROMPT_TEMPLATES.map(t => {
                  const Icon = t.icon;
                  return (
                    <div key={t.id} onClick={() => insertTemplate(t.prompt)} style={{
                      padding: "10px 11px", borderRadius: "7px", marginBottom: "6px",
                      cursor: "pointer", border: "1px solid var(--color-surface-border)",
                      background: "#fff", transition: "all 0.13s ease",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.background = "#f8f9fe"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-surface-border)"; e.currentTarget.style.background = "#fff"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <Icon size={13} color="#6366f1" />
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1d2e" }}>{t.label}</span>
                        <ArrowUpRight size={11} color="#a5b4fc" style={{ marginLeft: "auto" }} />
                      </div>
                      <p style={{ fontSize: "11px", color: "#4b5168", margin: 0, lineHeight: 1.5,
                        overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {t.prompt}
                      </p>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ── CENTER: CHAT ───────────────────────────── */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "#fff",
          border: "1px solid var(--color-surface-border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}>
          {/* Chat messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

            {/* Welcome state */}
            {activeMessages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "16px",
                  background: "#2563eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.20)",
                }}>
                  <PrismLogo size={34} />
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 8px" }}>
                  Ask anything about your data
                </h2>
                <p style={{ fontSize: "13px", color: "#8891a8", margin: "0 0 4px", maxWidth: "380px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
                  The assistant uses your knowledge base and CRM context to answer business questions in natural language.
                </p>
                <p style={{ fontSize: "11px", color: "#a5b4fc", margin: "0 0 28px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  Live data context ready
                </p>

                {/* Quick start chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                  {PROMPT_TEMPLATES.slice(0, 4).map(t => {
                    const Icon = t.icon;
                    return (
                      <button key={t.id} onClick={() => insertTemplate(t.prompt)} style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "7px 13px", borderRadius: "8px",
                        border: "1px solid #c7d2fe", background: "#f8f9fe",
                        fontSize: "12px", fontWeight: 600, color: "#4338ca",
                        cursor: "pointer", transition: "all 0.13s ease",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#f8f9fe"; }}
                      >
                        <Icon size={13} /> {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message thread */}
            {activeMessages.map((msg) => (
              <div key={msg.id} className="ai-msg-wrap" style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: "10px",
                marginBottom: "18px",
                animation: "crmFadeIn 0.2s ease",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                  background: msg.role === "user" ? "#e2e8f0" : "#2563eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {msg.role === "ai"
                    ? <PrismLogo size={18} />
                    : <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>U</span>}
                </div>

                <div style={{ maxWidth: "76%", minWidth: 0 }}>
                  {/* Message bubble */}
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.role === "user" ? "#6366f1" : "#f8f9fe",
                    border: msg.role === "user" ? "none" : "1px solid var(--color-surface-border)",
                    color: msg.role === "user" ? "#fff" : "#1a1d2e",
                  }}>
                    {/* Attachments in user message */}
                    {msg.attachments?.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {msg.attachments.map((f, i) => (
                          <FileBadge key={i} file={f} />
                        ))}
                      </div>
                    )}
                    {msg.role === "ai"
                      ? <MarkdownMessage content={msg.content} />
                      : <p style={{ fontSize: "13.5px", margin: 0, lineHeight: 1.6 }}>{msg.content}</p>}
                  </div>

                  {/* AI message actions */}
                  {msg.role === "ai" && (
                    <div className="ai-msg-action" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                      <button onClick={() => copyMsg(msg.content)} style={actionBtnStyle} title="Copy">
                        <Copy size={12} /> Copy
                      </button>
                      <button style={actionBtnStyle} title="Good response"><ThumbsUp size={12} /></button>
                      <button style={actionBtnStyle} title="Bad response"><ThumbsDown size={12} /></button>
                      <button style={actionBtnStyle} title="Regenerate"><RotateCcw size={12} /></button>
                      {msg.sources?.length > 0 && (
                        <span style={{ marginLeft: "4px", fontSize: "10.5px", color: "#8891a8" }}>
                          Sources: {msg.sources.map(s => (
                            <span key={s} style={{ color: "#6366f1", fontWeight: 600, marginLeft: "4px" }}>
                              <BookOpen size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {s.split(".")[0]}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p style={{ fontSize: "10px", color: "#b9bece", margin: "3px 0 0", textAlign: msg.role === "user" ? "right" : "left" }}>
                    {msg.ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ animation: "crmFadeIn 0.15s ease" }}>
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Chat Input Bar ──────────────────────── */}
          <div style={{
            borderTop: "1px solid var(--color-surface-border)",
            background: "#fff",
            padding: "12px 16px",
          }}>
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {attachments.map((f, i) => (
                  <FileBadge key={i} file={f} onRemove={() => setAttachments(prev => prev.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{
              display: "flex", gap: "8px", alignItems: "flex-end",
              background: "#f8f9fe",
              border: "1px solid #c7d2fe",
              borderRadius: "10px",
              padding: "8px 12px",
              boxShadow: "0 0 0 3px rgba(99,102,241,0.06)",
            }}>
              {/* Attach file button */}
              <button onClick={() => fileInputRef.current?.click()} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#8891a8", padding: "4px", flexShrink: 0, borderRadius: "5px",
                transition: "all 0.13s ease", alignSelf: "flex-end",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#8891a8"; e.currentTarget.style.background = "none"; }}
                title="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <input ref={fileInputRef} type="file" multiple style={{ display: "none" }}
                onChange={e => handleChatFileAttach(e.target.files)} />

              <textarea
                id="ai-chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your customers, segments, campaigns… (Shift+Enter for new line)"
                rows={1}
                style={{
                  flex: 1, border: "none", background: "transparent",
                  outline: "none", resize: "none", fontSize: "13.5px",
                  color: "#1a1d2e", fontFamily: "var(--font-sans)",
                  lineHeight: 1.6, maxHeight: "120px", overflowY: "auto",
                  padding: "2px 0",
                }}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />

              {/* Send button */}
              <button
                id="ai-send-btn"
                onClick={handleSend}
                disabled={(!input.trim() && !attachments.length) || isTyping}
                style={{
                  width: 34, height: 34, borderRadius: "8px", flexShrink: 0,
                  border: "none", cursor: (!input.trim() && !attachments.length) || isTyping ? "not-allowed" : "pointer",
                  background: (!input.trim() && !attachments.length) || isTyping ? "#e0e7ff" : "#6366f1",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s ease",
                  boxShadow: (!input.trim() && !attachments.length) || isTyping ? "none" : "0 2px 8px rgba(99,102,241,0.35)",
                }}
              >
                {isTyping
                  ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                  : <Send size={14} />}
              </button>
            </div>

            {/* Hints */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "7px" }}>
              <span style={{ fontSize: "10.5px", color: "#b9bece", display: "flex", alignItems: "center", gap: "3px" }}>
                <CornerDownLeft size={10} /> Enter to send · Shift+Enter for new line
              </span>
              <span style={{ fontSize: "10.5px", color: "#b9bece", marginLeft: "auto" }}>
                {kbDocs.filter(d=>d.status==="ready").length} docs in context
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Context ───────────────────── */}
        {showRight && (
          <div style={{
            display: "flex", flexDirection: "column",
            background: "#fff",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}>
            {/* Right panel tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-surface-border)", background: "#f8f9fe", flexShrink: 0 }}>
              {[
                { id: "context", label: "Context" },
                { id: "sources", label: "Sources" },
              ].map(t => (
                <button key={t.id} onClick={() => setRightPanel(t.id)} style={{
                  flex: 1, padding: "10px 8px", border: "none", background: "transparent",
                  fontSize: "12px", fontWeight: rightPanel === t.id ? 700 : 500,
                  color: rightPanel === t.id ? "#6366f1" : "#8891a8",
                  borderBottom: rightPanel === t.id ? "2px solid #6366f1" : "2px solid transparent",
                  cursor: "pointer", marginBottom: "-1px",
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>

              {/* Context Panel */}
              {rightPanel === "context" && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
                      Workspace status
                    </p>

                    <div style={{ padding: "12px", borderRadius: "8px", background: "#eef2ff", border: "1px solid #c7d2fe", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
                        <Database size={14} color="#6366f1" />
                        <p style={{ fontSize: "12.5px", fontWeight: 700, color: "#4338ca", margin: 0 }}>
                          {sessions.find((s) => s.id === activeSession)?.title || "Active session"}
                        </p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[
                          { label: "Indexed docs", value: kbDocs.filter(doc => doc.status === "ready").length },
                          { label: "Pending docs", value: kbDocs.filter(doc => doc.status === "processing").length },
                          { label: "Messages", value: activeMessages.length },
                          { label: "Last query", value: activeMessages.filter(m => m.role === "user").slice(-1)[0]?.content || "No query yet" },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p style={{ fontSize: "9.5px", color: "#8891a8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 1px" }}>{label}</p>
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "#1a1d2e", margin: 0, wordBreak: "break-word" }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--color-surface-border)" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
                        Workspace guidance
                      </p>
                      <p style={{ fontSize: "12px", color: "#4b5168", lineHeight: 1.7, margin: 0 }}>
                        Upload customer, campaign, or revenue documents so the assistant can answer questions with real workspace context. You can also start a new session to keep conversations focused on a specific business problem.
                      </p>
                    </div>
                  </>
                )}

              {/* Sources Panel */}
              {rightPanel === "sources" && (
                <>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
                    Active Knowledge Base
                  </p>
                  {kbDocs.map(doc => (
                    <div key={doc.id} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 10px", borderRadius: "7px", marginBottom: "5px",
                      border: "1px solid var(--color-surface-border)",
                      background: doc.status === "ready" ? "#fff" : "#fffbeb",
                    }}>
                      <FileText size={13} color={ACCEPTED_TYPES[doc.type]?.color || "#6366f1"} style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: "11.5px", fontWeight: 600, color: "#1a1d2e", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.name}
                        </p>
                        <p style={{ fontSize: "10px", color: "#8891a8", margin: 0 }}>
                          {doc.status === "ready" ? `${doc.chunks} chunks` : "Processing…"}
                        </p>
                      </div>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: doc.status === "ready" ? "#10b981" : "#f59e0b",
                      }} />
                    </div>
                  ))}

                  {activeMessages.length > 0 && (
                    <>
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "14px 0 8px" }}>
                        Last Response Sources
                      </p>
                      {(activeMessages.filter(m=>m.role==="ai").slice(-1)[0]?.sources || []).map(src => (
                        <div key={src} style={{
                          display: "flex", alignItems: "center", gap: "7px",
                          padding: "8px 10px", borderRadius: "7px", marginBottom: "5px",
                          border: "1px solid #c7d2fe", background: "#eef2ff",
                        }}>
                          <Star size={12} color="#6366f1" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: "11.5px", color: "#4338ca", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {src}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Shared action button style ──────────────────────── */
const actionBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: "4px",
  padding: "3px 7px", borderRadius: "5px", border: "1px solid #e8eaf2",
  background: "#fff", color: "#4b5168", fontSize: "11px", fontWeight: 500,
  cursor: "pointer", transition: "all 0.13s ease",
};

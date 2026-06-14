import React from "react";
import * as Icons from "lucide-react";

export default function EmptyState({
  iconName = "Inbox",
  title = "No Data Available",
  description = "Get started by creating your first record or importing existing telemetry datasets.",
  actionText = "Add Record",
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) {
  const isDark = document.documentElement.classList.contains("dark");
  const LucideIcon = Icons[iconName] || Icons.Inbox;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 30px",
        margin: "30px auto",
        maxWidth: "460px",
        width: "100%",
        animation: "crmFadeIn 0.35s ease-out",
      }}
      className="glass-card"
    >
      {/* Icon Area */}
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "16px",
          background: isDark
            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))"
            : "linear-gradient(135deg, #e0e7ff, #fbcfe8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          boxShadow: isDark
            ? "0 8px 20px rgba(0, 0, 0, 0.3)"
            : "0 8px 20px rgba(99, 102, 241, 0.1)",
        }}
      >
        <LucideIcon
          size={28}
          color={isDark ? "#a5b4fc" : "#4f46e5"}
          strokeWidth={1.8}
        />
      </div>

      {/* Text Headline */}
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          margin: "0 0 8px 0",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: "13px",
          color: "var(--color-text-muted)",
          lineHeight: 1.5,
          margin: "0 0 24px 0",
        }}
      >
        {description}
      </p>

      {/* Call to Action */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        {onAction && actionText && (
          <button
            onClick={onAction}
            className="glass-btn-primary"
            style={{
              padding: "9px 22px",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
              transition: "all 0.2s ease",
            }}
          >
            {actionText}
          </button>
        )}
        {onSecondaryAction && secondaryActionText && (
          <button
            onClick={onSecondaryAction}
            className="glass-btn-secondary"
            style={{
              padding: "9px 22px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "10px",
              background: "transparent",
              color: isDark ? "#a5b4fc" : "#4f46e5",
              border: isDark ? "1px solid rgba(165,180,252,0.30)" : "1px solid rgba(99,102,241,0.30)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
}

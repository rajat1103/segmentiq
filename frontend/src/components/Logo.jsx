/* ── SegmentIQ brand mark (3D glassmorphic S-curve) ── */
export function SegmentIQLogo({ size = 28 }) {
  return (
    <img
      src="/segmentiq-logo.png"
      alt="SegmentIQ"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0, objectFit: "contain" }}
    />
  );
}

/* ── Prism AI logo (deep-indigo triangular prism with
   violet-cyan light refraction) ─────────────────────── */
export function PrismLogo({ size = 28 }) {
  return (
    <img
      src="/prism-logo.png"
      alt="Prism AI"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0, objectFit: "contain" }}
    />
  );
}

/* ── Full SegmentIQ brand lockup: logo + wordmark ───── */
export function SegmentIQBrand({ collapsed = false, size = 28 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <SegmentIQLogo size={size} />
      {!collapsed && (
        <div>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "14px",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: "-0.01em",
          }}>
            SegmentIQ
          </p>
          <p style={{
            fontSize: "10px",
            color: "var(--color-text-muted)",
            margin: 0,
            lineHeight: 1.2,
          }}>
            CRM Platform
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Full Prism AI lockup: prism logo + wordmark ─────── */
export function PrismBrand({ size = 28, subtitle = "Powered by Gemini" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <PrismLogo size={size} />
      <div>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "14px",
          fontWeight: 800,
          color: "#2563eb",
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
        }}>
          Prism
        </p>
        <p style={{
          fontSize: "9.5px",
          color: "#8891a8",
          margin: 0,
          lineHeight: 1.2,
        }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default SegmentIQLogo;

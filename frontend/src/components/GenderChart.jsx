import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const GENDER_COLORS = {
  Male:   "#6366f1",
  Female: "#f472b6",
  Other:  "#34d399",
  male:   "#6366f1",
  female: "#f472b6",
  other:  "#34d399",
};

const FALLBACK_COLORS = ["#6366f1", "#f472b6", "#34d399", "#f59e0b", "#06b6d4"];

function GenderTooltip({ active, payload }) {
  const isDark = document.documentElement.classList.contains("dark");
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: isDark ? "rgba(15,23,42,0.96)" : "#fff",
      border: isDark ? "1px solid rgba(148,163,184,0.20)" : "1px solid #e8eaf2",
      borderRadius: "8px",
      padding: "10px 14px",
      boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.30)" : "0 4px 16px rgba(99,102,241,0.10)",
      fontFamily: "var(--font-sans)",
      color: "var(--color-text-primary)",
    }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
        {name}
      </p>
      <p style={{ fontSize: "13px", color: "var(--color-accent-indigo)", margin: 0, fontWeight: 600 }}>
        {value?.toLocaleString()} customers
      </p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: "16px",
      flexWrap: "wrap",
      marginTop: "8px",
    }}>
      {payload?.map((entry, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: entry.color,
          }} />
          <span style={{
            fontSize: "11.5px",
            color: "#4b5168",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
          }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function GenderChart({ data }) {
  const total = data?.reduce((s, d) => s + (d.count || 0), 0) || 1;
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="gender"
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          strokeWidth={2}
          stroke={isDark ? "rgba(255,255,255,0.10)" : "#fff"}
        >
          {data?.map((entry, i) => (
            <Cell
              key={i}
              fill={GENDER_COLORS[entry.gender] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<GenderTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.08)" : "rgba(226,232,255,0.35)" }} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default GenderChart;
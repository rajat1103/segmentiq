import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* Pastel indigo gradient palette for bars */
const BAR_COLORS = [
  "#6366f1","#818cf8","#a5b4fc","#8b5cf6",
  "#c4b5fd","#7c3aed","#4f46e5","#06b6d4",
  "#0ea5e9","#38bdf8","#67e8f9","#22d3ee",
];

function CustomTooltip({ active, payload, label }) {
  const isDark = document.documentElement.classList.contains("dark");
  if (!active || !payload?.length) return null;
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
      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: "13px", color: "var(--color-accent-indigo)", margin: 0, fontWeight: 600 }}>
        {payload[0].value.toLocaleString()} customers
      </p>
    </div>
  );
}

function CityChart({ data }) {
  const isDark = document.documentElement.classList.contains("dark");
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        barSize={28}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? "rgba(148,163,184,0.18)" : "#f0f1f8"}
          vertical={false}
        />
        <XAxis
          dataKey="city"
          tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.08)" : "#eef2ff" }} />
        <Bar dataKey="customers" radius={[4, 4, 0, 0]}>
          {data?.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default CityChart;
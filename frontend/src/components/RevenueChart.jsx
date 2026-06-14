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

const REVENUE_COLORS = [
  "#10b981","#059669","#34d399","#6ee7b7",
  "#0ea5e9","#06b6d4","#38bdf8","#818cf8",
  "#a78bfa","#f472b6","#fb7185","#fbbf24",
];

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e8eaf2",
      borderRadius: "8px",
      padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(16,185,129,0.12)",
      fontFamily: "var(--font-sans)",
    }}>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "#1a1d2e", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: "13px", color: "#10b981", margin: 0, fontWeight: 600 }}>
        ₹{Number(payload[0].value).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
        barSize={28}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f1f8"
          vertical={false}
        />
        <XAxis
          dataKey="city"
          tick={{ fontSize: 11, fill: "#8891a8", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8891a8", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<RevenueTooltip />} cursor={{ fill: "#f0fdf4" }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {data?.map((_, i) => (
            <Cell key={i} fill={REVENUE_COLORS[i % REVENUE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RevenueChart;
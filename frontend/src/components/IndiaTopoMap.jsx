import { useState, useRef, memo, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "@vnedyalk0v/react19-simple-maps";

const INDIA_TOPO = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

const CITY_METADATA = {
  Delhi:     { coordinates: [77.2090, 28.6139], color: "#3b82f6", growth: 15.2 },
  Mumbai:    { coordinates: [72.8777, 19.0760], color: "#10b981", growth: 18.7 },
  Bangalore: { coordinates: [77.5946, 12.9716], color: "#0ea5e9", growth: 22.1 },
  Chennai:   { coordinates: [80.2707, 13.0827], color: "#2563eb", growth: 12.4 },
  Hyderabad: { coordinates: [78.4867, 17.3850], color: "#f59e0b", growth: 9.8 },
  Pune:      { coordinates: [73.8567, 18.5204], color: "#8b5cf6", growth: 14.3 },
};

const CITY_ALIASES = {
  "new delhi": "Delhi",
  "delhi ncr": "Delhi",
  "ncr": "Delhi",
  "bombay": "Mumbai",
  "bangalore": "Bangalore",
  "bengaluru": "Bangalore",
  "chenai": "Chennai",
  "chennai": "Chennai",
  "hyderabad": "Hyderabad",
  "pune": "Pune",
};

const normalizeCityName = (cityName) => {
  if (!cityName) return "";
  const normalized = cityName.trim().toLowerCase();
  return CITY_ALIASES[normalized] || cityName.trim();
};

const getRelativeTooltip = (event) => {
  const padding = 18;
  const x = event.clientX + padding;
  const y = event.clientY + padding;
  return { x, y };
};

const IndiaTopoMap = memo(function IndiaTopoMap({ cities = [], revenue = [] }) {
  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);
  const isDark = document.documentElement.classList.contains("dark");

  const telemetryCities = useMemo(() => {
    return cities
      .map((city) => {
        const normalizedName = normalizeCityName(city.city || "");
        const meta = CITY_METADATA[normalizedName];
        if (!meta || city.count == null || city.count === 0) return null;
        const revenueItem = revenue.find((r) => normalizeCityName(r.city) === normalizedName);
        return {
          name: normalizedName,
          coordinates: meta.coordinates,
          color: meta.color,
          count: city.count,
          revenue: revenueItem?.revenue || 0,
          growth: meta.growth,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count);
  }, [cities, revenue]);

  const hasTelemetry = telemetryCities.length > 0;

  const getCityData = (cityName) => {
    const picked = telemetryCities.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    const fallback = CITY_METADATA[cityName];
    return {
      customers: picked?.count || 0,
      revenue: picked?.revenue || 0,
      growth: picked?.growth || fallback?.growth || 0,
    };
  };

  const renderCityTooltip = () => {
    if (!hoveredCity) return null;
    const data = getCityData(hoveredCity);
    const city = CITY_METADATA[hoveredCity];
    return (
      <div
        style={{
          position: "absolute",
          left: tooltip.x,
          top: tooltip.y,
          background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: isDark ? "1px solid rgba(51,65,85,0.60)" : "1px solid rgba(199,210,254,0.80)",
          boxShadow: "0 8px 32px rgba(15,23,42,0.18)",
          padding: "11px 14px",
          borderRadius: "12px",
          zIndex: 1000,
          pointerEvents: "none",
          minWidth: "170px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: city?.color, flexShrink: 0 }} />
          <p style={{ fontSize: "13px", fontWeight: 800, margin: 0, color: isDark ? "#f1f5f9" : "#0f172a" }}>
            {hoveredCity}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {[
            { label: "Customers", value: data.customers, color: city?.color || "#ffffff" },
            { label: "Revenue", value: `₹${(data.revenue / 100000).toFixed(1)}L`, color: "#10b981" },
            { label: "Growth", value: `+${data.growth}%`, color: "#3b82f6" },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                style={{
                  fontSize: "9.5px",
                  color: isDark ? "#64748b" : "#94a3b8",
                  margin: "0 0 1px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </p>
              <p style={{ fontSize: "13px", fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectedCityPanel = () => {
    if (!selectedCity) return null;
    const data = getCityData(selectedCity);
    const city = CITY_METADATA[selectedCity];
    return (
      <div
        style={{
          position: "absolute",
          right: 18,
          bottom: 18,
          width: "220px",
          background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.96)",
          border: isDark ? "1px solid rgba(71,85,105,0.55)" : "1px solid rgba(148,163,184,0.22)",
          boxShadow: "0 20px 50px rgba(15,23,42,0.16)",
          borderRadius: "18px",
          padding: "16px",
          zIndex: 900,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: city?.color, boxShadow: `0 0 16px ${city?.color}70` }} />
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedCity}</p>
            <p style={{ margin: 0, fontSize: "11px", color: isDark ? "#94a3b8" : "#475569" }}>
              Tap any city marker to compare campaign readiness.
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gap: "10px" }}>
          {[
            { label: "Customers", value: data.customers.toLocaleString("en-IN"), accent: city?.color || "#fff" },
            { label: "Revenue", value: `₹${(data.revenue / 100000).toFixed(1)}L`, accent: "#10b981" },
            { label: "Growth", value: `+${data.growth}%`, accent: "#3b82f6" },
          ].map((stat) => (
            <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "10px", color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                {stat.label}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: stat.accent }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTelemetryEmptyState = () => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: isDark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.80)",
        color: isDark ? "#e2e8f0" : "#0f172a",
        textAlign: "center",
        padding: "24px",
        zIndex: 800,
      }}
    >
      <div style={{ maxWidth: "300px" }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isDark ? "#93c5fd" : "#4f46e5" }}>
          Live India Telemetry
        </p>
        <h3 style={{ margin: "12px 0 8px", fontSize: "20px", fontWeight: 800, color: "inherit" }}>
          No customer locations available
        </h3>
        <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: isDark ? "#cbd5e1" : "#475569" }}>
          SegmentIQ is waiting for live customer telemetry. When the first customer enters the workspace, their city location will appear on the map.
        </p>
      </div>
    </div>
  );

  const getMarkerRadius = (count) => Math.min(24, 5 + Math.sqrt(count) * 1.5);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", position: "relative" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 960, center: [82, 23] }}
          style={{ width: "100%", height: "100%", cursor: hasTelemetry ? "grab" : "default" }}
        >
          <Geographies geography={INDIA_TOPO}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: isDark ? "rgba(30,41,59,0.70)" : "rgba(219,234,254,0.60)",
                      stroke: isDark ? "#334155" : "#93c5fd",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: isDark ? "rgba(51,65,85,0.80)" : "rgba(191,219,254,0.80)",
                      stroke: isDark ? "#60a5fa" : "#60a5fa",
                      strokeWidth: 0.8,
                      outline: "none",
                    },
                    pressed: {
                      fill: "rgba(147,197,253,0.60)",
                      outline: "none",
                    },
                  }}
                />
              ))
            }
          </Geographies>

          {hasTelemetry && telemetryCities.map((city) => {
            const isHovered = hoveredCity === city.name;
            return (
              <Marker
                key={city.name}
                coordinates={city.coordinates}
                onMouseEnter={(e) => {
                  setHoveredCity(city.name);
                  setTooltip(getRelativeTooltip(e));
                }}
                onMouseLeave={() => setHoveredCity(null)}
                onMouseMove={(e) => setTooltip(getRelativeTooltip(e))}
                onClick={() => setSelectedCity(city.name)}
              >
                <circle
                  r={getMarkerRadius(city.count)}
                  fill={city.color}
                  fillOpacity={0.12}
                  style={{ transition: "all 0.2s ease", cursor: "pointer" }}
                />
                <circle
                  r={Math.max(4, getMarkerRadius(city.count) * 0.55)}
                  fill={city.color}
                  fillOpacity={0.28}
                  style={{ transition: "all 0.2s ease" }}
                />
                <circle
                  r={isHovered ? 6.5 : 4.5}
                  fill={city.color}
                  stroke="white"
                  strokeWidth={1.5}
                  style={{
                    filter: `drop-shadow(0 0 6px ${city.color}80)`,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                />
                <text
                  textAnchor="middle"
                  y={isHovered ? -18 : -14}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: isHovered ? "8px" : "6px",
                    fontWeight: "700",
                    fill: isDark ? "#e2e8f0" : "#1e3a5f",
                    transition: "all 0.2s ease",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {city.name}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>

        {!hasTelemetry && renderTelemetryEmptyState()}
        {renderCityTooltip()}
        {renderSelectedCityPanel()}
      </div>
    </div>
  );
});

export default IndiaTopoMap;

import {
  LayoutDashboard,
  Users,
  Megaphone,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crown,
  Zap,
  HelpCircle,
  Calendar,
  User,
  CreditCard,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SegmentIQLogo, PrismLogo } from "./Logo";
import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/* Navigation items */
const NAV_ITEMS = [
  {
    group: "Command",
    items: [
      { name: "Command Center", path: "/command-center", icon: Crown },
    ],
  },
  {
    group: "Core",
    items: [
      { name: "Dashboard",          path: "/dashboard",          icon: LayoutDashboard },
      { name: "Customers",          path: "/customers",          icon: Users           },
      { name: "Campaigns",          path: "/campaigns",          icon: Megaphone       },
      { name: "Communication Logs", path: "/communication-logs", icon: MessageSquare   },
      { name: "Festival Calendar",  path: "/calendar",           icon: Calendar        },
    ],
  },
  {
    group: "System & Config",
    items: [
      { name: "Settings",           path: "/settings",           icon: Settings        },
      { name: "Help Center",        path: "/help",               icon: HelpCircle      },
    ],
  },
  {
    group: "AI Features",
    items: [
      { name: "Prism AI", path: "/segment-ai", icon: null, isPrism: true, badge: "Beta" },
    ],
  },
];

/* User Dropdown Menu */
function UserDropdown({ userName, userRole, userEmail, onLogout, onClose }) {
  const dropRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const MENU_ITEMS = [
    { icon: User,            label: "Account Settings", action: () => {}, color: "#64748b" },
    { icon: CreditCard,      label: "Billing & Plans",  action: () => {}, color: "#64748b" },
    { icon: SlidersHorizontal,label: "Preferences",     action: () => {}, color: "#64748b" },
  ];

  return (
    <div ref={dropRef} style={{
      position: "absolute",
      bottom: "calc(100% + 6px)",
      left: 0,
      right: 0,
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(226,232,255,0.70)",
      borderRadius: "12px",
      boxShadow: "0 -8px 40px rgba(99,102,241,0.16), 0 4px 20px rgba(15,23,42,0.10)",
      overflow: "hidden",
      animation: "dropUp 0.16s cubic-bezier(0.4,0,0.2,1)",
      zIndex: 100,
    }}>
      {/* Profile header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(226,232,255,0.50)",
        background: "linear-gradient(135deg, rgba(238,242,255,0.60), rgba(240,253,244,0.40))",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: 800, color: "#ffffff",
          flexShrink: 0, boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
        }}>
          {userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </p>
          <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userRole}
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: "6px" }}>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 10px", borderRadius: "8px",
                border: "none", background: "transparent",
                cursor: "pointer", transition: "all 0.12s ease",
                textAlign: "left",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(238,242,255,0.70)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Icon size={14} color="#6366f1" />
              <span style={{ fontSize: "12.5px", fontWeight: 500, color: "#334155" }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Email + Logout */}
      <div style={{ padding: "6px", borderTop: "1px solid rgba(226,232,255,0.50)" }}>
        {userEmail && (
          <p style={{ fontSize: "10px", color: "#94a3b8", padding: "4px 10px", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </p>
        )}
        <button
          onClick={onLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "8px 10px", borderRadius: "8px",
            border: "none", background: "transparent",
            cursor: "pointer", transition: "all 0.12s ease",
            textAlign: "left",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(254,226,226,0.55)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <LogOut size={14} color="#dc2626" />
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#dc2626" }}>Logout</span>
        </button>
      </div>

      <style>{`
        @keyframes dropUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const userRole = "Administrator";
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/" || location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  /* Glass sidebar style */
  const sidebarStyle = {
    width: collapsed ? "64px" : "220px",
    transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    background: "var(--color-sidebar-bg)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRight: "1px solid var(--color-sidebar-border)",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
    flexShrink: 0,
  };

  return (
    <aside style={sidebarStyle}>

      {/* ── Brand Header ─────────────────────────────────── */}
      <div style={{
        height: "56px",
        borderBottom: "1px solid var(--color-sidebar-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: collapsed ? "0 14px" : "0 14px",
        flexShrink: 0,
        background: "var(--glass-bg-subtle)",
      }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              width: 30, height: 30,
              borderRadius: "8px",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(99,102,241,0.20)",
            }}>
              <SegmentIQLogo size={30} />
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "13.5px",
                fontWeight: 800,
                color: "var(--color-text-primary)",
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}>SegmentIQ</p>
              <p style={{ fontSize: "9.5px", color: "var(--color-text-muted)", margin: 0 }}>CRM Platform</p>
            </div>
          </div>
        )}
        {collapsed && <SegmentIQLogo size={28} />}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: "4px",
            borderRadius: "6px",
            border: "1px solid var(--color-sidebar-border)",
            background: "var(--glass-bg)",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            flexShrink: 0,
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-surface-hover)";
            e.currentTarget.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--glass-bg)";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((group) => (
          <div key={group.group} style={{ marginBottom: "6px" }}>
            {!collapsed && (
              <p style={{
                fontSize: "9.5px",
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "rgba(136,145,168,0.70)",
                padding: "8px 10px 4px",
                margin: 0,
              }}>
                {group.group}
              </p>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.name : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: collapsed ? "9px 14px" : "8px 10px",
                    borderRadius: "6px",
                    marginBottom: "2px",
                    textDecoration: "none",
                    transition: "all 0.13s ease",
                    background: active ? "var(--color-sidebar-active-bg)" : "transparent",
                    color: active ? "var(--color-sidebar-active-text)" : "var(--color-text-secondary)",
                    borderLeft: active ? "2.5px solid var(--color-sidebar-active-border)" : "2.5px solid transparent",
                    fontWeight: active ? 600 : 400,
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                    backdropFilter: active ? "blur(6px)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--color-surface-hover)";
                      e.currentTarget.style.color = "var(--color-text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--color-text-secondary)";
                    }
                  }}
                >
                  {item.isPrism
                    ? <div style={{ width: 18, height: 18, flexShrink: 0 }}><PrismLogo size={18} /></div>
                    : <Icon size={15} style={{ flexShrink: 0 }} />}

                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>{item.name}</span>
                      {item.badge && (
                        <span style={{
                          background: "var(--color-sidebar-active-bg)",
                          color: "var(--color-sidebar-active-text)",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "99px",
                          letterSpacing: "0.04em",
                          border: "1px solid var(--color-sidebar-border)",
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom: User + Logout ─────────────── */}
      <div style={{
        borderTop: "1px solid var(--color-sidebar-border)",
        padding: "8px",
        flexShrink: 0,
        background: "var(--glass-bg-subtle)",
        position: "relative",
      }}>
        {/* User chip — clickable to open dropdown */}
        {!collapsed && (
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 10px",
              borderRadius: "8px",
              background: userMenuOpen ? "rgba(238,242,255,0.80)" : "var(--color-surface-hover)",
              marginBottom: "4px",
              border: `1px solid ${userMenuOpen ? "rgba(165,180,252,0.50)" : "var(--color-sidebar-border)"}`,
              width: "100%",
              cursor: "pointer",
              transition: "all 0.13s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(238,242,255,0.70)"}
            onMouseLeave={e => e.currentTarget.style.background = userMenuOpen ? "rgba(238,242,255,0.80)" : "var(--color-surface-hover)"}
          >
            <div style={{
              width: "28px", height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(99,102,241,0.30)",
            }}>
              {userInitials}
            </div>
            <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                {userName}
              </p>
              <p style={{ fontSize: "9.5px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, fontWeight: 500 }}>
                {userRole.split("/")[0].trim()}
              </p>
            </div>
            {userMenuOpen ? <ChevronDown size={12} color="var(--color-text-muted)" /> : <ChevronUp size={12} color="var(--color-text-muted)" />}
          </button>
        )}

        {/* User dropdown */}
        {userMenuOpen && !collapsed && (
          <UserDropdown
            userName={userName}
            userRole={userRole}
            userEmail={userEmail}
            onLogout={handleLogout}
            onClose={() => setUserMenuOpen(false)}
          />
        )}

        {/* Collapsed: just logout icon */}
        {collapsed && (
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "9px 14px",
              borderRadius: "7px", border: "none", background: "transparent",
              color: "#dc2626", fontSize: "13px",
              cursor: "pointer", transition: "all 0.13s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(254,226,226,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
          </button>
        )}
      </div>
    </aside>
  );
}
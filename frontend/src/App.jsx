import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Dashboard         from "./pages/Dashboard";
import Analytics         from "./pages/Analytics";
import Customers         from "./pages/Customers";
import Campaigns         from "./pages/Campaigns";
import CommunicationLogs from "./pages/CommunicationLogs";
import SegmentAI         from "./pages/SegmentAI";
import CommandCenter     from "./pages/CommandCenter";
import Settings          from "./pages/Settings";
import Help              from "./pages/Help";
import Calendar          from "./pages/Calendar";
import Login             from "./pages/Login";
import Signup            from "./pages/Signup";
import Welcome           from "./pages/Welcome";
import Layout            from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DatasetProvider } from "./context/DatasetContext";

/* ── ProtectedRoute ──────────────────────────────────────── */
function ProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #fce7f3 0%, #e0f2fe 30%, #f0fdf4 60%, #ede9fe 100%)"
      }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e2e8f0", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Verify onboarding status
  const completedOnboarding = localStorage.getItem(`onboarding_completed_${user?.email}`) === "true";
  if (!completedOnboarding) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <DatasetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Public Routes ───────────────────────────── */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ── Welcome Onboarding Route ────────────────── */}
            <Route path="/welcome" element={<Welcome />} />

            {/* ── Protected Routes ────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/"                   element={<Navigate to="/command-center" replace />} />
              <Route path="/command-center"     element={<CommandCenter />} />
              <Route path="/dashboard"          element={<Dashboard />} />
              <Route path="/analytics"          element={<Analytics />} />
              <Route path="/customers"          element={<Customers />} />
              <Route path="/campaigns"          element={<Campaigns />} />
              <Route path="/communication-logs" element={<CommunicationLogs />} />
              <Route path="/segment-ai"         element={<SegmentAI />} />
              <Route path="/calendar"           element={<Calendar />} />
              <Route path="/settings"           element={<Settings />} />
              <Route path="/help"               element={<Help />} />
            </Route>

            {/* ── Catch-all ────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/command-center" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DatasetProvider>
  );
}

export default App;
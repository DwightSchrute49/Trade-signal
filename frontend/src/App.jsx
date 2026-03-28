import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import MarketScreenerPage from "./pages/MarketScreenerPage";
import ReversalAlertsPage from "./pages/ReversalAlertsPage";
import BestBuyOpportunitiesPage from "./pages/BestBuyOpportunitiesPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import "./App.css";

// Protect routes — redirect to /login if not authenticated
function PrivateRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuth } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuth ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuth ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuth ? <Navigate to="/" replace /> : <ForgotPasswordPage />}
      />
      <Route path="/" element={isAuth ? <Dashboard /> : <LandingPage />} />
      <Route
        path="/market-screener"
        element={
          <PrivateRoute>
            <MarketScreenerPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reversal-alerts"
        element={
          <PrivateRoute>
            <ReversalAlertsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/best-buys"
        element={
          <PrivateRoute>
            <BestBuyOpportunitiesPage />
          </PrivateRoute>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

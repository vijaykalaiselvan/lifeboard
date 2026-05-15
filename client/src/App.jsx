import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import FinancePage from "./pages/finance/FinancePage";
import ComingSoon from "./pages/ComingSoon";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/finance" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/finance" replace /> : <RegisterPage />} />

      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/finance"   element={<FinancePage />} />
                <Route path="/tasks"     element={<ComingSoon title="Tasks"     icon="✅" />} />
                <Route path="/notes"     element={<ComingSoon title="Notes"     icon="📝" />} />
                <Route path="/habits"    element={<ComingSoon title="Habits"    icon="🔥" />} />
                <Route path="/goals"     element={<ComingSoon title="Goals"     icon="🎯" />} />
                <Route path="/dashboard" element={<ComingSoon title="Dashboard" icon="📊" />} />
                <Route path="*"          element={<Navigate to="/finance" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
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

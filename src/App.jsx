import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import { useSocket } from "./hooks/useSocket";

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  const location = useLocation();
  return token ? children : <Navigate to={`/login${location.search}`} replace />;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!token) return <Navigate to={`/login${location.search}`} replace />;
  if (user?.role !== "admin") return <Navigate to={`/${location.search}`} replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  const location = useLocation();
  return token ? <Navigate to={`/${location.search}`} replace /> : children;
};

function AppContent() {
  useSocket();
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
          duration: 3000,
        }}
      />
    </BrowserRouter>
  );
}

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { useSocket } from "./hooks/useSocket";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  const location = useLocation();
  return token ? children : <Navigate to={`/login${location.search}`} replace />;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!token) return <Navigate to={`/login${location.search}`} replace />;
  if (user?.role !== "admin" && user?.role !== "superadmin") {
    return (
      <ErrorPage
        code={403}
        message="Access Forbidden"
        description="You do not have administrative privileges to access this area."
      />
    );
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  const location = useLocation();
  return token ? <Navigate to={`/${location.search}`} replace /> : children;
};

function RouteLoaderSkeleton() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <div className="absolute w-6 h-6 bg-brand-500/10 rounded-full animate-pulse" />
      </div>
      <p className="text-xs text-slate-500 mt-4 animate-pulse">Loading secure content...</p>
    </div>
  );
}

function AppContent() {
  useSocket();
  return (
    <Suspense fallback={<RouteLoaderSkeleton />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/unauthorized" element={<ErrorPage code={403} message="Access Forbidden" description="You do not have permission to access this resource." />} />
        <Route path="/server-error" element={<ErrorPage code={500} message="Server Error" description="An unexpected error occurred on the server. Please try again later." />} />
        <Route path="*" element={<ErrorPage code={404} message="Page Not Found" description="The page you are looking for does not exist or has been moved." />} />
      </Routes>
    </Suspense>
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

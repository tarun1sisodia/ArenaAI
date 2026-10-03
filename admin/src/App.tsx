import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LoginPage } from "@/components/login/LoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardPage } from "@/pages/DashboardPage";

const BookingsPage = lazy(() => import("@/pages/BookingsPage").then((m) => ({ default: m.BookingsPage })));
const FinancePage = lazy(() => import("@/pages/FinancePage").then((m) => ({ default: m.FinancePage })));
const CatalogPage = lazy(() => import("@/pages/CatalogPage").then((m) => ({ default: m.CatalogPage })));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const RentalRequestsPage = lazy(() => import("@/pages/RentalRequestsPage").then((m) => ({ default: m.RentalRequestsPage })));
const InquiriesPage = lazy(() => import("@/pages/InquiriesPage").then((m) => ({ default: m.InquiriesPage })));
const FaresPage = lazy(() => import("@/pages/FaresPage").then((m) => ({ default: m.FaresPage })));
const AuditPage = lazy(() => import("@/pages/AuditPage").then((m) => ({ default: m.AuditPage })));
import { AUTH_EXPIRED_EVENT, clearSession, getStoredSession, saveSession, validateStoredSession } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

import { AuthCallbackPage } from "@/pages/AuthCallbackPage";

function Root({ user, onLogin, onLogout }: { user: AdminUser | null; onLogin: (u: AdminUser) => void; onLogout: () => void }) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isOAuthCallback =
    typeof window !== "undefined" &&
    (window.location.pathname === "/auth/callback" ||
      Boolean(searchParams?.has("code")) ||
      Boolean(searchParams?.has("error")) ||
      window.location.hash.includes("access_token="));

  if (!user && isOAuthCallback) {
    return (
      <AuthCallbackPage
        onLogin={(authedUser) => {
          onLogin(authedUser);
          navigate("/", { replace: true });
        }}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/auth/callback"
        element={
          <AuthCallbackPage
            onLogin={(authedUser) => {
              onLogin(authedUser);
              navigate("/", { replace: true });
            }}
          />
        }
      />
      <Route
        path="/*"
        element={
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <LoginPage
                  onLogin={(authedUser) => {
                    onLogin(authedUser);
                    navigate("/");
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-slate-400">Loading module...</div>}>
                  <Routes>
                    <Route element={<AdminLayout user={user} onLogout={onLogout} />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="bookings" element={<BookingsPage user={user} />} />
                      <Route path="finance" element={<FinancePage user={user} />} />
                      <Route path="catalog" element={<CatalogPage user={user} />} />
                      <Route path="reviews" element={<ReviewsPage user={user} />} />
                      <Route path="inquiries" element={<InquiriesPage user={user} />} />
                      <Route path="rental-requests" element={<RentalRequestsPage user={user} />} />
                      <Route path="fares" element={<FaresPage user={user} />} />
                      <Route path="audit" element={<AuditPage user={user} />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en-IN";
    const stored = getStoredSession();
    if (!stored) {
      setAuthChecked(true);
      return;
    }

    let active = true;
    validateStoredSession(stored).then((valid) => {
      if (!active) return;
      if (valid) setUser(stored);
      else clearSession();
      setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback((authedUser: AdminUser) => {
    saveSession(authedUser);
    setUser(authedUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  if (!authChecked) return null;

  return (
    <BrowserRouter>
      <Root user={user} onLogin={login} onLogout={logout} />
    </BrowserRouter>
  );
}

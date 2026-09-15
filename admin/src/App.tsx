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
const InquiriesPage = lazy(() => import("@/pages/InquiriesPage").then((m) => ({ default: m.InquiriesPage })));
const FaresPage = lazy(() => import("@/pages/FaresPage").then((m) => ({ default: m.FaresPage })));
const AuditPage = lazy(() => import("@/pages/AuditPage").then((m) => ({ default: m.AuditPage })));
import type { AdminRole, AdminUser } from "@/lib/types";

const SESSION_KEY = "skb-admin-session";

const ROLE_PROFILES: Record<AdminRole, { name: string; email: string }> = {
  dispatcher: { name: "Priya Sharma", email: "priya@skbagheltravels.in" },
  content_editor: { name: "Ritika Kapoor", email: "ritika@skbagheltravels.in" },
  review_moderator: { name: "Ritika Kapoor", email: "ritika@skbagheltravels.in" },
  finance_operator: { name: "Nitin Baghel", email: "nitin@skbagheltravels.in" },
  super_admin: { name: "A. Baghel", email: "admin@skbagheltravels.in" },
};

function loadSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

function Root({ user, onLogin, onLogout }: { user: AdminUser | null; onLogin: (r: AdminRole) => void; onLogout: () => void }) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  return (
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
            onLogin={(role) => {
              onLogin(role);
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
                <Route path="fares" element={<FaresPage user={user} />} />
                <Route path="audit" element={<AuditPage user={user} />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [user, setUser] = useState<AdminUser | null>(loadSession);

  useEffect(() => {
    document.documentElement.lang = "en-IN";
  }, []);

  const login = useCallback((role: AdminRole) => {
    const profile = ROLE_PROFILES[role];
    const u: AdminUser = {
      id: `usr_${role}`,
      role,
      name: profile.name,
      email: profile.email,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <BrowserRouter>
      <Root user={user} onLogin={login} onLogout={logout} />
    </BrowserRouter>
  );
}

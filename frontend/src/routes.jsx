import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import TwoFactorPage from "./pages/TwoFactorPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ViewProfilePage from "./pages/ViewProfilePage";
import ChatPage from "./pages/ChatPage";
import FeedbackPage from "./pages/FeedbackPage";
import CreditsPage from "./pages/CreditsPage";
import PurchaseHistory from "./pages/PurchaseHistory";
import AdminTransactions from "./pages/AdminTransactions";
import AdminUsers from "./pages/AdminUsers";
import AdminAuditLog from "./pages/AdminAuditLog";
import AdminVerifications from "./pages/AdminVerifications";
import AdminRefunds from "./pages/AdminRefunds";
import AdminPayouts from "./pages/AdminPayouts";
import AdminReports from "./pages/AdminReports";
import VideoCallPage from "./pages/VideoCallPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AdminRoute from "./components/AdminRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <LandingPage />
      </PublicRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicRoute>
        <SignUpPage />
      </PublicRoute>
    ),
  },
  {
    path: "/verify",
    element: <TwoFactorPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/refund-policy",
    element: <RefundPolicyPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/profile/:id",
        element: <ViewProfilePage />,
      },
      {
        path: "/chat",
        element: <ChatPage />,
      },
      {
        path: "/feedback",
        element: <FeedbackPage />,
      },
      {
        path: "/credits",
        element: <CreditsPage />,
      },
      {
        path: "/credits/history",
        element: <PurchaseHistory />,
      },
      {
        path: "/meetings/:id/call",
        element: <VideoCallPage />,
      },
      {
        path: "/admin/transactions",
        element: (
          <AdminRoute>
            <AdminTransactions />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/audit-log",
        element: (
          <AdminRoute>
            <AdminAuditLog />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/verifications",
        element: (
          <AdminRoute>
            <AdminVerifications />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/refunds",
        element: (
          <AdminRoute>
            <AdminRefunds />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/payouts",
        element: (
          <AdminRoute>
            <AdminPayouts />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/reports",
        element: (
          <AdminRoute>
            <AdminReports />
          </AdminRoute>
        ),
      },
    ],
  },
]);

export default router;

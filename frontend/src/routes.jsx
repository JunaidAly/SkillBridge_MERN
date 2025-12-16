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

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/verify",
    element: <TwoFactorPage />,
  },
  {
    element: <DashboardLayout />,
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
    ],
  },
]);

export default router;

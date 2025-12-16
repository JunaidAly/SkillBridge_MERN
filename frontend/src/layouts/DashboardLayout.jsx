import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function DashboardLayout() {
  return (
    <div className="min-h-screen font-family-poppins flex bg-light-bg">
      <Sidebar />
      <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;

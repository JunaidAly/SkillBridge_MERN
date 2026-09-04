import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout() {
  return (
    <div className="min-h-screen font-family-poppins flex bg-light-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

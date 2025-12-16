import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CircleUserRound, CreditCard, MessageSquare, MessageCircle, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Profile", path: "/profile", icon: CircleUserRound },
  { name: "Credits", path: "/credits", icon: CreditCard },
  { name: "Chat & Schedule", path: "/chat", icon: MessageSquare },
  { name: "Feedback", path: "/feedback", icon: MessageCircle },
];

function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="SkillBridge" className="h-10" />
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-all"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 w-64 font-family-poppins min-h-screen bg-white border-r-2 border-[#E5E5E5] flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="SkillBridge" className="h-12" />
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <hr className="border-b mb-3 border-[#E5E5E5]" />

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === "/profile" && location.pathname.startsWith("/profile/"));
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-family-poppins text-sm transition-all ${
                      isActive
                        ? "bg-light-teal text-teal font-medium"
                        : "text-gray hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={24} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => {
              closeSidebar();
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-family-poppins text-sm text-gray hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

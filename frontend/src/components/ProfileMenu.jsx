import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { CircleUserRound, LogOut, ChevronDown } from "lucide-react";
import { logout } from "../store/authSlice";
import { fetchProfile } from "../store/profileSlice";

function ProfileMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  // authSlice's user (from login/JWT) never carries `avatar` - the real,
  // up-to-date value lives in profileSlice (populated via GET /users/me).
  const profile = useSelector((state) => state.profile.profile);
  const avatar = profile?.avatar;
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!profile) dispatch(fetchProfile());
  }, [dispatch, profile]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
    setOpen(false);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-gray-100 transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-light-teal text-teal flex items-center justify-center overflow-hidden shrink-0">
          {avatar ? (
            <img src={avatar} alt={user?.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-family-poppins text-sm font-semibold">{initial}</span>
          )}
        </div>
        <span className="hidden md:block font-family-poppins text-sm font-medium text-black max-w-[120px] truncate">
          {user?.name}
        </span>
        <ChevronDown size={16} className="hidden md:block text-gray" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E5E5E5] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E5E5]">
            <p className="font-family-poppins text-sm font-semibold text-black truncate">{user?.name}</p>
            <p className="font-family-poppins text-xs text-gray truncate">{user?.email}</p>
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 font-family-poppins text-sm text-black hover:bg-gray-50 transition-colors"
          >
            <CircleUserRound size={18} />
            View Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 font-family-poppins text-sm text-red hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;

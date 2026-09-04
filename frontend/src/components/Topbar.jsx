import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { fetchUsers } from "../store/usersSlice";
import { createConversation } from "../store/chatSlice";
import TopbarActions from "./TopbarActions";

function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users } = useSelector((state) => state.users);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [startingChatWith, setStartingChatWith] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const trimmedQuery = query.trim().toLowerCase();
  const results = trimmedQuery
    ? (users || [])
        .filter((u) => u.role !== "admin")
        .filter((u) => {
          const name = u.name?.toLowerCase() || "";
          const skills = (u.skillsTeaching || []).map((s) => s.name).join(" ").toLowerCase();
          return name.includes(trimmedQuery) || skills.includes(trimmedQuery);
        })
        .slice(0, 8)
    : [];

  const handleSelect = async (otherUserId) => {
    try {
      setStartingChatWith(otherUserId);
      const result = await dispatch(createConversation(otherUserId)).unwrap();
      setQuery("");
      setOpen(false);
      navigate("/chat", { state: { conversationId: result._id } });
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setStartingChatWith(null);
    }
  };

  return (
    <header className="hidden lg:flex h-20 sticky top-0 z-30 items-center justify-between gap-6 bg-white border-b border-[#E5E5E5] px-8">
      <div className="flex-1 max-w-md relative" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => trimmedQuery && setOpen(true)}
          placeholder="Search by skill or name..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal transition-all"
        />

        {open && trimmedQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-[#E5E5E5] max-h-80 overflow-y-auto custom-scrollbar z-50">
            {results.length === 0 ? (
              <p className="font-family-poppins text-sm text-gray text-center py-6">
                No users found.
              </p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u.id)}
                  disabled={startingChatWith === u.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray text-sm font-medium">{u.name?.charAt(0) || "U"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-family-poppins text-sm font-medium text-black truncate">{u.name}</p>
                    {u.skillsTeaching?.length > 0 && (
                      <p className="font-family-poppins text-xs text-gray truncate">
                        {u.skillsTeaching.map((s) => s.name).join(", ")}
                      </p>
                    )}
                  </div>
                  {startingChatWith === u.id && (
                    <Loader2 className="text-teal animate-spin shrink-0" size={16} />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <TopbarActions />
    </header>
  );
}

export default Topbar;

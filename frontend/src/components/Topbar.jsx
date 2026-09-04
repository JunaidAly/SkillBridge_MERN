import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import TopbarActions from "./TopbarActions";

function Topbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/dashboard?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="hidden lg:flex h-20 sticky top-0 z-30 items-center justify-between gap-6 bg-white border-b border-[#E5E5E5] px-8">
      <form onSubmit={handleSubmit} className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by skill or name..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal transition-all"
        />
      </form>
      <TopbarActions />
    </header>
  );
}

export default Topbar;

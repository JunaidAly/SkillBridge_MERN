import { useState } from "react";
import { Search, Menu } from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Alice Johnson",
    lastMessage: "Chatgram Web was upda",
    time: "19:48",
    unread: 1,
    avatar: null,
  },
  {
    id: 2,
    name: "Jessica Drew",
    lastMessage: "Ok, see you later",
    time: "18:30",
    unread: 2,
    avatar: null,
  },
  {
    id: 3,
    name: "David Moore",
    lastMessage: "You: I don't remember any",
    time: "18:16",
    unread: 0,
    avatar: null,
  },
  {
    id: 4,
    name: "Greg James",
    lastMessage: "I got a job at SpaceX",
    time: "18:02",
    unread: 0,
    avatar: null,
  },
  {
    id: 5,
    name: "Emily Dorson",
    lastMessage: "Table for four, 5PM. Be there.",
    time: "17:42",
    unread: 0,
    avatar: null,
  },
];

function ChatList({ selectedChat, onSelectChat, onToggleMobile }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 bg-white border-r border-[#E5E5E5] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray"
              size={18}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-light-gray rounded-lg font-family-poppins text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectChat(conv)}
            className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
              selectedChat?.id === conv.id
                ? "bg-light-teal"
                : "hover:bg-gray-50"
            }`}
          >
            {/* Avatar */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              {conv.avatar ? (
                <img
                  src={conv.avatar}
                  alt={conv.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray text-lg font-medium">
                  {conv.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-family-poppins text-sm font-semibold text-black truncate">
                  {conv.name}
                </h3>
                <span className="font-family-poppins text-xs text-gray">
                  {conv.time}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="font-family-poppins text-xs text-gray truncate pr-2">
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 bg-teal text-white text-xs rounded-full flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatList;

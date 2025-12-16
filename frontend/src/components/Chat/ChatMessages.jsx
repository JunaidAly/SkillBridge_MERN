import { useState } from "react";
import { Phone, Video, MoreVertical, Send, Smile, ArrowLeft } from "lucide-react";

function ChatMessages({ chat, onBack }) {
  const [message, setMessage] = useState("");

  // Mock messages data
  const messages = [
    {
      id: 1,
      text: "Hi Jane, how are you doing today? I wanted to discuss the upcoming Python session.",
      time: "18:12",
      isOwn: false,
      read: true,
    },
    {
      id: 2,
      text: "Hi Alice! I am doing well, thanks. I am available to chat about it now if you are free?",
      time: "18:12",
      isOwn: true,
      read: true,
    },
    {
      id: 3,
      text: "Yes, I am. I had a few questions about the advanced concepts we touched upon last week. Specifically, related to asynchronous programming.",
      time: "18:12",
      isOwn: false,
      read: true,
    },
    {
      id: 4,
      text: "Understood. We can go through those. Do you have specific examples or scenarios in mind?",
      time: "18:12",
      isOwn: true,
      read: true,
    },
    {
      id: 5,
      text: "I was trying to implement a web scraper, and faced some challenges with `asyncio`. I also wanted to schedule our next session for next week.",
      time: "18:12",
      isOwn: true,
      read: true,
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-light-bg">
        <p className="font-family-poppins text-gray">
          Select a conversation to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-light-bg h-full">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-[#E5E5E5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {chat.avatar ? (
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-gray font-medium">{chat.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-family-poppins text-sm font-semibold text-black">
              {chat.name}
            </h3>
            <p className="font-family-poppins text-xs text-gray">
              last seen 5 mins ago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <Phone className="text-gray" size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <Video className="text-gray" size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <MoreVertical className="text-gray" size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.isOwn
                  ? "bg-teal/20 text-black rounded-br-sm shadow-lg"
                  : "bg-white text-black rounded-bl-sm shadow-lg"
              }`}
            >
              <p className="font-family-poppins text-sm">{msg.text}</p>
              <div
                className={`flex items-center justify-end gap-1 mt-1 ${
                  msg.isOwn ? "text-white/70" : "text-gray"
                }`}
              >
                <span className="font-family-poppins text-black text-xs">{msg.time}</span>
                {msg.isOwn && msg.read && (
                  <span className="text-xs text-black">✓</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white px-4 py-3 border-t border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <Smile className="text-gray" size={20} />
          </button>
          <input
            type="text"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2.5 bg-light-gray rounded-full font-family-poppins text-sm outline-none"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-dark-blue hover:bg-dark-blue/90 rounded-full transition-all"
          >
            <Send className="text-white" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatMessages;

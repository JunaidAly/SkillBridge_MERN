import { useEffect, useMemo, useState } from "react";
import { Phone, Video, MoreVertical, Send, Smile, ArrowLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages, upsertMessage, markConversationAsRead, updateUnreadCount } from "../../store/chatSlice";
import { getSocket } from "../../socket";

function ChatMessages({ chat, onBack }) {
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const { messagesByConversation } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  const conversationId = chat?._id;
  const messages = messagesByConversation[conversationId] || [];

  useEffect(() => {
    if (!conversationId) return;
    dispatch(fetchMessages(conversationId));
    // Mark conversation as read when opened
    dispatch(markConversationAsRead(conversationId));

    const socket = getSocket();
    socket.emit("joinConversation", { conversationId });
    const onNew = ({ message: msg }) => {
      // The reducer will handle deduplication by ID
      dispatch(upsertMessage({ conversationId, message: msg }));
      
      // If message is from another user and conversation is currently open, mark as read
      const meId = user?.id;
      const isFromOther = String(msg.sender?._id || msg.sender?.id) !== String(meId);
      if (isFromOther && conversationId) {
        // Since conversation is open, mark it as read immediately
        dispatch(markConversationAsRead(conversationId));
      }
    };
    socket.on("newMessage", onNew);
    return () => {
      socket.off("newMessage", onNew);
    };
  }, [conversationId, dispatch, user, chat]);

  const displayMessages = useMemo(() => {
    const meId = user?.id;
    return (messages || []).map((m) => ({
      _id: m._id,
      text: m.text,
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: String(m.sender?._id || m.sender?.id) === String(meId),
      read: true,
    }));
  }, [messages, user]);

  const handleSend = () => {
    if (message.trim()) {
      const socket = getSocket();
      const text = message.trim();
      const tempId = `tmp-${Date.now()}`;
      setMessage("");
      
      // optimistic add with temporary ID
      dispatch(
        upsertMessage({
          conversationId,
          message: {
            _id: tempId,
            text,
            createdAt: new Date().toISOString(),
            sender: { _id: user?.id, name: user?.name, avatar: user?.avatar },
          },
        })
      );
      
      socket.emit("sendMessage", { conversationId, text }, (ack) => {
        if (ack?.ok && ack?.message) {
          // Replace temporary message with real one from server
          dispatch(
            upsertMessage({
              conversationId,
              message: ack.message,
            })
          );
        } else {
          // If failed, we could remove the temp message or show an error
          console.error("sendMessage failed", ack?.error);
          // Optionally remove the temp message on failure
          // dispatch(removeMessage({ conversationId, messageId: tempId }));
        }
      });
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
                alt={chat.name || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-gray font-medium">
                {chat.name?.charAt(0) || chat.participants?.[0]?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-family-poppins text-sm font-semibold text-black">
              {chat.name || chat.participants?.[0]?.name || 'Unknown User'}
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
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            onClick={() => {
              // If selected chat has an upcoming meeting, SchedulePanel handles it. Here we just open Jitsi with a generated room.
              const room = `skillbridge-${chat?._id || "general"}-${Date.now()}`;
              window.open(`https://meet.jit.si/${room}`, "_blank", "noopener,noreferrer");
            }}
          >
            <Video className="text-gray" size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <MoreVertical className="text-gray" size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((msg) => (
          <div
            key={msg._id}
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

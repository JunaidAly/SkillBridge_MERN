import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ChatList from "../components/Chat/ChatList";
import ChatMessages from "../components/Chat/ChatMessages";
import SchedulePanel from "../components/Chat/SchedulePanel";
import { fetchConversations, upsertMessage, updateUnreadCount } from "../store/chatSlice";
import { getSocket } from "../socket";

function ChatPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { conversations } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Global socket listener for new messages (to update unread counts for closed conversations)
  useEffect(() => {
    const socket = getSocket();
    const meId = user?.id;
    
    const onNewMessage = ({ message: msg }) => {
      const msgConversationId = msg.conversation?._id || msg.conversation;
      if (!msgConversationId) return;
      
      const isFromOther = String(msg.sender?._id || msg.sender?.id) !== String(meId);
      const isNotSelected = selectedChat?._id !== msgConversationId;
      
      // If message is from another user and conversation is not currently open, increment unread count
      if (isFromOther && isNotSelected) {
        const conv = conversations.find(c => c._id === msgConversationId);
        if (conv) {
          const currentUnread = conv.unreadCount || 0;
          dispatch(updateUnreadCount({ conversationId: msgConversationId, unreadCount: currentUnread + 1 }));
        } else {
          // If conversation not in list yet, set unread to 1
          dispatch(updateUnreadCount({ conversationId: msgConversationId, unreadCount: 1 }));
        }
      }
      
      // Upsert the message (ChatMessages will also handle it if conversation is open, but reducer handles duplicates)
      dispatch(upsertMessage({ conversationId: msgConversationId, message: msg }));
    };
    
    socket.on("newMessage", onNewMessage);
    return () => {
      socket.off("newMessage", onNewMessage);
    };
  }, [dispatch, user, selectedChat, conversations]);

  // Format conversations with name and avatar from participants
  const formattedConversations = useMemo(() => {
    const meId = user?.id;
    return (conversations || []).map((c) => {
      const other = (c.participants || []).find((p) => String(p._id || p.id) !== String(meId));
      return {
        ...c,
        name: other?.name || "Conversation",
        avatar: other?.avatar || null,
      };
    });
  }, [conversations, user]);

  useEffect(() => {
    // If navigating from dashboard with conversationId, select that conversation
    if (location.state?.conversationId) {
      const conversation = formattedConversations.find(
        (c) => c._id === location.state.conversationId
      );
      if (conversation) {
        setSelectedChat(conversation);
        setShowMobileChat(true);
      }
    }
  }, [location.state, formattedConversations]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
  };

  const handleBack = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-120px)] lg:h-[calc(100vh-64px)]">
      <div className="flex h-full">
        {/* Chat List - Hidden on mobile when chat is selected */}
        <div
          className={`${
            showMobileChat ? "hidden md:flex" : "flex"
          } w-full md:w-auto`}
        >
          <ChatList
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            onToggleMobile={() => setShowMobileChat(true)}
          />
        </div>

        {/* Chat Messages - Full width on mobile when selected */}
        <div
          className={`${
            showMobileChat ? "flex" : "hidden md:flex"
          } flex-1`}
        >
          <ChatMessages chat={selectedChat} onBack={handleBack} />
        </div>

        {/* Schedule Panel - Hidden on mobile and tablet */}
        <div className="hidden lg:flex">
          <SchedulePanel selectedChat={selectedChat} />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

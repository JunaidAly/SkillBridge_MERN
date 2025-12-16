import { useState } from "react";
import ChatList from "../components/Chat/ChatList";
import ChatMessages from "../components/Chat/ChatMessages";
import SchedulePanel from "../components/Chat/SchedulePanel";

function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

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
          <SchedulePanel />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

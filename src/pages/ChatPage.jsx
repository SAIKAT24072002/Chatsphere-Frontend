import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSidebarOpen } from "../redux/slices/uiSlice";
import { setActiveChat, fetchChatById } from "../redux/slices/chatSlice";
import Sidebar from "../components/layout/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import ModalManager from "../components/modals/ModalManager";

export default function ChatPage() {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { chats, activeChat } = useSelector((s) => s.chat);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pendingChatId, setPendingChatId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("chatId") || params.get("conversationId");
  });

  useEffect(() => {
    if (pendingChatId) {
      // Remove query parameters from URL bar without reloading
      const url = new URL(window.location);
      if (url.searchParams.has("chatId") || url.searchParams.has("conversationId")) {
        url.searchParams.delete("chatId");
        url.searchParams.delete("conversationId");
        window.history.replaceState(null, "", url.pathname + url.search);
      }

      const chat = chats.find((c) => c._id === pendingChatId);
      if (chat) {
        dispatch(setActiveChat(chat));
        setPendingChatId(null);
      } else if (chats.length > 0) {
        dispatch(fetchChatById(pendingChatId));
        setPendingChatId(null);
      } else {
        dispatch(fetchChatById(pendingChatId));
        setPendingChatId(null);
      }
    }
  }, [pendingChatId, chats, dispatch]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        dispatch(setSidebarOpen(true));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  useEffect(() => {
    if (isMobile && !activeChat) {
      dispatch(setSidebarOpen(true));
    }
  }, [isMobile, activeChat, dispatch]);

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-surface-950">
      {/* ── Sidebar ── */}
      {/* Mobile: absolute overlay when open; Desktop: always visible */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 flex-shrink-0 h-full
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : ""}
        `}
      >
        <Sidebar onChatSelect={() => dispatch(setSidebarOpen(false))} />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* ── Chat window ── */}
      {/* On mobile: show only when a chat is selected OR sidebar is closed */}
      <div className={`
        flex-1 flex flex-col min-w-0 h-full
        ${!activeChat && isMobile ? "hidden md:flex" : "flex"}
      `}>
        <ChatWindow onOpenSidebar={() => dispatch(setSidebarOpen(true))} />
      </div>

      <ModalManager />
    </div>
  );
}

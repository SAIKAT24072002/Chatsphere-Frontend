import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages } from "../../redux/slices/messageSlice";
import { openModal, setSidebarOpen } from "../../redux/slices/uiSlice";
import { setActiveChat } from "../../redux/slices/chatSlice";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { getSocket } from "../../utils/socket";
import Avatar from "../ui/Avatar";
import { getChatName, getChatAvatar, getOtherUser, formatLastSeen, getInitials } from "../../utils/helpers";

export default function ChatWindow({ onOpenSidebar }) {
  const dispatch = useDispatch();
  const { activeChat } = useSelector((s) => s.chat);
  const { messagesByChatId, typingUsers, loading } = useSelector((s) => s.message);
  const { user } = useSelector((s) => s.auth);
  const messagesEndRef = useRef(null);
  const [page, setPage] = useState(1);
  const [initialLoad, setInitialLoad] = useState(true);

  const messages = activeChat ? (messagesByChatId[activeChat._id] || []) : [];
  const typing = activeChat ? Object.values(typingUsers[activeChat._id] || {}) : [];
  const otherUser = activeChat && !activeChat.isGroup ? getOtherUser(activeChat, user) : null;

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeChat) {
      setInitialLoad(true);
      setPage(1);
      dispatch(fetchMessages({ chatId: activeChat._id, page: 1 }));
    }
  }, [activeChat?._id]);

  useEffect(() => {
    if (!activeChat?._id) return;
    const socket = getSocket();
    socket?.emit("joinRoom", activeChat._id);
    return () => { socket?.emit("leaveRoom", activeChat._id); };
  }, [activeChat?._id]);

  useEffect(() => {
    if (messages.length > 0) {
      if (initialLoad) {
        scrollToBottom("auto"); // Instant scroll on chat load
        setInitialLoad(false);
      } else {
        scrollToBottom("smooth"); // Smooth scroll on new messages
      }
    }
  }, [messages.length, initialLoad]);

  /* ── Empty state (desktop only — mobile hides this via ChatPage) ── */
  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-surface-950 gap-4 p-6">
        <div className="w-20 h-20 bg-surface-800 rounded-3xl flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-300">Select a conversation</h3>
          <p className="text-slate-500 text-sm mt-1">Choose from your chats or find someone new</p>
        </div>
      </div>
    );
  }

  const chatName = getChatName(activeChat, user);
  const chatAvatar = getChatAvatar(activeChat, user);

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex-1 flex flex-col bg-surface-950 min-w-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-surface-800 bg-surface-900 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Back button — mobile only */}
          <button
            onClick={() => {
              dispatch(setActiveChat(null));
              onOpenSidebar?.();
            }}
            className="md:hidden btn-ghost p-1.5 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Hamburger — desktop */}
          <button
            onClick={() => dispatch(setSidebarOpen(true))}
            className="hidden md:flex btn-ghost p-1.5 flex-shrink-0 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {chatAvatar ? (
            <img src={chatAvatar} alt={chatName} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-surface-700 flex-shrink-0" />
          ) : (
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-semibold text-white text-sm ring-2 ring-surface-700 flex-shrink-0 ${activeChat.isGroup ? "bg-brand-600" : "bg-violet-600"}`}>
              {getInitials(chatName)}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="font-semibold text-white text-sm truncate">{chatName}</h2>
            <p className="text-xs text-slate-500 truncate">
              {activeChat.isGroup
                ? `${activeChat.members?.length} members`
                : otherUser?.status === "online"
                  ? <span className="text-emerald-400">Online</span>
                  : `Last seen ${formatLastSeen(otherUser?.lastSeen)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => dispatch(openModal({ modal: "search" }))} className="btn-ghost p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button onClick={() => dispatch(openModal({ modal: "chatInfo", data: activeChat }))} className="btn-ghost p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-surface-800" />
              <span className="text-xs text-slate-500 px-2 py-1 bg-surface-900 rounded-full border border-surface-800 whitespace-nowrap">{date}</span>
              <div className="flex-1 h-px bg-surface-800" />
            </div>
            {msgs.map((msg, i) => {
              const prev = msgs[i - 1];
              const showAvatar = !prev || prev.sender?._id !== msg.sender?._id;
              return (
                <MessageBubble key={msg._id} message={msg} isOwn={msg.sender?._id === user._id} showAvatar={showAvatar} onImageLoad={() => scrollToBottom("auto")} />
              );
            })}
          </div>
        ))}

        {typing.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex gap-1">
              <span className="typing-dot w-2 h-2 bg-slate-500 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-slate-500 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-slate-500 rounded-full" />
            </div>
            <span className="text-xs text-slate-500">{typing.join(", ")} {typing.length === 1 ? "is" : "are"} typing…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <MessageInput />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchChats, setActiveChat, accessChat } from "../../redux/slices/chatSlice";
import { logout } from "../../redux/slices/authSlice";
import { openModal } from "../../redux/slices/uiSlice";
import Avatar from "../ui/Avatar";
import { getChatName, getChatAvatar, formatChatTime, getInitials } from "../../utils/helpers";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function Sidebar({ onChatSelect }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chats, activeChat, loading, onlineUsers } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const { unreadCount, notifications = [] } = useSelector((s) => s.notification);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("chats");

  useEffect(() => { dispatch(fetchChats()); }, []);

  useEffect(() => {
    if (userSearch.trim().length < 2) { setUsers([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/users?search=${userSearch}`);
        setUsers(res.data);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const filtered = chats.filter((c) => {
    const name = getChatName(c, user).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleChatClick = (chat) => {
    dispatch(setActiveChat(chat));
    setTab("chats");
    if (window.innerWidth < 768) {
      onChatSelect?.();           // closes sidebar on mobile only
    }
  };

  const handleUserClick = async (u) => {
    const res = await dispatch(accessChat(u._id));
    if (!res.error) {
      setTab("chats");
      if (window.innerWidth < 768) {
        onChatSelect?.();         // closes sidebar on mobile only
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    toast.success("Logged out");
  };

  return (
    <div className="flex flex-col h-full w-[85vw] sm:w-80 bg-surface-900 border-r border-surface-800">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-bold text-white text-base">ChatSphere</span>
        </div>

        <div className="flex items-center gap-1">
          {user?.role === "admin" && (
            <button onClick={() => navigate("/admin")} className="btn-ghost p-2" title="Admin">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          )}
          <div className="relative">
            <button onClick={() => dispatch(openModal({ modal: "notifications" }))} className="btn-ghost p-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Search / Tabs ── */}
      <div className="px-3 py-3 space-y-2 border-b border-surface-800">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input-base !pl-10 !pr-8 py-2 text-sm"
            placeholder="Search chats or find users…"
            value={tab === "chats" ? search : userSearch}
            onChange={(e) => {
              if (tab === "chats") setSearch(e.target.value);
              else setUserSearch(e.target.value);
            }}
            onFocus={() => setTab("search")}
          />
          {(search || userSearch) && (
            <button
              onClick={() => { setSearch(""); setUserSearch(""); setTab("chats"); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg leading-none z-10"
            >×</button>
          )}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => { setTab("chats"); setUserSearch(""); }}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${tab === "chats" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white hover:bg-surface-800"}`}
          >My Chats</button>
          <button
            onClick={() => { setTab("search"); setSearch(""); }}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${tab === "search" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white hover:bg-surface-800"}`}
          >Find People</button>
          <button
            onClick={() => dispatch(openModal({ modal: "createGroup" }))}
            className="flex-1 text-xs py-1.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-surface-800 transition-colors"
          >+ Group</button>
        </div>
      </div>

      {/* ── Chat / User list ── */}
      <div className="flex-1 overflow-y-auto">
        {tab === "chats" ? (
          loading ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2 px-4 text-center">
              <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">{search ? "No chats found" : "No conversations yet"}</p>
              <p className="text-xs">Search for people to start chatting</p>
            </div>
          ) : (
            filtered.map((chat) => {
              const name = getChatName(chat, user);
              const avatar = getChatAvatar(chat, user);
              const otherUser = !chat.isGroup ? chat.members?.find((m) => m._id !== user._id) : null;
              const isActive = activeChat?._id === chat._id;
              const lastMsg = chat.lastMessage;
              const unreadChatCount = notifications.filter((n) => {
                const nChatId = n.chat?._id || n.chat;
                return String(nChatId) === String(chat._id) && !n.isRead;
              }).length;

              return (
                <button
                  key={chat._id}
                  onClick={() => handleChatClick(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-800 transition-colors text-left ${isActive ? "bg-surface-800 border-r-2 border-brand-500" : ""}`}
                >
                  <div className="relative flex-shrink-0">
                    {avatar ? (
                      <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-2 ring-surface-700" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm ring-2 ring-surface-700 ${chat.isGroup ? "bg-brand-600" : "bg-violet-600"}`}>
                        {getInitials(name)}
                      </div>
                    )}
                    {otherUser && (
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-surface-900 ${otherUser.status === "online" ? "bg-emerald-500" : otherUser.status === "away" ? "bg-amber-500" : "bg-slate-600"}`} />
                    )}
                    {chat.isGroup && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200 text-sm truncate">{name}</span>
                      {lastMsg && <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatChatTime(lastMsg.createdAt)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      {lastMsg && (
                        <p className="text-xs text-slate-500 truncate mr-2 flex-1">
                          {lastMsg.sender?._id === user._id ? "You: " : ""}
                          {lastMsg.isDeleted ? <em>Message deleted</em> : lastMsg.type === "text" ? lastMsg.content : `📎 ${lastMsg.type}`}
                        </p>
                      )}
                      {unreadChatCount > 0 && (
                        <span className="w-5 h-5 bg-emerald-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center flex-shrink-0 animate-pulse-dot">
                          {unreadChatCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          <div>
            {userSearch.length < 2 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
                <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">Type at least 2 characters</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">No users found</div>
            ) : (
              users.map((u) => {
                const isOnline = onlineUsers.includes(u._id);
                const userWithStatus = { ...u, status: isOnline ? "online" : u.status };
                return (
                  <button
                    key={u._id}
                    onClick={() => handleUserClick(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-800 transition-colors"
                  >
                    <Avatar user={userWithStatus} size="sm" showStatus />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-slate-200 truncate">{u.username}</p>
                      <p className="text-xs text-slate-500 truncate">{u.customStatus || userWithStatus.status}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── User footer ── */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-surface-800">
        <button onClick={() => navigate("/profile")} className="flex-1 flex items-center gap-3 hover:bg-surface-800 rounded-xl px-2 py-1.5 transition-colors min-w-0">
          <Avatar user={user} size="sm" showStatus />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.customStatus || user?.status}</p>
          </div>
        </button>
        <button onClick={handleLogout} className="btn-ghost p-2 text-slate-500 hover:text-rose-400 flex-shrink-0" title="Logout">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

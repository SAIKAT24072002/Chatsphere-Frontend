import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchMessages, clearSearch } from "../../redux/slices/messageSlice";
import { setActiveChat } from "../../redux/slices/chatSlice";
import { formatMessageTime } from "../../utils/helpers";

export default function SearchModal({ onClose }) {
  const dispatch = useDispatch();
  const { searchResults } = useSelector((s) => s.message);
  const { activeChat, chats } = useSelector((s) => s.chat);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [scope, setScope] = useState("chat");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    await dispatch(searchMessages({
      q,
      ...(type && { type }),
      ...(scope === "chat" && activeChat ? { chatId: activeChat._id } : {}),
    }));
    setLoading(false);
  };

  const handleResultClick = (msg) => {
    const chatId = msg.chat?._id || msg.chat;
    const chat = chats.find((c) => c._id === chatId);
    if (chat) dispatch(setActiveChat(chat));
    onClose();
  };

  return (
    <div className="card w-full rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-surface-800 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-white">Search Messages</h2>
        <button onClick={() => { dispatch(clearSearch()); onClose(); }} className="btn-ghost p-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input-base pl-9"
              placeholder="Search for messages…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <select className="input-base text-sm flex-1" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              <option value="text">Text</option>
              <option value="image">Images</option>
              <option value="file">Files</option>
              <option value="video">Videos</option>
            </select>
            <select className="input-base text-sm flex-1" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="chat">This chat</option>
              <option value="all">All chats</option>
            </select>
          </div>

          <button type="submit" disabled={loading || !q.trim()} className="btn-primary w-full py-3">
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">{searchResults.length} results</p>
            {searchResults.map((msg) => (
              <button
                key={msg._id}
                onClick={() => handleResultClick(msg)}
                className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-medium text-brand-400">{msg.sender?.username}</span>
                    {msg.chat?.name && (
                      <span className="text-xs text-slate-500 hidden sm:inline">in {msg.chat.name}</span>
                    )}
                    <span className="text-xs text-slate-600 ml-auto">{formatMessageTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300 truncate">{msg.content || `[${msg.type}]`}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchResults.length === 0 && q && !loading && (
          <p className="text-center text-slate-500 text-sm py-4">No messages found</p>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteMessage } from "../../redux/slices/messageSlice";
import Avatar from "../ui/Avatar";
import { formatMessageTime, formatFileSize, isImageFile } from "../../utils/helpers";
import api from "../../utils/api";
import toast from "react-hot-toast";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function MessageBubble({ message, isOwn, showAvatar, onImageLoad }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { activeChat, onlineUsers = [] } = useSelector((s) => s.chat);
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  if (!message) return null;

  const handleDownload = async (url, fileName) => {
    try {
      const response = await api.get("/upload/download", {
        params: { url, fileName },
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, "_blank");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    const res = await dispatch(deleteMessage(message._id));
    if (res.error) toast.error("Failed to delete");
  };

  const handleReact = async (emoji) => {
    try {
      await api.post(`/messages/${message._id}/react`, { emoji });
      setShowEmoji(false);
    } catch { toast.error("Failed to react"); }
  };

  const handleFlag = async () => {
    try {
      await api.post(`/messages/${message._id}/flag`, { reason: "Inappropriate content" });
      toast.success("Message flagged");
      setShowActions(false);
    } catch { toast.error("Failed to flag"); }
  };

  if (message.type === "system") {
    return (
      <div className="flex items-center justify-center my-2 px-2">
        <span className="text-xs text-slate-500 bg-surface-800 px-3 py-1 rounded-full text-center">{message.content}</span>
      </div>
    );
  }

  const isImage = message.type === "image" || isImageFile(message.fileUrl, null);

  const getTicks = () => {
    const hasBeenRead = message.readBy?.some((id) => {
      const idStr = id._id || id;
      return idStr.toString() !== user._id.toString();
    });

    if (hasBeenRead) {
      return {
        text: "✓✓",
        className: "text-sky-400 font-bold",
      };
    }

    const isOtherOnline = activeChat?.members?.some((m) => {
      const mId = m._id || m;
      return mId.toString() !== user._id.toString() && onlineUsers.some((oId) => oId.toString() === mId.toString());
    });

    if (isOtherOnline) {
      return {
        text: "✓✓",
        className: "text-slate-500 font-semibold",
      };
    }

    return {
      text: "✓",
      className: "text-slate-500",
    };
  };

  const ticks = getTicks();

  return (
    <div
      className={`flex items-end gap-1.5 sm:gap-2 mb-1 message-enter group ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmoji(false); }}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 sm:w-8 flex-shrink-0">
          {showAvatar ? <Avatar user={message.sender} size="xs" /> : null}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[78%] sm:max-w-[65%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        {showAvatar && !isOwn && (
          <span className="text-xs text-slate-400 px-1">{message.sender?.username}</span>
        )}

        <div className={`relative rounded-2xl px-3 py-2 text-sm ${
          isOwn
            ? "bg-brand-600 text-white rounded-br-sm"
            : "bg-surface-800 text-slate-100 rounded-bl-sm"
        } ${message.isDeleted ? "opacity-60 italic" : ""}`}>

          {message.replyTo && (
            <div className={`text-xs mb-1.5 pb-1.5 border-b ${isOwn ? "border-brand-500 text-brand-200" : "border-surface-600 text-slate-400"}`}>
              <span className="font-medium">{message.replyTo.sender?.username}</span>
              <p className="truncate opacity-80">{message.replyTo.content}</p>
            </div>
          )}

          {message.isDeleted ? (
            <span className="text-sm">This message was deleted</span>
          ) : message.type === "text" ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : isImage ? (
            <div className="relative group/media">
              <img src={message.fileUrl} alt={message.fileName} onLoad={onImageLoad} className="rounded-xl max-w-full max-h-56 sm:max-h-64 object-cover" />
              <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => { e.preventDefault(); handleDownload(message.fileUrl, message.fileName); }}
                  className="p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors cursor-pointer"
                  title="Download Image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ) : message.type === "video" ? (
            <div className="relative group/media">
              <video src={message.fileUrl} controls className="rounded-xl max-w-full max-h-40 sm:max-h-48" />
              <div className="absolute top-2 right-2 opacity-0 group-hover/media:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.preventDefault(); handleDownload(message.fileUrl, message.fileName); }}
                  className="p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors cursor-pointer"
                  title="Download Video"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <a href={message.fileUrl} target="_blank" rel="noreferrer"
                className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${isOwn ? "text-brand-100" : "text-brand-400"}`}>
                <div className="w-8 h-8 bg-surface-700 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📄</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                  <p className="text-xs opacity-60">{formatFileSize(message.fileSize)}</p>
                </div>
              </a>
              <button
                onClick={(e) => { e.preventDefault(); handleDownload(message.fileUrl, message.fileName); }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isOwn ? "hover:bg-brand-700 text-brand-100" : "hover:bg-surface-700 text-slate-400"}`}
                title="Download File"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )}

          {message.reactions?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc;
              }, {})).map(([emoji, count]) => (
                <span key={emoji} onClick={() => handleReact(emoji)}
                  className={`text-xs px-1.5 py-0.5 rounded-full cursor-pointer transition-all ${
                    message.reactions.some((r) => r.user === user._id && r.emoji === emoji)
                      ? "bg-brand-500/30 ring-1 ring-brand-500"
                      : "bg-surface-700/50 hover:bg-surface-600"
                  }`}>
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className={`flex items-center gap-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-slate-600">{formatMessageTime(message.createdAt)}</span>
          {isOwn && (
            <span className={`text-[10px] ${ticks.className}`}>
              {ticks.text}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {showActions && !message.isDeleted && (
        <div className={`flex items-center gap-1 transition-opacity ${isOwn ? "flex-row-reverse" : ""} opacity-100 md:opacity-0 md:group-hover:opacity-100`}>
          <div className="relative">
            <button onClick={() => setShowEmoji(!showEmoji)} className="w-6 h-6 rounded-full bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-xs transition-colors">
              😊
            </button>
            {showEmoji && (
              <div className={`absolute bottom-8 ${isOwn ? "right-0" : "left-0"} flex gap-1 bg-surface-800 border border-surface-700 rounded-xl p-2 shadow-xl z-10`}>
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => handleReact(e)} className="hover:scale-125 transition-transform text-base">{e}</button>
                ))}
              </div>
            )}
          </div>
          {isOwn && (
            <button onClick={handleDelete} className="w-6 h-6 rounded-full bg-surface-700 hover:bg-rose-500 flex items-center justify-center transition-colors">
              <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {!isOwn && (
            <button onClick={handleFlag} className="w-6 h-6 rounded-full bg-surface-700 hover:bg-amber-500 flex items-center justify-center transition-colors">
              <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

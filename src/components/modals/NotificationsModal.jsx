import { useDispatch, useSelector } from "react-redux";
import { markAllRead } from "../../redux/slices/notificationSlice";
import { setActiveChat } from "../../redux/slices/chatSlice";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsModal({ onClose }) {
  const dispatch = useDispatch();
  const { notifications } = useSelector((s) => s.notification);
  const { chats } = useSelector((s) => s.chat);

  const handleClick = (n) => {
    if (n.chat) {
      const chat = chats.find((c) => c._id === (n.chat?._id || n.chat));
      if (chat) dispatch(setActiveChat(chat));
    }
    onClose();
  };

  return (
    <div className="card w-full rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-surface-800 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-white">Notifications</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(markAllRead())}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Mark all read
          </button>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 px-2 sm:px-3 py-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
            <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-colors ${
                n.isRead ? "hover:bg-surface-800" : "bg-brand-600/10 hover:bg-brand-600/20"
              }`}
            >
              <div className="w-9 h-9 bg-surface-700 rounded-full flex items-center justify-center text-base flex-shrink-0">
                {n.type === "message" ? "💬" : n.type === "mention" ? "@" : "👥"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{n.title}</p>
                {n.body && <p className="text-xs text-slate-400 truncate mt-0.5">{n.body}</p>}
                <p className="text-xs text-slate-600 mt-0.5">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

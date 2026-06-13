import { getInitials } from "../../utils/helpers";

const COLORS = [
  "bg-violet-600","bg-blue-600","bg-emerald-600","bg-rose-600",
  "bg-amber-600","bg-cyan-600","bg-pink-600","bg-indigo-600",
];

const getColor = (name) => {
  if (!name) return COLORS[0];
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
};

export default function Avatar({ user, size = "md", showStatus = false, className = "" }) {
  const sizeMap = { xs: "w-7 h-7 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-lg" };
  const dotMap = { xs: "w-2 h-2", sm: "w-2 h-2", md: "w-2.5 h-2.5", lg: "w-3 h-3", xl: "w-3.5 h-3.5" };

  const statusColor = {
    online: "status-online",
    away: "status-away",
    busy: "status-busy",
    offline: "status-offline",
  }[user?.status] || "status-offline";

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-surface-800`}
        />
      ) : (
        <div className={`${sizeMap[size]} ${getColor(user?.username)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-surface-800`}>
          {getInitials(user?.username || user?.name)}
        </div>
      )}
      {showStatus && (
        <span className={`absolute bottom-0 right-0 ${dotMap[size]} ${statusColor} rounded-full ring-2 ring-surface-950`} />
      )}
    </div>
  );
}

import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export const formatMessageTime = (date) => {
  const d = new Date(date);
  return format(d, "HH:mm");
};

export const formatChatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd/MM/yy");
};

export const formatLastSeen = (date) => {
  if (!date) return "Unknown";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getChatName = (chat, currentUser) => {
  if (chat.isGroup) return chat.name;
  const other = chat.members?.find((m) => m._id !== currentUser._id);
  return other?.username || "Unknown User";
};

export const getChatAvatar = (chat, currentUser) => {
  if (chat.isGroup) return chat.avatar || null;
  const other = chat.members?.find((m) => m._id !== currentUser._id);
  return other?.avatar || null;
};

export const getOtherUser = (chat, currentUser) => {
  if (chat.isGroup) return null;
  return chat.members?.find((m) => m._id !== currentUser._id);
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export const getFileIcon = (type) => {
  if (!type) return "📄";
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  if (type === "application/pdf") return "📕";
  if (type.includes("word")) return "📝";
  if (type.includes("zip")) return "🗜️";
  return "📄";
};

export const isImageFile = (url, type) => {
  if (type?.startsWith("image/")) return true;
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
};

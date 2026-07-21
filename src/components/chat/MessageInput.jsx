import { useState, useRef, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendMessage } from "../../redux/slices/messageSlice";
import { updateLastMessage } from "../../redux/slices/chatSlice";
import { getSocket } from "../../utils/socket";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function MessageInput() {
  const dispatch = useDispatch();
  const { activeChat } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();
  const typingRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 128)}px`;
      if (scrollHeight > 128) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  }, [text]);

  const emitTyping = useCallback((isTyping) => {
    const socket = getSocket();
    if (socket && activeChat) {
      socket.emit("typing", { chatId: activeChat._id, isTyping });
    }
  }, [activeChat]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => emitTyping(false), 1500);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !preview) return;
    if (!activeChat) return;

    emitTyping(false);

    if (preview) {
      const res = await dispatch(sendMessage({
        chatId: activeChat._id,
        content: text.trim() || preview.name,
        type: preview.type,
        fileUrl: preview.url,
        publicId: preview.publicId,
        fileName: preview.name,
        fileSize: preview.size,
      }));
      if (!res.error) {
        dispatch(updateLastMessage({ chatId: activeChat._id, message: res.payload }));
        setPreview(null);
        setText("");
      }
    } else if (text.trim()) {
      const res = await dispatch(sendMessage({
        chatId: activeChat._id,
        content: text.trim(),
        type: "text",
        fileUrl: "",
        publicId: "",
        fileName: "",
        fileSize: "",
      }));
      if (!res.error) {
        dispatch(updateLastMessage({ chatId: activeChat._id, message: res.payload }));
        setPreview(null);
        setText("");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_MIME = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/quicktime",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "application/zip",
    ];
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("File type not allowed. Please upload images, videos, PDFs, Word docs, TXT, or ZIP files.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) { toast.error("File too large (max 25MB)"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload/file", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      setPreview({ url: res.data.url, publicId: res.data.publicId, name: file.name, size: file.size, type });
      toast.success("File ready to send");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
    e.target.value = "";
  };

  if (!activeChat) return null;

  return (
    <div className="px-3 sm:px-4 py-3 border-t border-surface-800 bg-surface-900 flex-shrink-0">
      {/* File preview */}
      {preview && (
        <div className="flex items-center gap-3 mb-3 p-2.5 bg-surface-800 rounded-xl">
          {preview.type === "image" ? (
            <img src={preview.url} alt={preview.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 bg-surface-700 rounded-lg flex items-center justify-center text-xl flex-shrink-0">📄</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate">{preview.name}</p>
            <p className="text-xs text-slate-500">{(preview.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-end gap-2">
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-ghost p-2.5 flex-shrink-0 text-slate-400 hover:text-brand-400"
        >
          {uploading ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="input-base flex-1 resize-none max-h-32 min-h-[42px] py-2.5 text-sm"
          placeholder="Type a message…"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {/* Send */}
        <button
          type="submit"
          disabled={!text.trim() && !preview}
          className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}

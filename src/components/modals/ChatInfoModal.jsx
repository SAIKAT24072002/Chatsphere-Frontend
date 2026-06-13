import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateGroup, removeGroupMember, addGroupMembers } from "../../redux/slices/chatSlice";
import Avatar from "../ui/Avatar";
import { getChatName, getChatAvatar, getInitials } from "../../utils/helpers";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function ChatInfoModal({ chat, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(chat?.name || "");
  const [desc, setDesc] = useState(chat?.description || "");
  const [addSearch, setAddSearch] = useState("");
  const [foundUsers, setFoundUsers] = useState([]);

  if (!chat) return null;

  const isAdmin = chat.admins?.some((a) => (a._id || a) === user._id);
  const chatName = getChatName(chat, user);
  const chatAvatar = getChatAvatar(chat, user);

  const searchUsers = async (q) => {
    setAddSearch(q);
    if (q.length < 2) { setFoundUsers([]); return; }
    try {
      const res = await api.get(`/users?search=${q}`);
      setFoundUsers(res.data.filter((u) => !chat.members.some((m) => (m._id || m) === u._id)));
    } catch {}
  };

  const handleUpdate = async () => {
    const res = await dispatch(updateGroup({ id: chat._id, data: { name, description: desc } }));
    if (!res.error) { toast.success("Updated"); setEditing(false); }
    else toast.error(res.payload);
  };

  const handleRemove = async (memberId) => {
    if (!confirm("Remove this member?")) return;
    const res = await dispatch(removeGroupMember({ groupId: chat._id, userId: memberId }));
    if (res.error) toast.error(res.payload);
    else toast.success("Member removed");
  };

  const handleAdd = async (u) => {
    const res = await dispatch(addGroupMembers({ groupId: chat._id, memberIds: [u._id] }));
    if (!res.error) { toast.success(`${u.username} added`); setAddSearch(""); setFoundUsers([]); }
    else toast.error(res.payload);
  };

  return (
    <div className="card w-full rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-surface-800 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-white">
          {chat.isGroup ? "Group Info" : "Chat Info"}
        </h2>
        <button onClick={onClose} className="btn-ghost p-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-5">

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          {chatAvatar ? (
            <img src={chatAvatar} alt={chatName} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-surface-700" />
          ) : (
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white ${chat.isGroup ? "bg-brand-600" : "bg-violet-600"}`}>
              {getInitials(chatName)}
            </div>
          )}

          {editing ? (
            <div className="w-full space-y-2">
              <input className="input-base text-center text-sm" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="input-base text-center text-sm" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={handleUpdate} className="btn-primary flex-1 py-2 text-sm">Save</button>
                <button onClick={() => setEditing(false)} className="btn-ghost flex-1 py-2 text-sm border border-surface-700">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h3 className="font-semibold text-white">{chatName}</h3>
                {chat.isGroup && isAdmin && (
                  <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              {chat.isGroup && chat.description && (
                <p className="text-sm text-slate-400 mt-1">{chat.description}</p>
              )}
              {chat.isGroup && (
                <p className="text-xs text-slate-500 mt-1">{chat.members?.length} members</p>
              )}
            </div>
          )}
        </div>

        {/* Members list */}
        {chat.isGroup && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Members</h4>

            <div className="space-y-0.5 max-h-48 sm:max-h-56 overflow-y-auto">
              {chat.members?.map((member) => {
                const m = typeof member === "object" ? member : { _id: member };
                const isGroupAdmin = chat.admins?.some((a) => (a._id || a) === m._id);
                return (
                  <div key={m._id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-800 group">
                    <Avatar user={m} size="sm" showStatus />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{m.username || "User"}</p>
                      {isGroupAdmin && <span className="text-xs text-brand-400">Admin</span>}
                    </div>
                    {isAdmin && m._id !== user._id && (
                      <button
                        onClick={() => handleRemove(m._id)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add members */}
            {isAdmin && (
              <div className="pt-3 border-t border-surface-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Members</h4>
                <input
                  className="input-base text-sm"
                  placeholder="Search users…"
                  value={addSearch}
                  onChange={(e) => searchUsers(e.target.value)}
                />
                {foundUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleAdd(u)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-800 transition-colors"
                  >
                    <Avatar user={u} size="sm" />
                    <span className="flex-1 text-left text-sm text-slate-200">{u.username}</span>
                    <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Leave */}
            <button
              onClick={() => { dispatch(removeGroupMember({ groupId: chat._id, userId: user._id })); onClose(); }}
              className="w-full text-rose-400 hover:text-rose-300 text-sm py-2.5 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-500/20"
            >
              Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

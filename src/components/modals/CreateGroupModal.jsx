import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createGroup } from "../../redux/slices/chatSlice";
import api from "../../utils/api";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";

export default function CreateGroupModal({ onClose }) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setUsers([]); return; }
    const t = setTimeout(async () => {
      try { const res = await api.get(`/users?search=${search}`); setUsers(res.data); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggle = (user) => {
    setSelected((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Group name required");
    if (selected.length < 1) return toast.error("Add at least 1 member");
    setLoading(true);
    const res = await dispatch(createGroup({ name, description, memberIds: selected.map((u) => u._id) }));
    setLoading(false);
    if (!res.error) { toast.success("Group created!"); onClose(); }
    else toast.error(res.payload);
  };

  return (
    <div className="card w-full rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-surface-800 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-white">Create Group</h2>
        <button onClick={onClose} className="btn-ghost p-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4">
        <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
          <input
            className="input-base"
            placeholder="Group name*"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input-base"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Selected member chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {selected.map((u) => (
                <span
                  key={u._id}
                  className="flex items-center gap-1.5 bg-brand-600/20 text-brand-300 text-xs px-2 py-1 rounded-full"
                >
                  {u.username}
                  <button type="button" onClick={() => toggle(u)} className="hover:text-white leading-none">×</button>
                </span>
              ))}
            </div>
          )}

          {/* User search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input-base !pl-10 text-sm"
              placeholder="Search users to add…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {users.length > 0 && (
            <div className="max-h-40 sm:max-h-48 overflow-y-auto space-y-1 rounded-xl border border-surface-700">
              {users.map((u) => {
                const isSelected = selected.find((s) => s._id === u._id);
                return (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => toggle(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${isSelected ? "bg-brand-600/20" : "hover:bg-surface-800"}`}
                  >
                    <Avatar user={u} size="sm" />
                    <span className="flex-1 text-left text-sm text-slate-200">{u.username}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Creating…" : `Create Group${selected.length > 0 ? ` (${selected.length + 1} members)` : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}

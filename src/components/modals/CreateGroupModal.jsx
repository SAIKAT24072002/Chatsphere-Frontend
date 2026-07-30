import { useState } from "react";
import { useDispatch } from "react-redux";
import { createGroup } from "../../redux/slices/chatSlice";
import UserSearchSelect from "../ui/UserSearchSelect";
import toast from "react-hot-toast";

export default function CreateGroupModal({ onClose }) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

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
    <div className="card w-full rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col animate-scale-up">
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

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Members
            </label>
            <UserSearchSelect
              selectedUsers={selected}
              onChange={setSelected}
              placeholder="Search users by username or email..."
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Creating…" : `Create Group${selected.length > 0 ? ` (${selected.length + 1} members)` : ""}`}
          </button>
        </form>
      </div>
    </div>
  );
}

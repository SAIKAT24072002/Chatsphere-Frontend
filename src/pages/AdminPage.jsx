import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../utils/api";
import Avatar from "../components/ui/Avatar";
import toast from "react-hot-toast";

const TABS = ["overview", "users", "groups", "moderation"];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  const [allUsers, setAllUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [createForm, setCreateForm] = useState({ name: "", description: "", members: [], admins: [] });
  const [editForm, setEditForm] = useState({ name: "", description: "", members: [], admins: [] });

  useEffect(() => { fetchAnalytics(); }, []);
  useEffect(() => { if (tab === "users") fetchUsers(); }, [tab, userSearch, userPage]);
  useEffect(() => { if (tab === "groups") fetchGroups(); }, [tab]);
  useEffect(() => { if (tab === "moderation") fetchFlagged(); }, [tab]);

  const fetchAnalytics = async () => {
    try { const res = await api.get("/admin/analytics"); setAnalytics(res.data); }
    catch { toast.error("Failed to load analytics"); }
  };
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${userSearch}&page=${userPage}`);
      setUsers(res.data.users); setUserTotal(res.data.total);
    } catch { toast.error("Failed to load users"); }
    setLoading(false);
  };
  const fetchGroups = async () => {
    setLoading(true);
    try { const res = await api.get("/admin/groups"); setGroups(res.data); } catch {}
    setLoading(false);
  };
  const fetchFlagged = async () => {
    setLoading(true);
    try { const res = await api.get("/admin/flagged"); setFlagged(res.data); } catch {}
    setLoading(false);
  };
  const toggleUser = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}/toggle`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: res.data.isActive } : u));
      toast.success(res.data.isActive ? "User activated" : "User deactivated");
    } catch { toast.error("Failed"); }
  };
  const deleteGroup = async (id) => {
    if (!confirm("Delete this group?")) return;
    try { await api.delete(`/admin/groups/${id}`); setGroups((prev) => prev.filter((g) => g._id !== id)); toast.success("Group deleted"); }
    catch { toast.error("Failed"); }
  };
  const deleteFlag = async (id) => {
    try { await api.delete(`/admin/flagged/${id}`); setFlagged((prev) => prev.filter((m) => m._id !== id)); toast.success("Message removed"); }
    catch { toast.error("Failed"); }
  };
  const dismissFlag = async (id) => {
    try { await api.patch(`/admin/flagged/${id}/dismiss`); setFlagged((prev) => prev.filter((m) => m._id !== id)); toast.success("Dismissed"); }
    catch { setFlagged((prev) => prev.filter((m) => m._id !== id)); }
  };

  const fetchAllUsersForSelection = async () => {
    try {
      const res = await api.get("/users");
      setAllUsers(res.data);
    } catch {
      toast.error("Failed to load user selection list");
    }
  };
  const openCreateModal = () => {
    setCreateForm({ name: "", description: "", members: [], admins: [] });
    fetchAllUsersForSelection();
    setShowCreateModal(true);
  };
  const openEditModal = (group) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name || "",
      description: group.description || "",
      members: group.members?.map((m) => m._id || m) || [],
      admins: group.admins?.map((a) => a._id || a) || [],
    });
    fetchAllUsersForSelection();
    setShowEditModal(true);
  };
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name) return toast.error("Group name is required");
    if (createForm.members.length === 0) return toast.error("Select at least one member");
    try {
      const res = await api.post("/admin/groups", createForm);
      setGroups((prev) => [res.data, ...prev]);
      toast.success("Group created successfully");
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    }
  };
  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!editForm.name) return toast.error("Group name is required");
    if (editForm.members.length === 0) return toast.error("Select at least one member");
    try {
      const res = await api.put(`/admin/groups/${editingGroup._id}`, editForm);
      setGroups((prev) => prev.map((g) => g._id === editingGroup._id ? res.data : g));
      toast.success("Group updated successfully");
      setShowEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update group");
    }
  };

  const StatCard = ({ label, value, sub, icon, color }) => (
    <div className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 ${color} rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-xs sm:text-sm font-medium text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 pb-12">
      {/* Header */}
      <div className="bg-surface-900 border-b border-surface-800 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-slate-500 hidden sm:block">ChatSphere management console</p>
          </div>
        </div>
        <Avatar user={user} size="sm" showStatus />
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="bg-surface-900 border-b border-surface-800 px-2 sm:px-6 overflow-x-auto">
        <div className="flex gap-0.5 sm:gap-1 min-w-max">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${
                tab === t ? "border-brand-500 text-brand-400" : "border-transparent text-slate-400 hover:text-white"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && analytics && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Users"    value={analytics.totalUsers}    sub={`+${analytics.newUsers} this week`}       icon="👥" color="bg-brand-600/20"   />
              <StatCard label="Active Users"   value={analytics.activeUsers}   sub={`${analytics.onlineUsers} online now`}    icon="🟢" color="bg-emerald-600/20" />
              <StatCard label="Total Messages" value={analytics.totalMessages} sub={`+${analytics.recentMessages} this week`} icon="💬" color="bg-violet-600/20"  />
              <StatCard label="Groups"         value={analytics.totalGroups}   sub={`${analytics.totalChats} total chats`}    icon="👨‍👩‍👧" color="bg-amber-600/20"  />
            </div>

            {analytics.flaggedMessages > 0 && (
              <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <span className="text-rose-400 flex-shrink-0">⚠️</span>
                <p className="text-sm text-rose-300 flex-1">
                  <span className="font-bold">{analytics.flaggedMessages}</span> flagged messages pending review
                </p>
                <button onClick={() => setTab("moderation")} className="text-xs text-rose-400 hover:text-rose-300 underline whitespace-nowrap flex-shrink-0">Review</button>
              </div>
            )}

            {analytics.msgPerDay?.length > 0 && (
              <div className="card p-4 sm:p-6">
                <h3 className="font-semibold text-white mb-4 text-sm sm:text-base">Messages — Last 7 Days</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.msgPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="_id" tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={30} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 12 }} labelFormatter={(v) => `Date: ${v}`} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Messages" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="card p-4 sm:p-5">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Platform Summary</h4>
                <div className="space-y-3">
                  {[
                    { label: "Direct Chats",      value: analytics.totalChats - analytics.totalGroups },
                    { label: "Group Chats",        value: analytics.totalGroups },
                    { label: "Flagged Content",    value: analytics.flaggedMessages },
                    { label: "Inactive Accounts",  value: analytics.totalUsers - analytics.activeUsers },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-400 truncate">{label}</span>
                      <span className="text-sm font-medium text-white flex-shrink-0">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-4 sm:p-5">
                <h4 className="text-sm font-medium text-slate-400 mb-3">User Activity</h4>
                <div className="space-y-3">
                  {[
                    { label: "Online Now",       value: analytics.onlineUsers,   color: "text-emerald-400" },
                    { label: "Active (7d)",       value: analytics.newUsers,      color: "text-brand-400"   },
                    { label: "Messages (7d)",     value: analytics.recentMessages, color: "text-violet-400" },
                    { label: "Total Registered",  value: analytics.totalUsers,    color: "text-slate-300"   },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-400 truncate">{label}</span>
                      <span className={`text-sm font-bold flex-shrink-0 ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" fill="none" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input className="input-base" style={{ paddingLeft: "2.5rem" }} placeholder="Search users..." value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} />
              </div>
              <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">{userTotal} users</span>
            </div>

            <div className="card overflow-hidden flex flex-col">
              {/* Mobile: card list */}
              <div className="sm:hidden divide-y divide-surface-800 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
                ) : users.map((u) => (
                  <div key={u._id} className="p-4 flex items-center gap-3">
                    <Avatar user={u} size="sm" showStatus />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{u.username}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-brand-600/20 text-brand-400" : "bg-surface-700 text-slate-400"}`}>{u.role}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${u.status === "online" ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-700 text-slate-400"}`}>{u.status}</span>
                      </div>
                    </div>
                    <button onClick={() => toggleUser(u._id)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ${
                        u.isActive ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-900 z-10">
                    <tr className="border-b border-surface-800 text-slate-400 text-xs uppercase tracking-wider bg-surface-900">
                      <th className="text-left px-5 py-3 bg-surface-900">User</th>
                      <th className="text-left px-5 py-3 bg-surface-900">Email</th>
                      <th className="text-left px-5 py-3 bg-surface-900">Status</th>
                      <th className="text-left px-5 py-3 bg-surface-900">Role</th>
                      <th className="text-left px-5 py-3 bg-surface-900">Joined</th>
                      <th className="text-left px-5 py-3 bg-surface-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-500">Loading…</td></tr>
                    ) : users.map((u) => (
                      <tr key={u._id} className="border-b border-surface-800/50 hover:bg-surface-800/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={u} size="sm" showStatus />
                            <span className="font-medium text-slate-200">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-400">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${u.status === "online" ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-700 text-slate-400"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === "online" ? "bg-emerald-400" : "bg-slate-500"}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-brand-600/20 text-brand-400" : "bg-surface-700 text-slate-400"}`}>{u.role}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => toggleUser(u._id)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isActive ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {userTotal > 20 && (
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-surface-800">
                  <span className="text-xs text-slate-500">Page {userPage} of {Math.ceil(userTotal / 20)}</span>
                  <div className="flex gap-2">
                    <button disabled={userPage === 1} onClick={() => setUserPage((p) => p - 1)} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30">← Prev</button>
                    <button disabled={userPage >= Math.ceil(userTotal / 20)} onClick={() => setUserPage((p) => p + 1)} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30">Next →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GROUPS ── */}
        {tab === "groups" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-white">All Groups ({groups.length})</h2>
              <button onClick={openCreateModal}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg shadow-brand-600/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Group
              </button>
            </div>
            <div className="grid gap-3">
              {loading ? (
                <div className="card p-10 text-center text-slate-500">Loading…</div>
              ) : groups.length === 0 ? (
                <div className="card p-10 text-center text-slate-500">No groups found</div>
              ) : groups.map((g) => (
                <div key={g._id} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
                    {g.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate text-sm">{g.name}</p>
                    <p className="text-xs text-slate-500">{g.members?.length} members • {new Date(g.createdAt).toLocaleDateString()}</p>
                    {g.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{g.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:flex -space-x-1">
                      {g.members?.slice(0, 3).map((m) => (
                        <Avatar key={m._id || m} user={typeof m === "object" ? m : { username: "?" }} size="xs" />
                      ))}
                      {g.members?.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-xs text-slate-400 ring-2 ring-surface-900">+{g.members.length - 3}</div>
                      )}
                    </div>
                    <button onClick={() => openEditModal(g)}
                      className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 font-medium transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deleteGroup(g._id)}
                      className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-medium transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MODERATION ── */}
        {tab === "moderation" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm sm:text-base font-semibold text-white">Flagged Messages ({flagged.length})</h2>
              {flagged.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 rounded-xl flex-shrink-0">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-xs text-rose-400 font-medium">{flagged.length} pending</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="card p-10 text-center text-slate-500">Loading…</div>
            ) : flagged.length === 0 ? (
              <div className="card p-12 flex flex-col items-center gap-3 text-slate-500">
                <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No flagged messages — all clear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flagged.map((msg) => (
                  <div key={msg._id} className="card p-4 border-l-4 border-rose-500/50">
                    <div className="flex items-start gap-3">
                      <Avatar user={msg.sender} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-slate-200">{msg.sender?.username}</span>
                          <span className="text-xs text-slate-500">in</span>
                          <span className="text-xs text-brand-400">{msg.chat?.name || "Direct Chat"}</span>
                          <span className="text-xs text-slate-600 hidden sm:inline">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-300 break-words">{msg.content}</p>
                        {msg.flagReason && <p className="text-xs text-amber-400 mt-1">Reason: {msg.flagReason}</p>}
                        <div className="flex gap-2 mt-3 sm:hidden">
                          <button onClick={() => dismissFlag(msg._id)} className="text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-slate-400 hover:text-white font-medium transition-colors">Dismiss</button>
                          <button onClick={() => deleteFlag(msg._id)} className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-medium transition-colors">Remove</button>
                        </div>
                      </div>
                      <div className="hidden sm:flex gap-2 flex-shrink-0">
                        <button onClick={() => dismissFlag(msg._id)} className="text-xs px-3 py-1.5 rounded-lg bg-surface-700 text-slate-400 hover:text-white hover:bg-surface-600 font-medium transition-colors">Dismiss</button>
                        <button onClick={() => deleteFlag(msg._id)} className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-medium transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg max-h-[85vh] flex flex-col p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-surface-800">
              <h3 className="text-base sm:text-lg font-bold text-white">Create Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Group Name</label>
                <input type="text" className="input-base" placeholder="Enter group name..." value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
                <textarea className="input-base min-h-[70px] resize-none" placeholder="Enter description (optional)..." value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} maxLength={300} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select Members & Assign Admins</label>
                <div className="space-y-2 border border-surface-800 rounded-xl p-3 bg-surface-950/50 max-h-[200px] overflow-y-auto divide-y divide-surface-800/40">
                  {allUsers.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 text-center">No other users available</p>
                  ) : allUsers.map((u) => {
                    const isSelected = createForm.members.includes(u._id);
                    const isAdmin = createForm.admins.includes(u._id);
                    return (
                      <div key={u._id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                          <input type="checkbox" checked={isSelected} className="checkbox-base"
                            onChange={() => {
                              const newMembers = isSelected
                                ? createForm.members.filter((id) => id !== u._id)
                                : [...createForm.members, u._id];
                              const newAdmins = isSelected
                                ? createForm.admins.filter((id) => id !== u._id)
                                : createForm.admins;
                              setCreateForm({ ...createForm, members: newMembers, admins: newAdmins });
                            }} />
                          <Avatar user={u} size="xs" />
                          <span className="text-sm font-medium text-slate-300 truncate">{u.username}</span>
                        </label>
                        {isSelected && (
                          <button type="button" onClick={() => {
                            const newAdmins = isAdmin
                              ? createForm.admins.filter((id) => id !== u._id)
                              : [...createForm.admins, u._id];
                            setCreateForm({ ...createForm, admins: newAdmins });
                          }} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border transition-colors ${
                            isAdmin ? "bg-brand-600/20 text-brand-400 border-brand-500/30" : "bg-transparent text-slate-500 border-surface-800 hover:text-slate-300"
                          }`}>
                            {isAdmin ? "Admin" : "Make Admin"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t border-surface-800 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary py-2 text-xs">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg max-h-[85vh] flex flex-col p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-surface-800">
              <h3 className="text-base sm:text-lg font-bold text-white">Edit Group: {editingGroup?.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditGroup} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Group Name</label>
                <input type="text" className="input-base" placeholder="Enter group name..." value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
                <textarea className="input-base min-h-[70px] resize-none" placeholder="Enter description (optional)..." value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} maxLength={300} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select Members & Assign Admins</label>
                <div className="space-y-2 border border-surface-800 rounded-xl p-3 bg-surface-950/50 max-h-[200px] overflow-y-auto divide-y divide-surface-800/40">
                  {allUsers.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 text-center">No other users available</p>
                  ) : allUsers.map((u) => {
                    const isSelected = editForm.members.includes(u._id);
                    const isAdmin = editForm.admins.includes(u._id);
                    return (
                      <div key={u._id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                          <input type="checkbox" checked={isSelected} className="checkbox-base"
                            onChange={() => {
                              const newMembers = isSelected
                                ? editForm.members.filter((id) => id !== u._id)
                                : [...editForm.members, u._id];
                              const newAdmins = isSelected
                                ? editForm.admins.filter((id) => id !== u._id)
                                : editForm.admins;
                              setEditForm({ ...editForm, members: newMembers, admins: newAdmins });
                            }} />
                          <Avatar user={u} size="xs" />
                          <span className="text-sm font-medium text-slate-300 truncate">{u.username}</span>
                        </label>
                        {isSelected && (
                          <button type="button" onClick={() => {
                            const newAdmins = isAdmin
                              ? editForm.admins.filter((id) => id !== u._id)
                              : [...editForm.admins, u._id];
                            setEditForm({ ...editForm, admins: newAdmins });
                          }} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border transition-colors ${
                            isAdmin ? "bg-brand-600/20 text-brand-400 border-brand-500/30" : "bg-transparent text-slate-500 border-surface-800 hover:text-slate-300"
                          }`}>
                            {isAdmin ? "Admin" : "Make Admin"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t border-surface-800 justify-end">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary py-2 text-xs">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

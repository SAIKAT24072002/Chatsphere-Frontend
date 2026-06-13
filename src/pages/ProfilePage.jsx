import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateProfile, uploadAvatar } from "../redux/slices/authSlice";
import Avatar from "../components/ui/Avatar";
import api from "../utils/api";
import toast from "react-hot-toast";
import { getSocket } from "../utils/socket";

const STATUS_OPTIONS = ["online", "away", "busy", "offline"];

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ username: user?.username || "", bio: user?.bio || "", customStatus: user?.customStatus || "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmNew: "" });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const fileRef = useRef();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await dispatch(updateProfile(form));
    setSaving(false);
    if (!res.error) toast.success("Profile updated");
    else toast.error(res.payload);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await dispatch(uploadAvatar(formData));
    if (!res.error) toast.success("Avatar updated");
    else toast.error(res.payload);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNew) return toast.error("Passwords don't match");
    if (pwForm.newPassword.length < 6) return toast.error("New password too short");
    try {
      await api.put("/users/password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password changed");
      setPwForm({ currentPassword: "", newPassword: "", confirmNew: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleStatus = async (status) => {
    const socket = getSocket();
    if (socket) socket.emit("setStatus", { status });
    try { await api.put("/users/profile", { status }); } catch {}
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <div className="bg-surface-900 border-b border-surface-800 px-4 sm:px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-base sm:text-lg font-bold text-white">Profile Settings</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 sm:py-8">
        {/* Avatar section */}
        <div className="card p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative flex-shrink-0">
              <Avatar user={user} size="xl" showStatus />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleAvatar} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{user?.username}</h2>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => handleStatus(s)}
                    className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors ${user?.status === s ? "bg-brand-600 text-white" : "bg-surface-800 text-slate-400 hover:text-white"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 sm:mb-5 bg-surface-900 p-1 rounded-xl">
          {["profile", "security"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium capitalize rounded-lg transition-colors ${activeTab === tab ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "profile" ? (
          <form onSubmit={handleSave} className="card p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input className="input-base" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
              <textarea className="input-base resize-none" rows={3}
                placeholder="Tell people about yourself…" value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={200} />
              <p className="text-xs text-slate-600 text-right mt-1">{form.bio.length}/200</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Custom Status</label>
              <input className="input-base" placeholder="What's on your mind?"
                value={form.customStatus} onChange={(e) => setForm({ ...form, customStatus: e.target.value })} maxLength={100} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} className="card p-4 sm:p-6 space-y-4">
            <h3 className="font-semibold text-white">Change Password</h3>
            {["currentPassword", "newPassword", "confirmNew"].map((f) => (
              <div key={f}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 capitalize">
                  {f.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <input type="password" className="input-base" value={pwForm[f]}
                  onChange={(e) => setPwForm({ ...pwForm, [f]: e.target.value })} required />
              </div>
            ))}
            <button type="submit" className="btn-primary w-full py-2.5">Update Password</button>
          </form>
        )}
      </div>
    </div>
  );
}

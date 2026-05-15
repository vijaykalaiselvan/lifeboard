"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import api from "@/lib/api";

const NAV = [
  { to: "/finance",   label: "Finance",   icon: "💰" },
  { to: "/tasks",     label: "Tasks",     icon: "✅" },
  { to: "/notes",     label: "Notes",     icon: "📝" },
  { to: "/habits",    label: "Habits",    icon: "🔥" },
  { to: "/goals",     label: "Goals",     icon: "🎯" },
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function Layout({ children }) {
  const { user, profiles, activeProfileId, logout, switchProfile, addProfile, removeProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [addingProfile, setAddingProfile] = useState(false);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  async function handleAddProfile(e) {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    try {
      const { data } = await api.post("/profiles", { name: newProfileName.trim() });
      addProfile(data);
      switchProfile(data.id);
      setNewProfileName("");
      setAddingProfile(false);
    } catch {}
  }

  async function handleDeleteProfile(id) {
    if (profiles.length <= 1) return;
    try {
      await api.delete(`/profiles/${id}`);
      removeProfile(id);
      if (activeProfileId === id) switchProfile(profiles.find((p) => p.id !== id)?.id);
    } catch {}
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left"
          >
            <span className="text-lg">👤</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 leading-none">{user?.name}</p>
              <p className="text-sm font-medium text-white truncate">{activeProfile?.name ?? "—"}</p>
            </div>
            <span className="text-gray-500 text-xs">{showProfileMenu ? "▲" : "▼"}</span>
          </button>

          {showProfileMenu && (
            <div className="mt-2 space-y-1">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { switchProfile(p.id); setShowProfileMenu(false); }}
                    className={`flex-1 text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      p.id === activeProfileId ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    {p.name}
                  </button>
                  {profiles.length > 1 && (
                    <button onClick={() => handleDeleteProfile(p.id)} className="text-gray-600 hover:text-red-400 px-1 text-xs" title="Delete profile">
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {addingProfile ? (
                <form onSubmit={handleAddProfile} className="flex gap-1 mt-1">
                  <input
                    autoFocus
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile name"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" className="text-indigo-400 text-xs px-1">✓</button>
                  <button type="button" onClick={() => setAddingProfile(false)} className="text-gray-500 text-xs px-1">✕</button>
                </form>
              ) : (
                <button onClick={() => setAddingProfile(true)} className="w-full text-left px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                  + Add profile
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <Link
              key={to}
              href={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === to || pathname.startsWith(to + "/")
                  ? "bg-indigo-600/20 text-indigo-300 font-medium"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
          >
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

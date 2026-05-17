"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import ThemeToggle from "./ThemeToggle";
import api from "@/lib/api";

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function IconFinance() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}

function IconTasks() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}

function IconNotes() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  );
}

function IconHabits() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-5 4.5-5 9.5a5 5 0 0 0 10 0C17 6.5 12 2 12 2z"/>
    </svg>
  );
}

function IconGoals() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

function IconPlanning() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconChevron({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { to: "/finance",   label: "Finance",   Icon: IconFinance   },
  { to: "/planning",  label: "Planning",  Icon: IconPlanning  },
  { to: "/tasks",     label: "Tasks",     Icon: IconTasks     },
  { to: "/notes",     label: "Notes",     Icon: IconNotes     },
  { to: "/habits",    label: "Habits",    Icon: IconHabits    },
  { to: "/goals",     label: "Goals",     Icon: IconGoals     },
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
    <div className="flex h-screen bg-bg-base text-text-primary overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col bg-bg-surface border-r border-border">

        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-tight">Lifeboard</span>
          </div>
        </div>

        {/* Profile switcher */}
        <div className="p-3 border-b border-border">
          <button
            onClick={() => setShowProfileMenu((v) => !v)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-elevated hover:bg-bg-elevated transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-accent-bg flex items-center justify-center flex-shrink-0 text-accent">
              <IconUser />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-text-muted leading-none truncate">{user?.name}</p>
              <p className="text-sm font-medium text-text-primary truncate mt-0.5">{activeProfile?.name ?? "—"}</p>
            </div>
            <span className="text-text-muted">
              <IconChevron open={showProfileMenu} />
            </span>
          </button>

          {showProfileMenu && (
            <div className="mt-1.5 space-y-0.5">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { switchProfile(p.id); setShowProfileMenu(false); }}
                    className={`flex-1 text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      p.id === activeProfileId
                        ? "bg-accent-bg text-accent font-medium"
                        : "text-text-secondary hover:bg-bg-elevated"
                    }`}
                  >
                    {p.name}
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => handleDeleteProfile(p.id)}
                      className="text-text-muted hover:text-red-500 px-1.5 py-1 text-xs rounded transition-colors"
                      title="Delete profile"
                    >
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
                    className="flex-1 bg-bg-elevated border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
                  />
                  <button type="submit" className="text-accent text-xs px-1.5">✓</button>
                  <button type="button" onClick={() => setAddingProfile(false)} className="text-text-muted text-xs px-1">✕</button>
                </form>
              ) : (
                <button
                  onClick={() => setAddingProfile(true)}
                  className="w-full text-left px-3 py-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  + Add profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, label, Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to + "/"));
            return (
              <Link
                key={to}
                href={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent-bg text-accent font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: sign out + theme toggle */}
        <div className="p-3 border-t border-border flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-red-500 hover:bg-bg-elevated transition-colors"
          >
            <IconSignOut />
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-bg-base">
        {children}
      </main>
    </div>
  );
}

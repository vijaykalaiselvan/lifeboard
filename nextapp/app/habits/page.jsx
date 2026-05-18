"use client";
import { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
const EMPTY = { name: "", description: "", frequency: "daily", color: COLORS[0], icon: "" };

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function computeStreak(logs, today) {
  const done = new Set(logs.filter((l) => l.completed).map((l) => isoDate(new Date(l.date))));
  let streak = 0;
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  while (done.has(isoDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = isoDate(today);
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(thirtyAgo.getDate() - 29);

  async function loadLogs(habitList) {
    const from = isoDate(thirtyAgo);
    const entries = await Promise.all(
      habitList.map((h) => api.get(`/habits/${h.id}/logs?from=${from}&to=${todayStr}`).then((r) => [h.id, r.data]))
    );
    setLogs(Object.fromEntries(entries));
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/habits");
      setHabits(data);
      if (data.length > 0) await loadLogs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(h) {
    setForm({ name: h.name, description: h.description ?? "", frequency: h.frequency, color: h.color ?? COLORS[0], icon: h.icon ?? "" });
    setEditing(h.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) await api.put(`/habits/${editing}`, form);
    else await api.post("/habits", form);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/habits/${id}`);
    load();
  }

  async function toggleToday(habit) {
    const habitLogs = logs[habit.id] ?? [];
    const todayLog = habitLogs.find((l) => isoDate(new Date(l.date)) === todayStr);
    const completed = todayLog ? !todayLog.completed : true;
    await api.post(`/habits/${habit.id}/log`, { date: todayStr, completed });
    load();
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Habits</h1>
            <p className="text-sm text-text-muted mt-1">{habits.length} tracked habits</p>
          </div>
          <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            + New Habit
          </button>
        </div>

        {showForm && (
          <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Habit" : "New Habit"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                  placeholder="Morning run, Read 30 min…" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Frequency</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Icon (emoji)</label>
                <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
                  placeholder="🏃 (optional)" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Color</label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-text-primary scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-text-secondary">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                  placeholder="Optional note…" />
              </div>
              <div className="sm:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                  {editing ? "Save changes" : "Create habit"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-text-muted text-sm">Loading…</p>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <p className="text-5xl mb-3">🔥</p>
            <p>No habits yet. Start building one today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop column headers only */}
            <div className="hidden md:flex items-center gap-4 px-5">
              <div className="flex-1" />
              <div className="flex gap-1">
                {weekDays.map((d) => (
                  <div key={d.toISOString()} className="w-7 text-center text-[10px] text-text-muted font-medium">
                    {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </div>
                ))}
              </div>
              <div className="w-14 text-center text-[10px] text-text-muted font-medium">Streak</div>
              <div className="w-16" />
            </div>

            {habits.map((habit) => {
              const habitLogs = logs[habit.id] ?? [];
              const todayLog = habitLogs.find((l) => isoDate(new Date(l.date)) === todayStr);
              const doneToday = todayLog?.completed ?? false;
              const streak = computeStreak(habitLogs, today);
              const color = habit.color ?? COLORS[0];

              return (
                <div key={habit.id} className="bg-bg-surface border border-border rounded-xl px-4 md:px-5 py-3.5 md:py-4 shadow-sm">
                  {/* Top row */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <button onClick={() => toggleToday(habit)}
                        className="w-10 h-10 md:w-9 md:h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base border-2 transition-all select-none"
                        style={doneToday
                          ? { backgroundColor: color, borderColor: color, color: "#fff" }
                          : { borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}>
                        {doneToday ? "✓" : (habit.icon || "○")}
                      </button>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary">{habit.name}</p>
                        {habit.description && (
                          <p className="text-xs text-text-muted truncate">{habit.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Desktop week strip */}
                    <div className="hidden md:flex gap-1 flex-shrink-0">
                      {weekDays.map((d) => {
                        const dStr = isoDate(d);
                        const log = habitLogs.find((l) => isoDate(new Date(l.date)) === dStr);
                        const done = log?.completed ?? false;
                        return (
                          <div key={dStr} className="w-7 h-7 rounded-md flex items-center justify-center"
                            style={done ? { backgroundColor: color + "33" } : { backgroundColor: "var(--color-bg-elevated)" }}>
                            {done
                              ? <span className="text-xs font-bold" style={{ color }}>✓</span>
                              : <span className="text-border text-xs">·</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop streak */}
                    <div className="hidden md:block w-14 text-center flex-shrink-0">
                      {streak > 0 ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <span className="text-sm font-bold text-orange-500">{streak}</span>
                          <span className="text-xs">🔥</span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(habit)} className="text-text-muted hover:text-accent text-xs transition-colors">Edit</button>
                      <button onClick={() => handleDelete(habit.id)} className="text-text-muted hover:text-red-500 text-xs transition-colors">Del</button>
                    </div>
                  </div>

                  {/* Mobile week strip + streak under the title row */}
                  <div className="md:hidden flex items-center justify-between mt-3 ml-13">
                    <div className="flex gap-1">
                      {weekDays.map((d) => {
                        const dStr = isoDate(d);
                        const log = habitLogs.find((l) => isoDate(new Date(l.date)) === dStr);
                        const done = log?.completed ?? false;
                        return (
                          <div key={dStr} className="flex flex-col items-center gap-1">
                            <span className="text-[9px] text-text-muted leading-none">{d.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                            <div className="w-7 h-7 rounded-md flex items-center justify-center"
                              style={done ? { backgroundColor: color + "33" } : { backgroundColor: "var(--color-bg-elevated)" }}>
                              {done
                                ? <span className="text-xs font-bold" style={{ color }}>✓</span>
                                : <span className="text-text-muted text-xs">·</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {streak > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-base font-bold text-orange-500">{streak}</span>
                        <span className="text-sm">🔥</span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">no streak</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

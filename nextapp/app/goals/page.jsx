"use client";
import { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

const EMPTY = { title: "", description: "", category: "personal", status: "active", targetDate: "", progress: 0 };
const CATEGORIES = ["personal", "financial", "health", "career"];
const STATUSES = ["active", "completed", "paused"];

const CATEGORY_COLORS = {
  personal:  "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  financial: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  health:    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  career:    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
};
const STATUS_COLORS = {
  active:    "bg-accent-bg text-accent",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  paused:    "bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [expanded, setExpanded] = useState(null);
  const [msForm, setMsForm] = useState({ title: "", dueDate: "" });
  const [addingMs, setAddingMs] = useState(null);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/goals"); setGoals(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(goal) {
    setForm({ title: goal.title, description: goal.description ?? "", category: goal.category, status: goal.status, targetDate: goal.targetDate?.slice(0, 10) ?? "", progress: goal.progress ?? 0 });
    setEditing(goal.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, progress: Number(form.progress) };
    if (editing) await api.put(`/goals/${editing}`, payload);
    else await api.post("/goals", payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/goals/${id}`);
    load();
  }

  async function handleAddMilestone(goalId, e) {
    e.preventDefault();
    if (!msForm.title.trim()) return;
    await api.post(`/goals/${goalId}/milestones`, msForm);
    setAddingMs(null);
    setMsForm({ title: "", dueDate: "" });
    load();
  }

  async function handleToggleMilestone(goalId, ms) {
    await api.put(`/goals/${goalId}/milestones/${ms.id}`, { completed: !ms.completed });
    load();
  }

  async function handleDeleteMilestone(goalId, msId) {
    await api.delete(`/goals/${goalId}/milestones/${msId}`);
    load();
  }

  return (
    <ProtectedLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Goals</h1>
            <p className="text-sm text-text-muted mt-0.5">{goals.filter((g) => g.status === "active").length} active goals</p>
          </div>
          <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            + New Goal
          </button>
        </div>

        {showForm && (
          <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-sm mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Goal" : "New Goal"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-text-secondary">Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                  placeholder="Save ₹3L emergency fund…" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Target Date</label>
                <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Progress ({form.progress}%)</label>
                <input type="range" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })}
                  className="w-full accent-accent mt-1" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-text-secondary">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted resize-none"
                  placeholder="Optional description…" />
              </div>
              <div className="col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                  {editing ? "Save changes" : "Create goal"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-text-muted text-sm">Loading…</p>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <p className="text-5xl mb-3">🎯</p>
            <p>No goals yet. Create your first goal to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const isExpanded = expanded === goal.id;
              const completedMs = goal.milestones?.filter((m) => m.completed).length ?? 0;
              const totalMs = goal.milestones?.length ?? 0;
              const daysLeft = goal.targetDate
                ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={goal.id} className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-text-primary">{goal.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[goal.category] ?? "bg-bg-elevated text-text-secondary"}`}>
                            {goal.category}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[goal.status] ?? ""}`}>
                            {goal.status}
                          </span>
                        </div>
                        {goal.description && <p className="text-xs text-text-muted mb-2">{goal.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-text-muted mb-2">
                          {daysLeft !== null && (
                            <span className={daysLeft < 30 && goal.status === "active" ? "text-orange-500" : ""}>
                              {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? "Due today" : "Overdue"}
                            </span>
                          )}
                          {totalMs > 0 && <span>{completedMs}/{totalMs} milestones</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${goal.progress ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-text-muted w-8 text-right">{goal.progress ?? 0}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setExpanded(isExpanded ? null : goal.id)}
                          className="text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded border border-border transition-colors">
                          {isExpanded ? "Collapse" : "Milestones"}
                        </button>
                        <button onClick={() => openEdit(goal)} className="text-xs text-text-muted hover:text-accent transition-colors">Edit</button>
                        <button onClick={() => handleDelete(goal.id)} className="text-xs text-text-muted hover:text-red-500 transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-bg-elevated/50 px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Milestones</p>
                        <button onClick={() => setAddingMs(addingMs === goal.id ? null : goal.id)}
                          className="text-xs text-accent hover:text-accent/80">+ Add</button>
                      </div>
                      {addingMs === goal.id && (
                        <form onSubmit={(e) => handleAddMilestone(goal.id, e)} className="flex gap-2 mb-3">
                          <input required value={msForm.title} onChange={(e) => setMsForm({ ...msForm, title: e.target.value })}
                            placeholder="Milestone title…"
                            className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted" />
                          <input type="date" value={msForm.dueDate} onChange={(e) => setMsForm({ ...msForm, dueDate: e.target.value })}
                            className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
                          <button type="submit" className="px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent/90">Add</button>
                          <button type="button" onClick={() => setAddingMs(null)} className="px-2 text-text-muted hover:text-text-primary">✕</button>
                        </form>
                      )}
                      {(!goal.milestones || goal.milestones.length === 0) ? (
                        <p className="text-xs text-text-muted">No milestones yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {goal.milestones.map((ms) => (
                            <div key={ms.id} className="flex items-center gap-3">
                              <button onClick={() => handleToggleMilestone(goal.id, ms)}
                                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${ms.completed ? "bg-accent border-accent text-white" : "border-border bg-bg-surface"}`}>
                                {ms.completed && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                )}
                              </button>
                              <span className={`text-sm flex-1 ${ms.completed ? "line-through text-text-muted" : "text-text-primary"}`}>{ms.title}</span>
                              {ms.dueDate && <span className="text-xs text-text-muted">{new Date(ms.dueDate).toLocaleDateString()}</span>}
                              <button onClick={() => handleDeleteMilestone(goal.id, ms.id)} className="text-text-muted hover:text-red-500 text-xs">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

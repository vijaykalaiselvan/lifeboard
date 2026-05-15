"use client";
import { useState, useEffect, useMemo } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

const EMPTY = { title: "", description: "", status: "todo", priority: "medium", dueDate: "" };

const STATUS_CONFIG = {
  todo:          { label: "To Do",       color: "bg-gray-500/20 text-gray-300" },
  "in-progress": { label: "In Progress", color: "bg-yellow-500/20 text-yellow-300" },
  done:          { label: "Done",        color: "bg-green-500/20 text-green-300" },
};

const PRIORITY_CONFIG = {
  low:    { label: "Low",    color: "text-gray-400" },
  medium: { label: "Medium", color: "text-yellow-400" },
  high:   { label: "High",   color: "text-red-400" },
};

function isOverdue(task) {
  return task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/tasks"); setTasks(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  const filtered = useMemo(() => tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, filterStatus, filterPriority, search]);

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(task) { setForm({ ...task, dueDate: task.dueDate?.slice(0, 10) ?? "" }); setEditing(task.id); setShowForm(true); }
  function cancelForm() { setShowForm(false); setEditing(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, dueDate: form.dueDate || null };
    if (editing) await api.put(`/tasks/${editing}`, payload);
    else await api.post("/tasks", payload);
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/tasks/${id}`);
    load();
  }

  async function cycleStatus(task) {
    const next = { todo: "in-progress", "in-progress": "done", done: "todo" };
    await api.put(`/tasks/${task.id}`, { ...task, status: next[task.status] });
    load();
  }

  return (
    <ProtectedLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            + New Task
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",       value: counts.total,      color: "text-white" },
            { label: "To Do",       value: counts.todo,       color: "text-gray-300" },
            { label: "In Progress", value: counts.inProgress, color: "text-yellow-400" },
            { label: "Done",        value: counts.done,       color: "text-green-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {counts.overdue > 0 && (
          <div className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
            <span>⚠️</span>
            <span>{counts.overdue} overdue task{counts.overdue > 1 ? "s" : ""}</span>
          </div>
        )}

        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
            <h3 className="text-sm font-medium text-white mb-4">{editing ? "Edit Task" : "New Task"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Title</label>
                <input required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="What needs to be done?" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Description</label>
                <textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Optional details…" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={cancelForm} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                  {editing ? "Save changes" : "Add task"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…"
            className="flex-1 min-w-48 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {["all", "todo", "in-progress", "done"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === s ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {s === "all" ? "All" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {["all", "high", "medium", "low"].map((p) => (
              <button key={p} onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterPriority === p ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {p === "all" ? "All" : PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">✅</p>
            <p>{tasks.length === 0 ? "No tasks yet. Add your first one." : "No tasks match these filters."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const sc = STATUS_CONFIG[task.status];
              const pc = PRIORITY_CONFIG[task.priority];
              const overdue = isOverdue(task);
              return (
                <div key={task.id} className={`bg-gray-900 border rounded-xl px-5 py-4 flex items-start gap-4 hover:border-gray-700 transition-colors ${overdue ? "border-red-500/40" : "border-gray-800"} ${task.status === "done" ? "opacity-60" : ""}`}>
                  <button onClick={() => cycleStatus(task)} title="Click to advance status"
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      task.status === "done" ? "bg-green-500 border-green-500" : task.status === "in-progress" ? "border-yellow-400 bg-yellow-400/20" : "border-gray-600 hover:border-indigo-400"
                    }`}>
                    {task.status === "done" && <span className="text-white text-xs leading-none">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${task.status === "done" ? "line-through text-gray-500" : "text-white"}`}>{task.title}</p>
                    {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                      <span className={`text-xs font-medium ${pc.color}`}>{pc.label} priority</span>
                      {task.dueDate && (
                        <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-gray-500"}`}>
                          {overdue ? "⚠ Overdue · " : "Due "}{new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(task)} className="text-gray-500 hover:text-indigo-400 text-sm transition-colors">Edit</button>
                    <button onClick={() => handleDelete(task.id)} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Delete</button>
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

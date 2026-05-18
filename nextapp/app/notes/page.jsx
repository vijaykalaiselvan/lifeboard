"use client";
import { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";

const EMPTY = { title: "", content: "", tags: "", pinned: false };

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get("/notes"); setNotes(data); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const allTags = [...new Set(notes.flatMap((n) => n.tags ?? []))].sort();
  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q);
    const matchTag = !activeTag || (n.tags ?? []).includes(activeTag);
    return matchSearch && matchTag;
  });

  function openAdd() { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(note) {
    setForm({ title: note.title, content: note.content ?? "", tags: (note.tags ?? []).join(", "), pinned: note.pinned ?? false });
    setEditing(note.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = { ...form, tags };
    if (editing) await api.put(`/notes/${editing}`, payload);
    else await api.post("/notes", payload);
    setShowForm(false);
    load();
  }

  async function handleDelete(id) {
    await api.delete(`/notes/${id}`);
    load();
  }

  async function togglePin(note) {
    await api.put(`/notes/${note.id}`, { ...note, tags: note.tags ?? [], pinned: !note.pinned });
    load();
  }

  return (
    <ProtectedLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-5 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Notes</h1>
          <button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            + New Note
          </button>
        </div>

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…"
          className="w-full bg-bg-surface border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted mb-4" />

        {allTags.length > 0 && (
          <div className="flex gap-2 -mx-4 md:mx-0 px-4 md:px-0 mb-5 overflow-x-auto md:flex-wrap">
            <button onClick={() => setActiveTag(null)}
              className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${!activeTag ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:text-text-primary"}`}>
              All
            </button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${activeTag === tag ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:text-text-primary"}`}>
                {tag}
              </button>
            ))}
          </div>
        )}

        {showForm && (
          <div className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm mb-5">
            <h3 className="text-sm font-medium text-text-primary mb-4">{editing ? "Edit Note" : "New Note"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                  placeholder="Note title…" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-text-secondary">Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted resize-none"
                  placeholder="Write something…" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-text-secondary">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent placeholder:text-text-muted"
                    placeholder="finance, goals, ideas…" />
                </div>
                <label className="flex items-center gap-2 sm:pb-2 cursor-pointer">
                  <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                    className="w-4 h-4 accent-accent" />
                  <span className="text-sm text-text-secondary">Pinned</span>
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors">
                  {editing ? "Save changes" : "Create note"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-text-muted text-sm">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <p className="text-5xl mb-3">📝</p>
            <p>{notes.length === 0 ? "No notes yet. Create your first note." : "No notes match your search."}</p>
          </div>
        ) : (
          // 1 col mobile → 2 col desktop masonry
          <div className="columns-1 md:columns-2 gap-4">
            {filtered.map((note) => (
              <div key={note.id} className="bg-bg-surface border border-border rounded-xl p-4 md:p-5 shadow-sm break-inside-avoid mb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {note.pinned && <span className="text-yellow-500 flex-shrink-0 text-sm">📌</span>}
                    <h3 className="font-semibold text-text-primary truncate">{note.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => togglePin(note)}
                      className={`text-xs transition-colors ${note.pinned ? "text-yellow-500 hover:text-yellow-400" : "text-text-muted hover:text-yellow-400"}`}
                      title={note.pinned ? "Unpin" : "Pin"}>
                      {note.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button onClick={() => openEdit(note)} className="text-text-muted hover:text-accent text-xs transition-colors">Edit</button>
                    <button onClick={() => handleDelete(note.id)} className="text-text-muted hover:text-red-500 text-xs transition-colors">Del</button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3 line-clamp-6">{note.content}</p>
                )}
                {note.tags?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {note.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-text-muted">{new Date(note.updatedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

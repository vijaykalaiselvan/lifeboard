export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Life Dashboard</h1>
        <p className="text-gray-400">Foundation ready — modules coming next.</p>
        <div className="flex flex-wrap gap-2 justify-center pt-4">
          {["Finance", "Tasks", "Notes", "Habits", "Goals", "Dashboard"].map((m) => (
            <span key={m} className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-300 text-sm">
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

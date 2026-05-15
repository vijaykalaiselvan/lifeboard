export default function ComingSoon({ title, icon }) {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
      <div className="flex flex-col items-center justify-center py-32 text-gray-600">
        <span className="text-6xl mb-4">{icon}</span>
        <p className="text-lg">Coming soon</p>
      </div>
    </div>
  );
}

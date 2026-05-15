"use client";
import ProtectedLayout from "@/components/ProtectedLayout";

export default function HabitsPage() {
  return (
    <ProtectedLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Habits</h1>
        <div className="flex flex-col items-center justify-center py-32 text-gray-600">
          <span className="text-6xl mb-4">🔥</span>
          <p className="text-lg">Coming soon</p>
        </div>
      </div>
    </ProtectedLayout>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { analytics, type ParentDashboard, ApiError } from "@/lib/api";

const MASTERY_COLORS: Record<string, string> = {
  advanced: "text-green-700 bg-green-100",
  proficient: "text-blue-700 bg-blue-100",
  developing: "text-yellow-700 bg-yellow-100",
  emerging: "text-orange-700 bg-orange-100",
  not_started: "text-gray-500 bg-gray-100",
};

export default function DashboardPage() {
  const { parentToken, parentUser, logout, addChild, isLoading } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(5);
  const [addingChild, setAddingChild] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!parentToken || !parentUser) return;
    try {
      const data = await analytics.parentDashboard(parentToken, parentUser.id);
      setDashboard(data);
    } catch {
      // If token expired, redirect to login
      router.replace("/login");
    } finally {
      setLoadingData(false);
    }
  }, [parentToken, parentUser, router]);

  useEffect(() => {
    if (!isLoading && !parentToken) {
      router.replace("/login");
      return;
    }
    if (parentToken) loadDashboard();
  }, [parentToken, isLoading, router, loadDashboard]);

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAddingChild(true);

    try {
      await addChild({ display_name: childName, age: childAge });
      setChildName("");
      setChildAge(5);
      setShowAddChild(false);
      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("Failed to add child");
    } finally {
      setAddingChild(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  if (isLoading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-prodigee-700">Prodigee</h1>
            <p className="text-sm text-gray-500">Welcome, {parentUser?.display_name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/child-login")}
              className="px-4 py-2 rounded-lg bg-prodigee-600 text-white text-sm font-medium hover:bg-prodigee-700 transition-colors"
            >
              Start Learning Session
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-2xl font-bold text-prodigee-700">
              {dashboard?.total_children || 0}
            </div>
            <div className="text-sm text-gray-500">Children</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {dashboard?.children.reduce((sum, c) => sum + c.total_stars, 0) || 0}
            </div>
            <div className="text-sm text-gray-500">Total Stars</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {dashboard?.children.length
                ? Math.round(
                    dashboard.children.reduce((sum, c) => sum + c.overall_accuracy, 0) /
                    dashboard.children.length
                  )
                : 0}%
            </div>
            <div className="text-sm text-gray-500">Avg Accuracy</div>
          </div>
        </div>

        {/* Children Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Children</h2>
            <button
              onClick={() => setShowAddChild(true)}
              className="px-3 py-1.5 rounded-lg bg-prodigee-100 text-prodigee-700 text-sm font-medium hover:bg-prodigee-200 transition-colors"
            >
              + Add Child
            </button>
          </div>

          {/* Add Child Form */}
          {showAddChild && (
            <form onSubmit={handleAddChild} className="bg-white rounded-xl p-5 border border-prodigee-200 space-y-3">
              {error && <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-prodigee-500 outline-none"
                    placeholder="Child's name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    min={3}
                    max={18}
                    value={childAge}
                    onChange={(e) => setChildAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-prodigee-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addingChild}
                  className="px-4 py-2 rounded-lg bg-prodigee-600 text-white text-sm font-medium hover:bg-prodigee-700 disabled:opacity-50"
                >
                  {addingChild ? "Adding..." : "Add Child"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddChild(false); setError(""); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {dashboard?.children.length === 0 && !showAddChild && (
            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
              <p className="text-gray-500">No children added yet. Click &quot;Add Child&quot; to get started.</p>
            </div>
          )}

          {dashboard?.children.map((child) => (
            <div key={child.child_id} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-prodigee-100 flex items-center justify-center text-lg font-bold text-prodigee-600">
                    {child.display_name[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{child.display_name}</div>
                    <div className="text-sm text-gray-500">
                      Age {child.age} &middot; Week {child.current_week}/35
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-600">{child.total_stars} stars</div>
                  <div className="text-sm text-gray-500">{child.streak_days} day streak</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Accuracy</span>
                  <span className="font-medium">{Math.round(child.overall_accuracy)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-prodigee-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, child.overall_accuracy)}%` }}
                  />
                </div>
              </div>

              {/* Mastery distribution */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(child.mastery_distribution).map(([level, count]) => (
                  <span
                    key={level}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${MASTERY_COLORS[level] || "bg-gray-100 text-gray-500"}`}
                  >
                    {level.replace("_", " ")}: {count}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

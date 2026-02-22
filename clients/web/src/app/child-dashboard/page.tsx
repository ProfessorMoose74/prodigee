"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { learning, type DashboardData, ApiError } from "@/lib/api";

const MASTERY_COLORS: Record<string, string> = {
  advanced: "bg-green-500",
  proficient: "bg-blue-500",
  developing: "bg-yellow-500",
  emerging: "bg-orange-500",
  not_started: "bg-gray-300",
};

const MASTERY_LABELS: Record<string, string> = {
  advanced: "Advanced",
  proficient: "Proficient",
  developing: "Developing",
  emerging: "Emerging",
  not_started: "Not Started",
};

export default function ChildDashboardPage() {
  const { childToken, childUser, logoutChild, sessionLimitMinutes, isLoading } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [practicing, setPracticing] = useState<string | null>(null);
  const [practiceResult, setPracticeResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !childToken) {
      router.replace("/child-login");
      return;
    }

    if (childToken) {
      learning
        .dashboard(childToken)
        .then(setDashboard)
        .catch(() => router.replace("/child-login"))
        .finally(() => setLoadingData(false));
    }
  }, [childToken, isLoading, router]);

  async function handlePractice(skill: string) {
    if (!childToken) return;
    setPracticing(skill);
    setPracticeResult(null);

    try {
      // Simulate a practice session (in a real app this would be an interactive activity)
      const accuracy = 60 + Math.random() * 35; // 60-95%
      const result = await learning.completeActivity(childToken, skill, {
        accuracy: Math.round(accuracy),
        duration: 120 + Math.floor(Math.random() * 180),
        stars_earned: accuracy >= 80 ? 3 : accuracy >= 60 ? 2 : 1,
      });

      setPracticeResult(result.message);

      // Refresh dashboard
      const data = await learning.dashboard(childToken);
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiError) setPracticeResult(err.detail);
      else setPracticeResult("Something went wrong!");
    } finally {
      setPracticing(null);
    }
  }

  function handleEndSession() {
    logoutChild();
    router.push("/dashboard");
  }

  if (isLoading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!dashboard || !childUser) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-prodigee-50 to-white">
      {/* Child Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-prodigee-200 flex items-center justify-center text-lg font-bold text-prodigee-700">
              {childUser.display_name[0]}
            </div>
            <div>
              <div className="font-bold text-prodigee-700">{childUser.display_name}</div>
              <div className="text-xs text-gray-500">
                Week {dashboard.child.current_week}/35
                {sessionLimitMinutes && ` \u00b7 ${sessionLimitMinutes} min session`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{dashboard.child.total_stars}</div>
              <div className="text-xs text-gray-500">Stars</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">{dashboard.child.streak_days}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
            <button
              onClick={handleEndSession}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Practice Result Toast */}
        {practiceResult && (
          <div className="p-4 rounded-xl bg-prodigee-100 text-prodigee-800 font-medium text-center animate-pulse">
            {practiceResult}
          </div>
        )}

        {/* Recommendation Card */}
        <div className="bg-white rounded-xl p-5 border-2 border-prodigee-200 shadow-sm">
          <div className="text-sm font-medium text-prodigee-600 mb-1">Recommended for You</div>
          <div className="text-lg font-bold text-gray-900 mb-1">
            {dashboard.recommendation.recommended_skill.replace(/_/g, " ")}
          </div>
          <p className="text-gray-600 text-sm mb-3">{dashboard.recommendation.reason}</p>
          <button
            onClick={() => handlePractice(dashboard.recommendation.recommended_skill)}
            disabled={practicing !== null}
            className="px-5 py-2.5 rounded-lg bg-prodigee-600 text-white font-medium hover:bg-prodigee-700 disabled:opacity-50 transition-colors"
          >
            {practicing === dashboard.recommendation.recommended_skill
              ? "Practicing..."
              : "Start Practice"}
          </button>
        </div>

        {/* Active Skills Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            This Week&apos;s Skills
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dashboard.active_skills.map((skill) => {
              const progress = dashboard.progress[skill];
              const accuracy = progress?.accuracy ?? 0;
              const mastery = progress?.mastery_level ?? "not_started";

              return (
                <div
                  key={skill}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      {skill.replace(/_/g, " ")}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${MASTERY_COLORS[mastery]}`}>
                      {MASTERY_LABELS[mastery]}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${MASTERY_COLORS[mastery]}`}
                      style={{ width: `${Math.min(100, accuracy)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{Math.round(accuracy)}%</span>
                    <button
                      onClick={() => handlePractice(skill)}
                      disabled={practicing !== null}
                      className="px-3 py-1 rounded-lg bg-prodigee-100 text-prodigee-700 text-sm font-medium hover:bg-prodigee-200 disabled:opacity-50 transition-colors"
                    >
                      {practicing === skill ? "..." : "Practice"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Skills Progress */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">All Skills</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {Object.entries(dashboard.progress).map(([skill, data]) => (
              <div key={skill} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${MASTERY_COLORS[data.mastery_level]}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {skill.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{Math.round(data.accuracy)}%</span>
                  <span className="text-xs text-gray-400">{data.mastery_level.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

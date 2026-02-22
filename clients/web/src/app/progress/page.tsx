"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  analytics,
  type ChildProgress,
  type PhonemicProgress,
  type SessionsResponse,
  type AssessmentsResponse,
  ApiError,
} from "@/lib/api";

const MASTERY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  advanced: { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500" },
  proficient: { bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-500" },
  developing: { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500" },
  emerging: { bg: "bg-orange-100", text: "text-orange-700", bar: "bg-orange-500" },
  not_started: { bg: "bg-gray-100", text: "text-gray-500", bar: "bg-gray-300" },
};

type Tab = "overview" | "skills" | "sessions" | "weekly";

export default function ProgressPage() {
  const { parentToken, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("child");

  const [tab, setTab] = useState<Tab>("overview");
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [phonemic, setPhonemic] = useState<PhonemicProgress | null>(null);
  const [sessions, setSessions] = useState<SessionsResponse | null>(null);
  const [assessments, setAssessments] = useState<AssessmentsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !parentToken) {
      router.replace("/login");
      return;
    }

    if (!childId) {
      router.replace("/dashboard");
      return;
    }

    if (parentToken && childId) {
      Promise.all([
        analytics.childProgress(parentToken, childId),
        analytics.phonemicProgress(parentToken, childId),
        analytics.sessions(parentToken, childId, { limit: 10 }),
        analytics.assessments(parentToken, childId),
      ])
        .then(([prog, phon, sess, assess]) => {
          setProgress(prog);
          setPhonemic(phon);
          setSessions(sess);
          setAssessments(assess);
        })
        .catch((err) => {
          if (err instanceof ApiError) setError(err.detail);
          else setError("Failed to load progress data");
        })
        .finally(() => setLoadingData(false));
    }
  }, [parentToken, childId, isLoading, router]);

  async function loadMoreSessions() {
    if (!parentToken || !childId || !sessions) return;
    setLoadingMore(true);
    try {
      const more = await analytics.sessions(parentToken, childId, {
        limit: 10,
        offset: sessions.offset + sessions.limit,
      });
      setSessions({
        ...more,
        sessions: [...sessions.sessions, ...more.sessions],
      });
    } catch {
      // silently fail on pagination
    } finally {
      setLoadingMore(false);
    }
  }

  if (isLoading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error || "No data available"}
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "skills", label: "Skills" },
    { key: "sessions", label: "Sessions" },
    { key: "weekly", label: "Weekly" },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-400 hover:text-gray-600"
              >
                &larr;
              </button>
              <div className="w-10 h-10 rounded-full bg-prodigee-100 flex items-center justify-center text-lg font-bold text-prodigee-600">
                {progress.display_name[0]}
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{progress.display_name}</h1>
                <div className="text-sm text-gray-500">
                  Age {progress.age} &middot; Week {progress.current_week}/35
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{progress.total_stars}</div>
                <div className="text-xs text-gray-500">Stars</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-500">{progress.streak_days}</div>
                <div className="text-xs text-gray-500">Streak</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-gray-50 text-prodigee-700 border-b-2 border-prodigee-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-prodigee-600">
                  {Math.round(progress.overall_accuracy)}%
                </div>
                <div className="text-xs text-gray-500">Overall Accuracy</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {progress.sessions.total_sessions}
                </div>
                <div className="text-xs text-gray-500">Sessions</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(progress.sessions.total_minutes)} min
                </div>
                <div className="text-xs text-gray-500">Total Time</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {progress.sessions.total_stars}
                </div>
                <div className="text-xs text-gray-500">Stars Earned</div>
              </div>
            </div>

            {/* Mastery Distribution */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Mastery Distribution</h3>
              <div className="space-y-2">
                {Object.entries(progress.mastery_distribution).map(([level, count]) => {
                  const total = Object.values(progress.mastery_distribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const colors = MASTERY_COLORS[level] || MASTERY_COLORS.not_started;

                  return (
                    <div key={level} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-gray-600 capitalize">
                        {level.replace("_", " ")}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${colors.bar} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-gray-500 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strongest / Weakest */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Strongest Skill</div>
                <div className="font-semibold text-green-700 capitalize">
                  {progress.strongest_skill?.replace(/_/g, " ") || "N/A"}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Needs Work</div>
                <div className="font-semibold text-orange-700 capitalize">
                  {progress.weakest_skill?.replace(/_/g, " ") || "N/A"}
                </div>
              </div>
            </div>
          </>
        )}

        {/* SKILLS TAB */}
        {tab === "skills" && phonemic && (
          <div className="space-y-3">
            {phonemic.skills.map((sk) => {
              const colors = MASTERY_COLORS[sk.mastery_level] || MASTERY_COLORS.not_started;
              return (
                <div key={sk.skill} className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">
                        {sk.skill.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sk.attempts} attempts &middot; {sk.correct} correct
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {sk.mastery_level.replace("_", " ")}
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full ${colors.bar} transition-all`}
                      style={{ width: `${Math.min(100, sk.accuracy)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{Math.round(sk.accuracy)}% accuracy</span>
                    <span className="text-gray-400">
                      {sk.last_practiced
                        ? `Last: ${new Date(sk.last_practiced).toLocaleDateString()}`
                        : "Not practiced yet"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SESSIONS TAB */}
        {tab === "sessions" && sessions && (
          <div className="space-y-3">
            {sessions.sessions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-500">
                No sessions recorded yet.
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-500">
                  Showing {sessions.sessions.length} of {sessions.total} sessions
                </div>

                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {sessions.sessions.map((s) => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${s.completed ? "bg-green-500" : "bg-gray-300"}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {s.activity_type.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {s.completed_at
                              ? new Date(s.completed_at).toLocaleString()
                              : "In progress"}
                            {s.duration_minutes > 0 && ` \u00b7 ${Math.round(s.duration_minutes)} min`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{Math.round(s.accuracy)}%</div>
                          <div className="text-xs text-gray-400">accuracy</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-yellow-600">
                            {s.stars_earned} &#9733;
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {sessions.sessions.length < sessions.total && (
                  <div className="text-center">
                    <button
                      onClick={loadMoreSessions}
                      disabled={loadingMore}
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* WEEKLY TAB */}
        {tab === "weekly" && assessments && (
          <div className="space-y-3">
            {assessments.weekly_summaries.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-500">
                No weekly data available yet.
              </div>
            ) : (
              assessments.weekly_summaries.map((week) => (
                <div key={week.week_number} className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Week {week.week_number}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">{week.sessions_count} sessions</span>
                      <span className="text-yellow-600 font-medium">{week.total_stars} &#9733;</span>
                    </div>
                  </div>

                  {/* Average accuracy bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Average Accuracy</span>
                      <span className="font-medium">{Math.round(week.avg_accuracy)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-prodigee-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, week.avg_accuracy)}%` }}
                      />
                    </div>
                  </div>

                  {/* Per-skill scores */}
                  {Object.keys(week.skill_scores).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(week.skill_scores).map(([skill, score]) => (
                        <span
                          key={skill}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            score >= 80
                              ? "bg-green-100 text-green-700"
                              : score >= 60
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {skill.replace(/_/g, " ")}: {Math.round(score)}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

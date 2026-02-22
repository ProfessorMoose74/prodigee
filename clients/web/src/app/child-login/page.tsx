"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { analytics, type ParentDashboard } from "@/lib/api";

export default function ChildLoginPage() {
  const { parentToken, parentUser, loginChild, isLoading } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<ParentDashboard["children"]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !parentToken) {
      router.replace("/login");
      return;
    }

    if (parentToken && parentUser) {
      analytics
        .parentDashboard(parentToken, parentUser.id)
        .then((data) => setChildren(data.children))
        .catch(() => setChildren([]))
        .finally(() => setLoadingChildren(false));
    }
  }, [parentToken, parentUser, isLoading, router]);

  async function handleChildSelect(childId: string) {
    setError("");
    setLoggingIn(childId);

    try {
      await loginChild(childId);
      router.push("/child-dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start session";
      setError(message);
    } finally {
      setLoggingIn(null);
    }
  }

  if (isLoading || loadingChildren) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-prodigee-700">Who&apos;s Learning Today?</h1>
          <p className="mt-1 text-gray-600">Select a child to start their session</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {children.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No children added yet.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg bg-prodigee-600 text-white hover:bg-prodigee-700 transition-colors"
            >
              Go to Dashboard to Add a Child
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {children.map((child) => (
              <button
                key={child.child_id}
                onClick={() => handleChildSelect(child.child_id)}
                disabled={loggingIn !== null}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-prodigee-400 hover:shadow-md transition-all disabled:opacity-50 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-prodigee-100 flex items-center justify-center text-xl font-bold text-prodigee-600">
                  {child.display_name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{child.display_name}</div>
                  <div className="text-sm text-gray-500">
                    Age {child.age} &middot; Week {child.current_week} &middot; {child.total_stars} stars
                  </div>
                </div>
                {loggingIn === child.child_id && (
                  <div className="text-sm text-prodigee-600">Starting...</div>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/dashboard")}
          className="block w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Parent Dashboard
        </button>
      </div>
    </main>
  );
}

"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { parentToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && parentToken) {
      router.replace("/dashboard");
    }
  }, [parentToken, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-prodigee-700">Prodigee</h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-Powered Adaptive Learning
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-3 px-4 rounded-lg bg-prodigee-600 text-white font-medium hover:bg-prodigee-700 transition-colors text-center"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="block w-full py-3 px-4 rounded-lg border-2 border-prodigee-600 text-prodigee-600 font-medium hover:bg-prodigee-50 transition-colors text-center"
          >
            Create Account
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          COPPA-compliant educational platform for children ages 3-18
        </p>
      </div>
    </main>
  );
}

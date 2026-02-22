"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  learning,
  type ActivityDetail,
  type ActivityResult,
  type VoiceProcessResult,
  ApiError,
} from "@/lib/api";

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

const DIFFICULTY_COLORS: Record<string, string> = {
  easiest: "text-green-600",
  easy: "text-green-500",
  moderate: "text-yellow-600",
  challenging: "text-orange-500",
  difficult: "text-red-500",
  most_difficult: "text-red-700",
};

// Sample prompts per skill for voice practice
const SKILL_PROMPTS: Record<string, string[]> = {
  rhyming: ["cat, hat, bat", "dog, log, fog", "sun, fun, run", "red, bed, said"],
  onset_fluency: ["ball starts with b", "sun starts with s", "moon starts with m"],
  blending: ["c-a-t makes cat", "d-o-g makes dog", "s-u-n makes sun"],
  isolating: ["What sound does fish start with?", "What sound does ball start with?"],
  segmenting: ["Break apart the word 'map'", "Break apart the word 'sit'"],
  adding: ["Add 's' to the beginning of 'top'", "Add 'un' to 'do'"],
  deleting: ["Say 'stand' without the 's'", "Say 'plate' without the 'p'"],
  substituting: ["Change the 'c' in 'cat' to 'b'", "Change the 'm' in 'mat' to 'h'"],
};

export default function ActivityPage() {
  const { childToken, childUser, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const skill = searchParams.get("skill") || "rhyming";

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [phase, setPhase] = useState<"intro" | "practice" | "voice" | "result">("intro");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [result, setResult] = useState<ActivityResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Voice state
  const [recording, setRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceProcessResult | null>(null);
  const [listening, setListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prompts = SKILL_PROMPTS[skill] || SKILL_PROMPTS.rhyming;

  useEffect(() => {
    if (!isLoading && !childToken) {
      router.replace("/child-login");
      return;
    }

    if (childToken) {
      learning
        .getActivity(childToken, skill)
        .then(setActivity)
        .catch(() => router.replace("/child-dashboard"))
        .finally(() => setLoadingActivity(false));
    }
  }, [childToken, isLoading, router, skill]);

  // Timer management
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  function handleStartPractice() {
    setPhase("practice");
    setCurrentPromptIndex(0);
    setScores([]);
    setElapsed(0);
    startTimer();
  }

  function handleResponse(correct: boolean) {
    const score = correct ? 100 : 30 + Math.random() * 30; // 30-60 for wrong answers
    const newScores = [...scores, score];
    setScores(newScores);

    if (currentPromptIndex + 1 < prompts.length) {
      setCurrentPromptIndex(currentPromptIndex + 1);
    } else {
      // All prompts done — submit
      stopTimer();
      submitResults(newScores);
    }
  }

  function handleStartVoice() {
    setPhase("voice");
    setVoiceResult(null);
  }

  async function handleStartRecording() {
    setVoiceResult(null);
    setRecording(true);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          await processVoice(base64);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
      setRecording(false);
    }
  }

  function handleStopRecording() {
    setRecording(false);
    mediaRecorderRef.current?.stop();
  }

  async function processVoice(audioData: string) {
    if (!childToken) return;
    setListening(true);
    try {
      const res = await learning.voiceProcess(childToken, {
        audio_data: audioData,
        expected_response: prompts[currentPromptIndex],
        activity_type: "pronunciation",
      });
      setVoiceResult(res);

      const score = res.accuracy_score * 100;
      const newScores = [...scores, score];
      setScores(newScores);

      if (currentPromptIndex + 1 < prompts.length) {
        setCurrentPromptIndex(currentPromptIndex + 1);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("Voice processing failed");
    } finally {
      setListening(false);
    }
  }

  async function handleFinishVoice() {
    stopTimer();
    await submitResults(scores);
  }

  async function submitResults(finalScores: number[]) {
    if (!childToken) return;
    setSubmitting(true);
    setError("");

    const accuracy =
      finalScores.length > 0
        ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length
        : 0;
    const stars = accuracy >= 80 ? 3 : accuracy >= 60 ? 2 : 1;

    try {
      const res = await learning.completeActivity(childToken, skill, {
        accuracy: Math.round(accuracy),
        duration: elapsed,
        stars_earned: stars,
      });
      setResult(res);
      setPhase("result");
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("Failed to submit results");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePlayPrompt() {
    if (!childToken) return;
    try {
      const res = await learning.voiceSynthesize(childToken, prompts[currentPromptIndex]);
      if (res.success && res.audio_content) {
        const audio = new Audio(`data:audio/mp3;base64,${res.audio_content}`);
        audio.play();
      }
    } catch {
      // silently fail — voice synthesis is optional
    }
  }

  if (isLoading || loadingActivity) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!activity || !childUser) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-prodigee-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/child-dashboard")}
              className="text-gray-400 hover:text-gray-600"
            >
              &larr; Back
            </button>
            <div>
              <div className="font-bold text-prodigee-700">
                {skill.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className={DIFFICULTY_COLORS[activity.skill_info.difficulty]}>
                  {activity.skill_info.difficulty}
                </span>
                <span>&middot;</span>
                <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${MASTERY_COLORS[activity.mastery_level]}`}>
                  {MASTERY_LABELS[activity.mastery_level]}
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {/* INTRO PHASE */}
        {phase === "intro" && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center space-y-4">
            <div className="text-4xl">
              {skill === "rhyming" ? "🎵" : skill === "blending" ? "🔗" : skill === "segmenting" ? "✂️" : "🎯"}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {skill.replace(/_/g, " ")}
            </h2>
            <p className="text-gray-600">{activity.skill_info.description}</p>

            {/* Progress bar */}
            <div className="max-w-xs mx-auto">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Current Progress</span>
                <span className="font-medium">{Math.round(activity.child_progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${MASTERY_COLORS[activity.mastery_level]}`}
                  style={{ width: `${Math.min(100, activity.child_progress)}%` }}
                />
              </div>
            </div>

            {activity.skill_info.prerequisites.length > 0 && (
              <p className="text-xs text-gray-400">
                Builds on: {activity.skill_info.prerequisites.join(", ").replace(/_/g, " ")}
              </p>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={handleStartPractice}
                className="px-6 py-3 rounded-lg bg-prodigee-600 text-white font-medium hover:bg-prodigee-700 transition-colors"
              >
                Start Practice
              </button>
              <button
                onClick={handleStartVoice}
                className="px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
              >
                Voice Practice
              </button>
            </div>
          </div>
        )}

        {/* PRACTICE PHASE (tap-based) */}
        {phase === "practice" && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-prodigee-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentPromptIndex) / prompts.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">
                {currentPromptIndex + 1}/{prompts.length}
              </span>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center space-y-6">
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                Listen and respond
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {prompts[currentPromptIndex]}
              </div>

              <button
                onClick={handlePlayPrompt}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
              >
                🔊 Hear it
              </button>

              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={() => handleResponse(true)}
                  disabled={submitting}
                  className="px-8 py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  Got it!
                </button>
                <button
                  onClick={() => handleResponse(false)}
                  disabled={submitting}
                  className="px-8 py-3 rounded-lg bg-orange-400 text-white font-medium hover:bg-orange-500 disabled:opacity-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>

            {submitting && (
              <div className="text-center text-prodigee-600 font-medium animate-pulse">
                Saving your progress...
              </div>
            )}
          </div>
        )}

        {/* VOICE PRACTICE PHASE */}
        {phase === "voice" && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentPromptIndex) / prompts.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">
                {currentPromptIndex + 1}/{prompts.length}
              </span>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center space-y-6">
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                Say it out loud
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {prompts[currentPromptIndex]}
              </div>

              <button
                onClick={handlePlayPrompt}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
              >
                🔊 Hear it first
              </button>

              <div className="pt-4">
                {!recording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={listening}
                    className="w-20 h-20 rounded-full bg-red-500 text-white text-3xl hover:bg-red-600 disabled:opacity-50 transition-all shadow-lg"
                  >
                    🎤
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="w-20 h-20 rounded-full bg-red-600 text-white text-3xl animate-pulse shadow-lg"
                  >
                    ⏹
                  </button>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  {recording ? "Recording... tap to stop" : listening ? "Processing..." : "Tap to record"}
                </div>
              </div>

              {/* Voice result feedback */}
              {voiceResult && (
                <div className={`p-4 rounded-xl ${voiceResult.accuracy_score >= 0.7 ? "bg-green-50 text-green-800" : "bg-orange-50 text-orange-800"}`}>
                  <div className="font-medium">{voiceResult.feedback}</div>
                  <div className="text-sm mt-1">
                    You said: &quot;{voiceResult.transcript}&quot;
                    <span className="ml-2">({Math.round(voiceResult.accuracy_score * 100)}% match)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Finish voice practice */}
            {scores.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleFinishVoice}
                  disabled={submitting}
                  className="px-6 py-3 rounded-lg bg-prodigee-600 text-white font-medium hover:bg-prodigee-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving..." : `Finish (${scores.length} attempts)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && result && (
          <div className="bg-white rounded-xl p-8 border border-gray-200 text-center space-y-5">
            <div className="text-5xl">
              {result.stars_earned >= 3 ? "🌟" : result.stars_earned >= 2 ? "⭐" : "✨"}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{result.message}</h2>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{result.stars_earned}</div>
                <div className="text-xs text-gray-500">Stars</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-prodigee-600">
                  {Math.round(result.new_progress)}%
                </div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  +{result.progress_gained.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Gained</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">Mastery:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${MASTERY_COLORS[result.mastery_level]}`}>
                {MASTERY_LABELS[result.mastery_level]}
              </span>
            </div>

            {result.week_advanced && (
              <div className="p-3 rounded-lg bg-prodigee-100 text-prodigee-800 font-medium">
                You advanced to Week {result.current_week}!
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  setPhase("intro");
                  setScores([]);
                  setResult(null);
                  setElapsed(0);
                  setCurrentPromptIndex(0);
                }}
                className="px-6 py-3 rounded-lg bg-prodigee-600 text-white font-medium hover:bg-prodigee-700 transition-colors"
              >
                Practice Again
              </button>
              <button
                onClick={() => router.push("/child-dashboard")}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

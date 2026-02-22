/**
 * API client — all calls go through the Next.js rewrite proxy to the gateway.
 * In dev: localhost:3000/api/* → localhost:8080/api/*
 * In prod: same-origin /api/* → gateway
 */

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || "Request failed");
  }

  return res.json();
}

// --- Auth ---

export interface AuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user: ParentUser;
}

export interface ParentUser {
  id: string;
  email: string;
  display_name: string;
  subscription_tier: string;
  children: string[];
  created_at: string;
}

export interface ChildUser {
  id: string;
  parent_id: string;
  display_name: string;
  age: number;
  age_range: string;
  grade_level: string;
  avatar: string;
  learning_style: string;
  current_week: number;
  total_stars: number;
  streak_days: number;
  created_at: string;
}

export interface ChildAuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
  session_limit_minutes: number;
  user: ChildUser;
}

export const auth = {
  register(email: string, password: string, displayName: string) {
    return request<AuthResponse>("/auth/parent/register", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>("/auth/parent/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  addChild(
    token: string,
    data: { display_name: string; age: number; grade_level?: string; avatar?: string },
  ) {
    return request<ChildUser>("/auth/parent/add_child", {
      method: "POST",
      body: JSON.stringify(data),
    }, token);
  },

  childLogin(parentToken: string, childId: string) {
    return request<ChildAuthResponse>("/auth/child/login", {
      method: "POST",
      body: JSON.stringify({ parent_token: parentToken, child_id: childId }),
    });
  },

  logout(token: string) {
    return request<{ message: string }>("/auth/logout", {
      method: "POST",
    }, token);
  },
};

// --- Learning Engine ---

export interface DashboardData {
  child: {
    id: string;
    display_name: string;
    age: number;
    current_week: number;
    total_stars: number;
    streak_days: number;
    avatar: string;
  };
  week_activities: Record<string, unknown>;
  nursery_rhyme: Record<string, unknown>;
  progress: Record<string, { accuracy: number; mastery_level: string }>;
  recommendation: {
    recommended_skill: string;
    reason: string;
    difficulty_level: string;
    confidence: number;
  };
  active_skills: string[];
}

export interface CurriculumWeek {
  week_number: number;
  active_skills: string[];
  week_activities: Record<string, unknown>;
  nursery_rhyme: Record<string, unknown>;
  daily_structure: Record<string, unknown>;
}

export interface ActivityDetail {
  skill_name: string;
  skill_info: {
    weeks: number[];
    difficulty: string;
    description: string;
    prerequisites: string[];
  };
  week_number: number;
  activities: Record<string, unknown>;
  child_progress: number;
  mastery_level: string;
}

export interface ActivityResult {
  message: string;
  progress_gained: number;
  new_progress: number;
  mastery_level: string;
  stars_earned: number;
  current_week: number;
  week_advanced: boolean;
}

export interface VoiceProcessResult {
  success: boolean;
  transcript: string;
  confidence: number;
  accuracy_score: number;
  feedback: string;
  source: string;
}

export interface VoiceSynthResult {
  success: boolean;
  audio_content: string;
  duration_estimate: number;
  message: string;
  source: string;
}

export const learning = {
  dashboard(token: string) {
    return request<DashboardData>("/learning/child/dashboard", {}, token);
  },

  curriculumWeek(weekNumber: number) {
    return request<CurriculumWeek>(`/learning/curriculum/week/${weekNumber}`);
  },

  getActivity(token: string, activityType: string) {
    return request<ActivityDetail>(`/learning/child/activity/${activityType}`, {}, token);
  },

  completeActivity(
    token: string,
    activityType: string,
    data: { accuracy: number; duration: number; stars_earned: number },
  ) {
    return request<ActivityResult>(`/learning/child/activity/${activityType}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    }, token);
  },

  voiceProcess(token: string, data: {
    audio_data: string;
    expected_response: string;
    activity_type?: string;
  }) {
    return request<VoiceProcessResult>("/learning/voice/process", {
      method: "POST",
      body: JSON.stringify(data),
    }, token);
  },

  voiceSynthesize(token: string, text: string) {
    return request<VoiceSynthResult>("/learning/voice/synthesize", {
      method: "POST",
      body: JSON.stringify({ text, speaking_rate: 0.85 }),
    }, token);
  },
};

// --- Analytics ---

export interface ChildProgress {
  child_id: string;
  display_name: string;
  age: number;
  current_week: number;
  total_stars: number;
  streak_days: number;
  overall_accuracy: number;
  mastery_distribution: Record<string, number>;
  strongest_skill: string | null;
  weakest_skill: string | null;
  skills: Array<{
    skill: string;
    accuracy: number;
    mastery_level: string;
    attempts: number;
    correct: number;
  }>;
  sessions: {
    total_sessions: number;
    completed_sessions: number;
    avg_accuracy: number;
    total_stars: number;
    total_minutes: number;
  };
}

export interface ParentDashboard {
  parent_id: string;
  display_name: string;
  total_children: number;
  children: Array<{
    child_id: string;
    display_name: string;
    age: number;
    current_week: number;
    total_stars: number;
    streak_days: number;
    overall_accuracy: number;
    mastery_distribution: Record<string, number>;
    recent_activity: string | null;
  }>;
}

export interface PhonemicProgress {
  child_id: string;
  skills: Array<{
    skill: string;
    accuracy: number;
    mastery_level: string;
    attempts: number;
    correct: number;
    last_practiced: string | null;
  }>;
  overall_accuracy: number;
  mastery_distribution: Record<string, number>;
}

export interface SessionRecord {
  id: string;
  session_type: string;
  activity_type: string;
  accuracy: number;
  stars_earned: number;
  engagement_score: number;
  duration_minutes: number;
  completed: boolean;
  completed_at: string | null;
}

export interface SessionsResponse {
  child_id: string;
  total: number;
  limit: number;
  offset: number;
  sessions: SessionRecord[];
}

export interface WeeklySummary {
  week_number: number;
  sessions_count: number;
  avg_accuracy: number;
  skills_practiced: string[];
  skill_scores: Record<string, number>;
  total_stars: number;
}

export interface AssessmentsResponse {
  child_id: string;
  weekly_summaries: WeeklySummary[];
}

export const analytics = {
  childProgress(token: string, childId: string) {
    return request<ChildProgress>(`/analytics/child/${childId}/progress`, {}, token);
  },

  phonemicProgress(token: string, childId: string) {
    return request<PhonemicProgress>(`/analytics/child/${childId}/phonemic-progress`, {}, token);
  },

  sessions(token: string, childId: string, params?: { limit?: number; offset?: number; activity_type?: string }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.activity_type) query.set("activity_type", params.activity_type);
    const qs = query.toString();
    return request<SessionsResponse>(`/analytics/child/${childId}/sessions${qs ? `?${qs}` : ""}`, {}, token);
  },

  assessments(token: string, childId: string) {
    return request<AssessmentsResponse>(`/analytics/child/${childId}/assessments`, {}, token);
  },

  parentDashboard(token: string, parentId: string) {
    return request<ParentDashboard>(`/analytics/parent/${parentId}/dashboard`, {}, token);
  },
};

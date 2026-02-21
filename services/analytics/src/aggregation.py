"""
Pure aggregation functions — compute stats from raw Firestore data.
No database or API calls. Stateless.
"""

ALL_SKILLS = [
    "rhyming", "onset_fluency", "blending", "isolating",
    "segmenting", "adding", "deleting", "substituting",
]


def compute_overall_progress(progress_docs: list[dict]) -> dict:
    """Compute overall stats from phonemic_progress documents.

    Returns:
        overall_accuracy, mastery_distribution, strongest_skill, weakest_skill, skills_list
    """
    if not progress_docs:
        return {
            "overall_accuracy": 0.0,
            "mastery_distribution": {"not_started": 8},
            "strongest_skill": None,
            "weakest_skill": None,
            "skills": [],
        }

    total_accuracy = 0.0
    mastery_counts = {}
    best_skill = None
    best_acc = -1.0
    worst_skill = None
    worst_acc = 101.0

    skills = []
    seen_skills = set()

    for doc in progress_docs:
        skill = doc.get("skill", "")
        accuracy = doc.get("accuracy", 0.0)
        mastery = doc.get("mastery_level", "not_started")

        seen_skills.add(skill)
        total_accuracy += accuracy
        mastery_counts[mastery] = mastery_counts.get(mastery, 0) + 1

        if accuracy > best_acc:
            best_acc = accuracy
            best_skill = skill
        if accuracy < worst_acc:
            worst_acc = accuracy
            worst_skill = skill

        skills.append({
            "skill": skill,
            "accuracy": accuracy,
            "mastery_level": mastery,
            "attempts": doc.get("attempts", 0),
            "correct": doc.get("correct", 0),
            "last_practiced": doc.get("last_practiced"),
        })

    # Add not_started entries for skills with no progress
    for skill in ALL_SKILLS:
        if skill not in seen_skills:
            mastery_counts["not_started"] = mastery_counts.get("not_started", 0) + 1
            skills.append({
                "skill": skill,
                "accuracy": 0.0,
                "mastery_level": "not_started",
                "attempts": 0,
                "correct": 0,
                "last_practiced": None,
            })

    overall_accuracy = round(total_accuracy / len(progress_docs), 1) if progress_docs else 0.0

    return {
        "overall_accuracy": overall_accuracy,
        "mastery_distribution": mastery_counts,
        "strongest_skill": best_skill,
        "weakest_skill": worst_skill,
        "skills": skills,
    }


def compute_session_stats(session_docs: list[dict]) -> dict:
    """Compute aggregate session statistics.

    Returns:
        total_sessions, completed_sessions, avg_accuracy, avg_engagement,
        total_stars, total_minutes
    """
    if not session_docs:
        return {
            "total_sessions": 0,
            "completed_sessions": 0,
            "avg_accuracy": 0.0,
            "avg_engagement": 0.0,
            "total_stars": 0,
            "total_minutes": 0.0,
        }

    total = len(session_docs)
    completed = sum(1 for s in session_docs if s.get("completed", False))
    total_accuracy = sum(s.get("accuracy", 0.0) for s in session_docs)
    total_engagement = sum(s.get("engagement_score", 0.0) for s in session_docs)
    total_stars = sum(s.get("stars_earned", 0) for s in session_docs)
    total_minutes = sum(s.get("actual_duration_minutes", 0.0) for s in session_docs)

    return {
        "total_sessions": total,
        "completed_sessions": completed,
        "avg_accuracy": round(total_accuracy / total, 1),
        "avg_engagement": round(total_engagement / total, 1),
        "total_stars": total_stars,
        "total_minutes": round(total_minutes, 1),
    }


def compute_weekly_summary(session_docs: list[dict]) -> list[dict]:
    """Group sessions by week and compute per-week assessment-style summaries."""
    weeks = {}

    for session in session_docs:
        completed_at = session.get("completed_at")
        if completed_at and hasattr(completed_at, "isocalendar"):
            week_key = completed_at.isocalendar()[1]
        else:
            continue

        if week_key not in weeks:
            weeks[week_key] = {
                "week_number": week_key,
                "sessions": [],
                "skills_set": set(),
                "skill_scores": {},
            }

        w = weeks[week_key]
        w["sessions"].append(session)

        activity = session.get("activity_type", "")
        if activity:
            w["skills_set"].add(activity)
            if activity not in w["skill_scores"]:
                w["skill_scores"][activity] = []
            w["skill_scores"][activity].append(session.get("accuracy", 0.0))

    summaries = []
    for week_key in sorted(weeks.keys()):
        w = weeks[week_key]
        sessions = w["sessions"]
        avg_accuracy = sum(s.get("accuracy", 0.0) for s in sessions) / len(sessions)
        total_stars = sum(s.get("stars_earned", 0) for s in sessions)

        # Average per-skill scores
        skill_avgs = {}
        for skill, scores in w["skill_scores"].items():
            skill_avgs[skill] = round(sum(scores) / len(scores), 1)

        summaries.append({
            "week_number": w["week_number"],
            "sessions_count": len(sessions),
            "avg_accuracy": round(avg_accuracy, 1),
            "skills_practiced": sorted(w["skills_set"]),
            "skill_scores": skill_avgs,
            "total_stars": total_stars,
        })

    return summaries


def compute_skill_trend(session_docs: list[dict], skill: str, limit: int = 10) -> list[dict]:
    """Get accuracy trend for a specific skill over the last N sessions."""
    skill_sessions = [
        s for s in session_docs
        if s.get("activity_type") == skill
    ]
    # Sort by completed_at descending, take last N
    skill_sessions.sort(key=lambda s: s.get("completed_at") or "", reverse=True)
    recent = skill_sessions[:limit]
    recent.reverse()  # chronological order

    return [
        {
            "accuracy": s.get("accuracy", 0.0),
            "completed_at": s.get("completed_at"),
        }
        for s in recent
    ]


def compute_voice_stats(voice_docs: list[dict]) -> dict:
    """Compute voice interaction statistics.

    Returns:
        total_interactions, avg_accuracy, success_rate
    """
    if not voice_docs:
        return {
            "total_interactions": 0,
            "avg_accuracy": 0.0,
            "success_rate": 0.0,
        }

    total = len(voice_docs)
    total_accuracy = sum(v.get("accuracy_score", 0.0) for v in voice_docs)
    successes = sum(1 for v in voice_docs if v.get("success_achieved", False))

    return {
        "total_interactions": total,
        "avg_accuracy": round(total_accuracy / total, 2),
        "success_rate": round(successes / total, 2),
    }

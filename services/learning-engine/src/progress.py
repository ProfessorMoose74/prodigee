"""
Progress update algorithms, mastery levels, and recommendation scoring.
Pure functions — no database or API calls.
"""

from src.curriculum import SKILL_PROGRESSION, assess_readiness, get_skills_for_week


def calculate_progress_update(
    accuracy: float,
    duration: int,
    current_progress: float,
) -> float:
    """Calculate progress gain from a single activity completion.

    Formula from legacy code:
    - base = accuracy / 10
    - progress_multiplier: 1.5x (<30%), 1.0x (30-70%), 0.7x (>70%)
    - time_factor: 0.8x (too fast <75s), 1.1x (optimal 75-600s), 0.9x (slow >600s)
    - Capped at 10.0 per session
    """
    base_progress = accuracy / 10.0

    if current_progress < 30:
        progress_multiplier = 1.5
    elif current_progress < 70:
        progress_multiplier = 1.0
    else:
        progress_multiplier = 0.7

    if duration < 75:
        time_factor = 0.8
    elif duration > 600:
        time_factor = 0.9
    else:
        time_factor = 1.1

    return min(10.0, round(base_progress * progress_multiplier * time_factor, 2))


def determine_mastery_level(progress: float) -> str:
    """Map numeric progress (0-100) to mastery level string."""
    if progress >= 90:
        return "advanced"
    elif progress >= 70:
        return "proficient"
    elif progress >= 50:
        return "developing"
    elif progress >= 30:
        return "emerging"
    else:
        return "not_started"


DIFFICULTY_SCORE_MAP = {
    "easiest": 1.0,
    "easy": 0.9,
    "moderate": 0.8,
    "challenging": 0.7,
    "difficult": 0.6,
    "most_difficult": 0.5,
}


def score_skill_recommendation(
    skill: str,
    current_progress: float,
    readiness_score: float,
    learning_velocity: float = 1.0,
) -> float:
    """Score a skill for recommendation priority.

    Score = readiness(0.4) + need(0.3) + difficulty(0.2) + velocity(0.1)
    """
    skill_info = SKILL_PROGRESSION.get(skill, {})
    difficulty = skill_info.get("difficulty", "moderate")

    readiness_component = readiness_score * 0.4
    need_component = (100.0 - current_progress) / 100.0 * 0.3
    difficulty_component = DIFFICULTY_SCORE_MAP.get(difficulty, 0.8) * 0.2
    velocity_component = min(learning_velocity, 2.0) / 2.0 * 0.1

    return round(readiness_component + need_component + difficulty_component + velocity_component, 3)


def generate_rule_based_recommendation(
    child_progress: dict[str, float],
    current_week: int,
    learning_velocity: float = 1.0,
) -> dict:
    """Generate a skill recommendation without AI.

    Scores all active skills for the current week and returns the highest-scoring one.
    """
    active_skills = get_skills_for_week(current_week)
    if not active_skills:
        # Fallback to any skill with progress < 100
        active_skills = [
            s for s, p in child_progress.items() if p < 100.0
        ] or list(SKILL_PROGRESSION.keys())[:1]

    best_skill = None
    best_score = -1.0
    best_readiness = 0.0

    for skill in active_skills:
        progress = child_progress.get(skill, 0.0)
        if progress >= 100.0:
            continue

        readiness = assess_readiness(child_progress, skill)
        score = score_skill_recommendation(
            skill, progress, readiness["readiness_score"], learning_velocity,
        )

        if score > best_score:
            best_score = score
            best_skill = skill
            best_readiness = readiness["readiness_score"]

    if not best_skill:
        best_skill = active_skills[0] if active_skills else "rhyming"
        best_readiness = 1.0

    skill_info = SKILL_PROGRESSION.get(best_skill, {})
    progress = child_progress.get(best_skill, 0.0)

    # Generate motivational reason
    if progress < 10:
        reason = f"Time to start a new adventure with {best_skill.replace('_', ' ')}!"
    elif progress < 50:
        reason = f"You're making great progress with {best_skill.replace('_', ' ')}! Keep going!"
    elif progress < 80:
        reason = f"You're almost a {best_skill.replace('_', ' ')} expert! Let's practice more!"
    else:
        reason = f"Amazing work on {best_skill.replace('_', ' ')}! Let's reach mastery!"

    # Determine difficulty level based on progress
    if progress < 30:
        difficulty_level = "easy"
    elif progress < 70:
        difficulty_level = "medium"
    else:
        difficulty_level = "hard"

    return {
        "recommended_skill": best_skill,
        "reason": reason,
        "difficulty_level": difficulty_level,
        "readiness_score": best_readiness,
        "confidence": 0.7,
        "source": "rule_based",
    }


def should_advance_week(
    current_week: int,
    skill_progress: dict[str, float],
) -> bool:
    """Check if child should advance to the next week.

    Threshold varies by skill difficulty:
    - easiest/easy: 60% required
    - moderate: 50% required
    - challenging+: 40% required
    """
    if current_week >= 35:
        return False

    active_skills = get_skills_for_week(current_week)
    if not active_skills:
        return True

    thresholds = {
        "easiest": 60.0, "easy": 60.0,
        "moderate": 50.0, "challenging": 40.0,
        "difficult": 40.0, "most_difficult": 40.0,
    }

    for skill in active_skills:
        progress = skill_progress.get(skill, 0.0)
        difficulty = SKILL_PROGRESSION.get(skill, {}).get("difficulty", "moderate")
        threshold = thresholds.get(difficulty, 50.0)
        if progress < threshold:
            return False

    return True


def generate_pronunciation_feedback(accuracy_score: float) -> str:
    """Return encouraging feedback based on pronunciation accuracy (0-1 scale)."""
    if accuracy_score >= 0.95:
        return "Perfect! You said it exactly right!"
    elif accuracy_score >= 0.85:
        return "Great job! That sounded really good!"
    elif accuracy_score >= 0.70:
        return "Good try! You're getting closer!"
    elif accuracy_score >= 0.50:
        return "Nice effort! Let's try that one more time."
    else:
        return "Keep practicing! Listen carefully and try again."

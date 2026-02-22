"""
Curriculum data loader and skill progression logic.
Pure functions — no database or API calls.
"""

import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent / "curriculum_data"


def _load_json(filename: str) -> dict:
    with open(_DATA_DIR / filename) as f:
        return json.load(f)


HEGGERTY_DATA = _load_json("heggerty_scope_sequence.json")
STEM_DATA = _load_json("stem_curriculum.json")
CHARACTER_DATA = _load_json("character_values_curriculum.json")

# Canonical skill progression — 8 Heggerty skills with week ranges and prerequisites
SKILL_PROGRESSION = {
    "rhyming": {
        "weeks": list(range(1, 9)),
        "difficulty": "easiest",
        "description": "Listen to and produce rhyming words",
        "prerequisites": [],
    },
    "onset_fluency": {
        "weeks": list(range(3, 13)),
        "difficulty": "easy",
        "description": "Identify and produce beginning sounds",
        "prerequisites": ["rhyming"],
    },
    "blending": {
        "weeks": list(range(5, 21)),
        "difficulty": "moderate",
        "description": "Combine individual sounds into words",
        "prerequisites": ["rhyming", "onset_fluency"],
    },
    "isolating": {
        "weeks": list(range(8, 26)),
        "difficulty": "moderate",
        "description": "Identify final and medial sounds in words",
        "prerequisites": ["rhyming", "onset_fluency"],
    },
    "segmenting": {
        "weeks": list(range(12, 31)),
        "difficulty": "challenging",
        "description": "Break words into individual phonemes",
        "prerequisites": ["rhyming", "onset_fluency", "blending"],
    },
    "adding": {
        "weeks": list(range(18, 33)),
        "difficulty": "difficult",
        "description": "Add phonemes to create new words",
        "prerequisites": ["rhyming", "onset_fluency", "blending", "segmenting"],
    },
    "deleting": {
        "weeks": list(range(22, 35)),
        "difficulty": "difficult",
        "description": "Remove phonemes from words",
        "prerequisites": ["rhyming", "onset_fluency", "blending", "segmenting", "adding"],
    },
    "substituting": {
        "weeks": list(range(26, 36)),
        "difficulty": "most_difficult",
        "description": "Replace sounds to make new words",
        "prerequisites": [
            "rhyming", "onset_fluency", "blending", "isolating",
            "segmenting", "adding", "deleting",
        ],
    },
}


def get_skills_for_week(week_number: int) -> list[str]:
    """Return all skills active for a given week number."""
    return [
        skill for skill, info in SKILL_PROGRESSION.items()
        if week_number in info["weeks"]
    ]


def get_week_data(week_number: int) -> list[dict]:
    """Look up week entries from Heggerty JSON (may have multiple age groups)."""
    return [
        week for week in HEGGERTY_DATA.get("weeks", [])
        if week.get("week_number") == week_number
    ]


def get_skill_activities(skill_name: str, week_number: int) -> dict:
    """Get activity info for a skill at a given week."""
    skill_info = SKILL_PROGRESSION.get(skill_name)
    if not skill_info:
        return {}

    weeks = get_week_data(week_number)
    activities = {}
    for week in weeks:
        age_group = week.get("age_group", "unknown")
        activities[age_group] = {
            "skill_focus": week.get("skill_focus", ""),
            "daily_activities": week.get("daily_activities", {}),
            "assessment_checkpoints": week.get("assessment_checkpoints", {}),
            "hand_motions": week.get("hand_motions", {}),
            "ai_practice_generators": week.get("ai_practice_generators", {}),
        }

    return {
        "skill": skill_name,
        "difficulty": skill_info["difficulty"],
        "description": skill_info["description"],
        "week_number": week_number,
        "by_age_group": activities,
    }


def get_nursery_rhyme(week_number: int) -> dict:
    """Return nursery rhyme metadata for a week from Heggerty data."""
    rhymes = HEGGERTY_DATA.get("nursery_rhymes", [])
    for rhyme in rhymes:
        if rhyme.get("week_number") == week_number:
            return rhyme

    # Fallback: check week entries for rhyme info
    weeks = get_week_data(week_number)
    if weeks:
        return weeks[0].get("nursery_rhyme", {"week_number": week_number, "title": "TBD"})

    return {"week_number": week_number, "title": "TBD"}


def get_daily_structure() -> dict:
    """Return the standard daily lesson structure."""
    return HEGGERTY_DATA.get("daily_structure", {
        "duration_minutes": 8,
        "components": [
            {"name": "Warm-up", "duration": 1},
            {"name": "Skill Introduction", "duration": 3},
            {"name": "Guided Practice", "duration": 3},
            {"name": "Assessment", "duration": 1},
        ],
    })


def get_subjects(age_range: str | None = None) -> list[dict]:
    """Return available subjects, optionally filtered by age range."""
    subjects = [
        {
            "subject_id": "phonemic",
            "name": "Phonemic Awareness",
            "description": "Heggerty 35-week phonemic awareness curriculum with 8 progressive skills",
            "age_ranges": ["3-5", "6-8", "9-10"],
        },
        {
            "subject_id": "stem",
            "name": "STEM Integration",
            "description": "Hands-on science, technology, engineering, and math projects",
            "age_ranges": STEM_DATA.get("age_groups", ["3-5", "6-8", "9-10"]),
        },
        {
            "subject_id": "character",
            "name": "Character Development",
            "description": "Biblical principles and American civic virtues — 12 monthly traits",
            "age_ranges": list(CHARACTER_DATA.get("age_progressions", {}).keys()),
        },
    ]

    if age_range:
        subjects = [s for s in subjects if age_range in s["age_ranges"]]

    return subjects


def get_content_list(
    subject: str | None = None,
    age_range: str | None = None,
    content_type: str | None = None,
    difficulty: str | None = None,
) -> list[dict]:
    """Aggregate content from all curriculum sources with filtering."""
    items = []

    # Phonemic skills as content
    if not subject or subject == "phonemic":
        for skill_name, skill_info in SKILL_PROGRESSION.items():
            item = {
                "content_id": f"phonemic_{skill_name}",
                "subject": "phonemic",
                "name": skill_name.replace("_", " ").title(),
                "description": skill_info["description"],
                "difficulty": skill_info["difficulty"],
                "content_type": "skill_progression",
                "age_ranges": ["3-5", "6-8", "9-10"],
                "weeks": skill_info["weeks"],
            }
            if difficulty and item["difficulty"] != difficulty:
                continue
            if age_range and age_range not in item["age_ranges"]:
                continue
            if content_type and item["content_type"] != content_type:
                continue
            items.append(item)

    # STEM projects
    if not subject or subject == "stem":
        for project in STEM_DATA.get("projects", []):
            item = {
                "content_id": project.get("project_id", ""),
                "subject": "stem",
                "name": project.get("project_name", ""),
                "description": ", ".join(project.get("science_concepts", [])[:2]),
                "difficulty": "moderate",
                "content_type": "project",
                "age_ranges": project.get("age_appropriate_for", []),
            }
            if age_range and age_range not in item["age_ranges"]:
                continue
            if content_type and item["content_type"] != content_type:
                continue
            items.append(item)

    # Character traits
    if not subject or subject == "character":
        for trait in CHARACTER_DATA.get("character_traits", []):
            trait_ages = list(trait.get("age_appropriate_activities", {}).keys())
            item = {
                "content_id": trait.get("trait_id", ""),
                "subject": "character",
                "name": trait.get("character_trait", ""),
                "description": trait.get("biblical_foundation", "")[:100],
                "difficulty": "moderate",
                "content_type": "character_trait",
                "age_ranges": trait_ages,
            }
            if age_range and age_range not in item["age_ranges"]:
                continue
            if content_type and item["content_type"] != content_type:
                continue
            items.append(item)

    return items


def assess_readiness(progress_data: dict[str, float], target_skill: str) -> dict:
    """Check if child is ready for a skill based on prerequisite mastery (70% threshold)."""
    skill_info = SKILL_PROGRESSION.get(target_skill)
    if not skill_info:
        return {"ready": False, "readiness_score": 0.0, "missing_prerequisites": []}

    prerequisites = skill_info["prerequisites"]
    if not prerequisites:
        return {"ready": True, "readiness_score": 1.0, "missing_prerequisites": []}

    missing = []
    total_score = 0.0

    for prereq in prerequisites:
        prereq_progress = progress_data.get(prereq, 0.0)
        if prereq_progress < 70.0:
            missing.append(prereq)
        total_score += min(prereq_progress / 70.0, 1.0)

    readiness_score = total_score / len(prerequisites) if prerequisites else 1.0

    return {
        "ready": len(missing) == 0,
        "readiness_score": round(readiness_score, 2),
        "missing_prerequisites": missing,
    }

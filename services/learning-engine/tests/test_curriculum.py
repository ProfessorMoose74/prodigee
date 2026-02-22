"""
Tests for curriculum.py — pure functions, no mocking needed.
"""

import pytest

from src.curriculum import (
    HEGGERTY_DATA,
    SKILL_PROGRESSION,
    STEM_DATA,
    CHARACTER_DATA,
    assess_readiness,
    get_content_list,
    get_daily_structure,
    get_nursery_rhyme,
    get_skill_activities,
    get_skills_for_week,
    get_subjects,
    get_week_data,
)


class TestCurriculumDataLoading:
    def test_heggerty_data_loaded(self):
        assert isinstance(HEGGERTY_DATA, dict)
        assert len(HEGGERTY_DATA) > 0

    def test_stem_data_loaded(self):
        assert isinstance(STEM_DATA, dict)

    def test_character_data_loaded(self):
        assert isinstance(CHARACTER_DATA, dict)

    def test_skill_progression_has_8_skills(self):
        assert len(SKILL_PROGRESSION) == 8
        expected = {
            "rhyming", "onset_fluency", "blending", "isolating",
            "segmenting", "adding", "deleting", "substituting",
        }
        assert set(SKILL_PROGRESSION.keys()) == expected


class TestGetSkillsForWeek:
    def test_week_1_only_rhyming(self):
        skills = get_skills_for_week(1)
        assert skills == ["rhyming"]

    def test_week_5_includes_blending(self):
        skills = get_skills_for_week(5)
        assert "rhyming" in skills
        assert "onset_fluency" in skills
        assert "blending" in skills

    def test_week_35_includes_substituting(self):
        skills = get_skills_for_week(35)
        assert "substituting" in skills

    def test_week_0_empty(self):
        skills = get_skills_for_week(0)
        assert skills == []

    def test_week_36_empty(self):
        skills = get_skills_for_week(36)
        assert skills == []

    def test_skills_increase_over_weeks(self):
        week1 = get_skills_for_week(1)
        week10 = get_skills_for_week(10)
        week25 = get_skills_for_week(25)
        assert len(week1) <= len(week10) <= len(week25)


class TestGetWeekData:
    def test_valid_week_returns_list(self):
        result = get_week_data(1)
        assert isinstance(result, list)

    def test_invalid_week_returns_empty(self):
        result = get_week_data(999)
        assert result == []


class TestGetSkillActivities:
    def test_valid_skill_and_week(self):
        result = get_skill_activities("rhyming", 1)
        assert result["skill"] == "rhyming"
        assert result["difficulty"] == "easiest"
        assert "week_number" in result

    def test_invalid_skill(self):
        result = get_skill_activities("nonexistent_skill", 1)
        assert result == {}


class TestGetNurseryRhyme:
    def test_returns_dict(self):
        result = get_nursery_rhyme(1)
        assert isinstance(result, dict)
        assert "week_number" in result or "title" in result

    def test_invalid_week_returns_fallback(self):
        result = get_nursery_rhyme(999)
        assert result["title"] == "TBD"


class TestGetDailyStructure:
    def test_returns_dict(self):
        result = get_daily_structure()
        assert isinstance(result, dict)


class TestGetSubjects:
    def test_returns_three_subjects(self):
        subjects = get_subjects()
        assert len(subjects) == 3
        ids = [s["subject_id"] for s in subjects]
        assert "phonemic" in ids
        assert "stem" in ids
        assert "character" in ids

    def test_filter_by_age_range(self):
        subjects = get_subjects(age_range="3-5")
        assert len(subjects) >= 1
        for s in subjects:
            assert "3-5" in s["age_ranges"]


class TestGetContentList:
    def test_unfiltered_returns_items(self):
        items = get_content_list()
        assert len(items) > 0

    def test_filter_by_subject_phonemic(self):
        items = get_content_list(subject="phonemic")
        assert all(item["subject"] == "phonemic" for item in items)
        assert len(items) == 8  # 8 phonemic skills

    def test_filter_by_difficulty(self):
        items = get_content_list(subject="phonemic", difficulty="easiest")
        assert len(items) == 1
        assert items[0]["name"] == "Rhyming"


class TestAssessReadiness:
    def test_no_prerequisites_always_ready(self):
        result = assess_readiness({}, "rhyming")
        assert result["ready"] is True
        assert result["readiness_score"] == 1.0

    def test_prerequisites_met(self):
        progress = {"rhyming": 80.0}
        result = assess_readiness(progress, "onset_fluency")
        assert result["ready"] is True
        assert result["readiness_score"] == 1.0

    def test_prerequisites_not_met(self):
        progress = {"rhyming": 50.0}
        result = assess_readiness(progress, "onset_fluency")
        assert result["ready"] is False
        assert "rhyming" in result["missing_prerequisites"]

    def test_partial_prerequisites(self):
        progress = {"rhyming": 80.0, "onset_fluency": 40.0}
        result = assess_readiness(progress, "blending")
        assert result["ready"] is False
        assert "onset_fluency" in result["missing_prerequisites"]
        assert result["readiness_score"] > 0.0

    def test_unknown_skill(self):
        result = assess_readiness({}, "fake_skill")
        assert result["ready"] is False

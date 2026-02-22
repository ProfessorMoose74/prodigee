"""
Tests for aggregation.py — pure functions, no mocking needed.
"""

from datetime import datetime, timezone

import pytest

from src.aggregation import (
    ALL_SKILLS,
    compute_overall_progress,
    compute_session_stats,
    compute_skill_trend,
    compute_voice_stats,
    compute_weekly_summary,
)


class TestComputeOverallProgress:
    def test_empty_list(self):
        result = compute_overall_progress([])
        assert result["overall_accuracy"] == 0.0
        assert result["mastery_distribution"] == {"not_started": 8}
        assert result["strongest_skill"] is None
        assert result["weakest_skill"] is None
        assert result["skills"] == []

    def test_single_skill(self):
        docs = [{"skill": "rhyming", "accuracy": 75.0, "mastery_level": "proficient", "attempts": 10, "correct": 8}]
        result = compute_overall_progress(docs)
        assert result["overall_accuracy"] == 75.0
        assert result["strongest_skill"] == "rhyming"
        assert result["weakest_skill"] == "rhyming"
        assert len(result["skills"]) == 8  # 1 with data + 7 not_started

    def test_multiple_skills(self):
        docs = [
            {"skill": "rhyming", "accuracy": 90.0, "mastery_level": "advanced", "attempts": 20, "correct": 18},
            {"skill": "blending", "accuracy": 40.0, "mastery_level": "emerging", "attempts": 5, "correct": 2},
        ]
        result = compute_overall_progress(docs)
        assert result["overall_accuracy"] == 65.0  # (90+40)/2
        assert result["strongest_skill"] == "rhyming"
        assert result["weakest_skill"] == "blending"

    def test_fills_missing_skills_as_not_started(self):
        docs = [{"skill": "rhyming", "accuracy": 50.0, "mastery_level": "developing"}]
        result = compute_overall_progress(docs)
        skills = {s["skill"] for s in result["skills"]}
        assert skills == set(ALL_SKILLS)


class TestComputeSessionStats:
    def test_empty_list(self):
        result = compute_session_stats([])
        assert result["total_sessions"] == 0
        assert result["avg_accuracy"] == 0.0
        assert result["total_stars"] == 0

    def test_single_session(self):
        docs = [{
            "completed": True,
            "accuracy": 80.0,
            "engagement_score": 9.0,
            "stars_earned": 3,
            "actual_duration_minutes": 5.5,
        }]
        result = compute_session_stats(docs)
        assert result["total_sessions"] == 1
        assert result["completed_sessions"] == 1
        assert result["avg_accuracy"] == 80.0
        assert result["total_stars"] == 3

    def test_mixed_completion(self):
        docs = [
            {"completed": True, "accuracy": 90.0, "engagement_score": 8.0, "stars_earned": 4, "actual_duration_minutes": 6.0},
            {"completed": False, "accuracy": 30.0, "engagement_score": 5.0, "stars_earned": 0, "actual_duration_minutes": 2.0},
        ]
        result = compute_session_stats(docs)
        assert result["total_sessions"] == 2
        assert result["completed_sessions"] == 1
        assert result["total_stars"] == 4
        assert result["total_minutes"] == 8.0


class TestComputeWeeklySummary:
    def test_empty_list(self):
        result = compute_weekly_summary([])
        assert result == []

    def test_groups_by_week(self):
        docs = [
            {
                "completed_at": datetime(2026, 2, 3, tzinfo=timezone.utc),  # week 6
                "activity_type": "rhyming",
                "accuracy": 80.0,
                "stars_earned": 3,
            },
            {
                "completed_at": datetime(2026, 2, 4, tzinfo=timezone.utc),  # same week
                "activity_type": "blending",
                "accuracy": 70.0,
                "stars_earned": 2,
            },
        ]
        result = compute_weekly_summary(docs)
        assert len(result) == 1
        assert result[0]["sessions_count"] == 2
        assert result[0]["avg_accuracy"] == 75.0
        assert result[0]["total_stars"] == 5
        assert set(result[0]["skills_practiced"]) == {"blending", "rhyming"}

    def test_skips_sessions_without_date(self):
        docs = [
            {"completed_at": None, "activity_type": "rhyming", "accuracy": 80.0},
            {"activity_type": "rhyming", "accuracy": 80.0},  # no completed_at at all
        ]
        result = compute_weekly_summary(docs)
        assert result == []


class TestComputeSkillTrend:
    def test_empty_list(self):
        result = compute_skill_trend([], "rhyming")
        assert result == []

    def test_filters_by_skill(self):
        docs = [
            {"activity_type": "rhyming", "accuracy": 70.0, "completed_at": datetime(2026, 2, 1, tzinfo=timezone.utc)},
            {"activity_type": "blending", "accuracy": 50.0, "completed_at": datetime(2026, 2, 2, tzinfo=timezone.utc)},
            {"activity_type": "rhyming", "accuracy": 80.0, "completed_at": datetime(2026, 2, 3, tzinfo=timezone.utc)},
        ]
        result = compute_skill_trend(docs, "rhyming")
        assert len(result) == 2
        assert result[0]["accuracy"] == 70.0  # chronological order
        assert result[1]["accuracy"] == 80.0

    def test_respects_limit(self):
        docs = [
            {"activity_type": "rhyming", "accuracy": i * 10.0, "completed_at": datetime(2026, 2, i + 1, tzinfo=timezone.utc)}
            for i in range(15)
        ]
        result = compute_skill_trend(docs, "rhyming", limit=5)
        assert len(result) == 5


class TestComputeVoiceStats:
    def test_empty_list(self):
        result = compute_voice_stats([])
        assert result["total_interactions"] == 0
        assert result["avg_accuracy"] == 0.0
        assert result["success_rate"] == 0.0

    def test_with_interactions(self):
        docs = [
            {"accuracy_score": 0.9, "success_achieved": True},
            {"accuracy_score": 0.6, "success_achieved": False},
            {"accuracy_score": 0.8, "success_achieved": True},
        ]
        result = compute_voice_stats(docs)
        assert result["total_interactions"] == 3
        assert result["avg_accuracy"] == round((0.9 + 0.6 + 0.8) / 3, 2)
        assert result["success_rate"] == round(2 / 3, 2)

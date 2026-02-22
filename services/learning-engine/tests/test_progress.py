"""
Tests for progress.py — pure functions, no mocking needed.
"""

import pytest

from src.progress import (
    DIFFICULTY_SCORE_MAP,
    calculate_progress_update,
    determine_mastery_level,
    generate_pronunciation_feedback,
    generate_rule_based_recommendation,
    score_skill_recommendation,
    should_advance_week,
)


class TestCalculateProgressUpdate:
    def test_high_accuracy_low_progress(self):
        # 90% accuracy, optimal time, low current progress -> 1.5x multiplier
        result = calculate_progress_update(90.0, 300, 10.0)
        # base=9.0, mult=1.5, time=1.1 -> 9*1.5*1.1=14.85, capped at 10.0
        assert result == 10.0

    def test_moderate_accuracy_mid_progress(self):
        # 60% accuracy, optimal time, mid progress -> 1.0x multiplier
        result = calculate_progress_update(60.0, 200, 50.0)
        # base=6.0, mult=1.0, time=1.1 -> 6.6
        assert result == 6.6

    def test_high_accuracy_high_progress(self):
        # 80% accuracy, optimal time, high progress -> 0.7x multiplier
        result = calculate_progress_update(80.0, 300, 80.0)
        # base=8.0, mult=0.7, time=1.1 -> 6.16
        assert result == 6.16

    def test_fast_completion_penalty(self):
        # duration < 75s -> 0.8x time factor
        result = calculate_progress_update(100.0, 30, 0.0)
        # base=10, mult=1.5, time=0.8 -> 12, capped at 10.0
        assert result == 10.0

    def test_slow_completion_penalty(self):
        # duration > 600s -> 0.9x time factor
        result = calculate_progress_update(50.0, 700, 50.0)
        # base=5.0, mult=1.0, time=0.9 -> 4.5
        assert result == 4.5

    def test_zero_accuracy(self):
        result = calculate_progress_update(0.0, 300, 0.0)
        assert result == 0.0

    def test_capped_at_10(self):
        result = calculate_progress_update(100.0, 300, 0.0)
        assert result <= 10.0


class TestDetermineMasteryLevel:
    def test_not_started(self):
        assert determine_mastery_level(0.0) == "not_started"
        assert determine_mastery_level(29.9) == "not_started"

    def test_emerging(self):
        assert determine_mastery_level(30.0) == "emerging"
        assert determine_mastery_level(49.9) == "emerging"

    def test_developing(self):
        assert determine_mastery_level(50.0) == "developing"
        assert determine_mastery_level(69.9) == "developing"

    def test_proficient(self):
        assert determine_mastery_level(70.0) == "proficient"
        assert determine_mastery_level(89.9) == "proficient"

    def test_advanced(self):
        assert determine_mastery_level(90.0) == "advanced"
        assert determine_mastery_level(100.0) == "advanced"


class TestScoreSkillRecommendation:
    def test_basic_scoring(self):
        score = score_skill_recommendation("rhyming", 0.0, 1.0, 1.0)
        assert 0 < score <= 1.0

    def test_higher_need_higher_score(self):
        # Low progress = higher need component
        low_progress = score_skill_recommendation("rhyming", 10.0, 1.0, 1.0)
        high_progress = score_skill_recommendation("rhyming", 90.0, 1.0, 1.0)
        assert low_progress > high_progress

    def test_higher_readiness_higher_score(self):
        ready = score_skill_recommendation("rhyming", 50.0, 1.0, 1.0)
        not_ready = score_skill_recommendation("rhyming", 50.0, 0.0, 1.0)
        assert ready > not_ready

    def test_difficulty_score_map_values(self):
        assert DIFFICULTY_SCORE_MAP["easiest"] > DIFFICULTY_SCORE_MAP["most_difficult"]


class TestGenerateRuleBasedRecommendation:
    def test_week_1_recommends_rhyming(self):
        result = generate_rule_based_recommendation({}, 1)
        assert result["recommended_skill"] == "rhyming"
        assert result["source"] == "rule_based"
        assert result["confidence"] == 0.7

    def test_with_existing_progress(self):
        progress = {"rhyming": 80.0}
        result = generate_rule_based_recommendation(progress, 5)
        assert result["recommended_skill"] in ["rhyming", "onset_fluency", "blending"]

    def test_difficulty_levels(self):
        # Low progress -> easy
        result = generate_rule_based_recommendation({}, 1)
        assert result["difficulty_level"] == "easy"

    def test_all_skills_complete_fallback(self):
        progress = {skill: 100.0 for skill in [
            "rhyming", "onset_fluency", "blending", "isolating",
            "segmenting", "adding", "deleting", "substituting",
        ]}
        result = generate_rule_based_recommendation(progress, 30)
        assert "recommended_skill" in result


class TestShouldAdvanceWeek:
    def test_week_35_never_advances(self):
        assert should_advance_week(35, {}) is False

    def test_all_skills_met(self):
        progress = {"rhyming": 70.0}
        assert should_advance_week(1, progress) is True

    def test_skill_not_met(self):
        progress = {"rhyming": 30.0}
        assert should_advance_week(1, progress) is False

    def test_no_active_skills_advances(self):
        # Week 0 has no active skills
        assert should_advance_week(0, {}) is True


class TestGeneratePronunciationFeedback:
    def test_perfect(self):
        feedback = generate_pronunciation_feedback(0.96)
        assert "Perfect" in feedback

    def test_great(self):
        feedback = generate_pronunciation_feedback(0.88)
        assert "Great" in feedback

    def test_good(self):
        feedback = generate_pronunciation_feedback(0.72)
        assert "Good" in feedback or "closer" in feedback

    def test_nice_effort(self):
        feedback = generate_pronunciation_feedback(0.55)
        assert "try" in feedback.lower()

    def test_keep_practicing(self):
        feedback = generate_pronunciation_feedback(0.3)
        assert "practicing" in feedback.lower()

-- Elemental Genius Curriculum Database Schema
-- Comprehensive curriculum structure for ages 3-10
-- Integrating Heggerty Phonics, STEM, American Values, and Christian Worldview

-- Curriculum Standards and Benchmarks
CREATE TABLE learning_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_code VARCHAR(50) NOT NULL, -- e.g., "RF.K.1", "K.CC.1"
    standard_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    subject_area VARCHAR(50) NOT NULL,
    mastery_criteria JSONB NOT NULL,
    prerequisite_standards JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Curriculum Units (Age-based Learning Stages)
CREATE TABLE curriculum_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_name VARCHAR(100) NOT NULL, -- "Foundation", "Primary", "Intermediate"
    age_range VARCHAR(20) NOT NULL, -- "3-5", "6-8", "9-10"
    grade_equivalent VARCHAR(20),
    description TEXT,
    core_objectives JSONB NOT NULL,
    estimated_duration_weeks INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subject Areas with Integration Points
CREATE TABLE subject_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- "Heggerty Phonics", "STEM", "American Values", "Christian Worldview"
    integration_type VARCHAR(50) NOT NULL, -- "core", "integrated", "supplementary"
    learning_approach VARCHAR(100), -- "systematic", "discovery-based", "character-based"
    ai_adaptation_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Detailed Curriculum Units
CREATE TABLE curriculum_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID REFERENCES curriculum_stages(id),
    subject_area_id UUID REFERENCES subject_areas(id),
    unit_name VARCHAR(255) NOT NULL,
    unit_code VARCHAR(50) NOT NULL, -- "HEG-K-01", "STEM-P-03"
    description TEXT,
    learning_objectives JSONB NOT NULL,
    integration_points JSONB, -- How this unit connects to other subjects
    assessment_methods JSONB,
    estimated_hours INTEGER,
    sequence_order INTEGER,
    prerequisites JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Granular Lessons with AI Guidance
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES curriculum_units(id),
    lesson_title VARCHAR(255) NOT NULL,
    lesson_code VARCHAR(50) NOT NULL,
    learning_objectives JSONB NOT NULL,
    content_structure JSONB NOT NULL, -- Detailed lesson structure
    materials_needed JSONB,
    ai_prompts JSONB NOT NULL, -- AI guidance for adaptive delivery
    assessment_rubrics JSONB,
    differentiation_strategies JSONB,
    estimated_minutes INTEGER,
    lesson_sequence INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Curriculum Guidance System
CREATE TABLE ai_curriculum_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id),
    prompt_type VARCHAR(50) NOT NULL, -- "introduction", "practice", "assessment", "remediation"
    age_group VARCHAR(20) NOT NULL,
    prompt_template TEXT NOT NULL,
    context_variables JSONB, -- Variables to inject into prompts
    adaptation_rules JSONB, -- How to modify based on student performance
    success_criteria JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Heggerty Phonics Specific Structure
CREATE TABLE heggerty_scope_sequence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_number INTEGER NOT NULL,
    age_group VARCHAR(20) NOT NULL,
    skill_focus VARCHAR(100) NOT NULL, -- "Rhyming", "Phoneme Isolation", etc.
    daily_activities JSONB NOT NULL,
    assessment_checkpoints JSONB,
    ai_practice_generators JSONB, -- Prompts for generating practice activities
    mastery_indicators JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- STEM Integration Framework
CREATE TABLE stem_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    age_appropriate_for JSONB NOT NULL, -- Array of age ranges
    science_concepts JSONB,
    technology_integration JSONB,
    engineering_challenges JSONB,
    math_applications JSONB,
    christian_worldview_connections JSONB,
    materials_list JSONB,
    ai_scaffolding_prompts JSONB,
    assessment_rubric JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Character Development & Values Integration
CREATE TABLE character_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_trait VARCHAR(100) NOT NULL, -- "Honesty", "Stewardship", "Courage"
    biblical_foundation TEXT,
    american_values_connection TEXT,
    age_appropriate_activities JSONB,
    real_world_applications JSONB,
    assessment_indicators JSONB,
    ai_discussion_prompts JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student Progress Tracking
CREATE TABLE student_curriculum_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    lesson_id UUID REFERENCES lessons(id),
    completion_status VARCHAR(50) NOT NULL, -- "not_started", "in_progress", "completed", "mastered"
    accuracy_score FLOAT,
    time_spent_minutes INTEGER,
    ai_adaptations_applied JSONB,
    assessment_results JSONB,
    mastery_indicators JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Curriculum Analytics
CREATE TABLE curriculum_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL, -- "engagement", "mastery", "completion", "difficulty"
    lesson_id UUID REFERENCES lessons(id),
    student_demographic VARCHAR(50),
    metric_value FLOAT,
    context_data JSONB,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Parent Dashboard Views
CREATE TABLE parent_curriculum_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    view_type VARCHAR(50) NOT NULL, -- "progress", "upcoming", "assessment", "recommendations"
    curriculum_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_curriculum_stages_age_range ON curriculum_stages(age_range);
CREATE INDEX idx_curriculum_units_stage_id ON curriculum_units(stage_id);
CREATE INDEX idx_curriculum_units_subject_area ON curriculum_units(subject_area_id);
CREATE INDEX idx_lessons_unit_id ON lessons(unit_id);
CREATE INDEX idx_heggerty_week_age ON heggerty_scope_sequence(week_number, age_group);
CREATE INDEX idx_stem_projects_age ON stem_projects USING GIN (age_appropriate_for);
CREATE INDEX idx_student_progress_student ON student_curriculum_progress(student_id);
CREATE INDEX idx_student_progress_lesson ON student_curriculum_progress(lesson_id);
CREATE INDEX idx_curriculum_analytics_lesson ON curriculum_analytics(lesson_id);
CREATE INDEX idx_parent_views_parent_student ON parent_curriculum_views(parent_id, student_id);
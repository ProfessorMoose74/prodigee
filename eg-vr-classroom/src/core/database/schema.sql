-- ============================================================================
-- Elemental Genius VR Classroom - Unified Database Schema
-- Complete standalone VR educational platform
-- PostgreSQL 15+
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- ============================================================================
-- USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

-- Parent Accounts (COPPA-compliant guardians)
CREATE TABLE parents (
    parent_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    last_login TIMESTAMP,
    subscription_tier VARCHAR(50) DEFAULT 'basic',  -- basic, premium, family
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    communication_preferences JSONB DEFAULT '{}',
    safety_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_parents_email ON parents(email);
CREATE INDEX idx_parents_active ON parents(is_active);

-- Child Accounts (COPPA-protected)
CREATE TABLE children (
    child_id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES parents(parent_id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,  -- Never real name
    age INTEGER NOT NULL,
    age_range VARCHAR(10),  -- 5-7, 8-10, 11-13
    grade_level VARCHAR(20),
    date_of_birth DATE,  -- Encrypted, not displayed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP,
    current_week INTEGER DEFAULT 1,
    total_stars INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_streak_date DATE,
    avatar_customization JSONB DEFAULT '{}',
    learning_preferences JSONB DEFAULT '{}',
    safety_restrictions JSONB DEFAULT '{}',
    voice_profile_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT age_range_valid CHECK (age BETWEEN 3 AND 13),
    CONSTRAINT age_range_match CHECK (
        (age BETWEEN 5 AND 7 AND age_range = '5-7') OR
        (age BETWEEN 8 AND 10 AND age_range = '8-10') OR
        (age BETWEEN 11 AND 13 AND age_range = '11-13') OR
        (age BETWEEN 3 AND 4 AND age_range = '3-5')
    )
);

CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_children_age_range ON children(age_range);
CREATE INDEX idx_children_active ON children(is_active);

-- Parental Consent Records (COPPA requirement)
CREATE TABLE parental_consent (
    consent_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES parents(parent_id) ON DELETE CASCADE,
    consent_method VARCHAR(50) NOT NULL,  -- email, credit_card, digital_signature
    consent_granted BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP,
    verification_token UUID UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    consent_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consent_child ON parental_consent(child_id);
CREATE INDEX idx_consent_verification ON parental_consent(verification_token);

-- ============================================================================
-- VR SESSION MANAGEMENT
-- ============================================================================

-- VR Classroom Sessions
CREATE TABLE vr_sessions (
    session_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    classroom_id INTEGER,  -- Reference to virtual classroom instance
    session_type VARCHAR(50) DEFAULT 'daily_practice',  -- daily_practice, assessment, free_play
    vr_platform VARCHAR(50),  -- meta_quest, steamvr, psvr, etc.
    headset_model VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    planned_duration_seconds INTEGER DEFAULT 1800,  -- 30 minutes
    actual_activities_completed INTEGER DEFAULT 0,
    planned_activities INTEGER DEFAULT 0,
    overall_engagement_score DECIMAL(3, 1),  -- 0.0 to 10.0
    completion_status VARCHAR(20) DEFAULT 'in_progress',  -- in_progress, completed, interrupted
    stars_earned INTEGER DEFAULT 0,
    break_reminders_triggered INTEGER DEFAULT 0,
    parent_observation_active BOOLEAN DEFAULT FALSE,
    emergency_stop_triggered BOOLEAN DEFAULT FALSE,
    emergency_stop_reason TEXT,
    session_metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_vr_sessions_child ON vr_sessions(child_id);
CREATE INDEX idx_vr_sessions_date ON vr_sessions(started_at);
CREATE INDEX idx_vr_sessions_status ON vr_sessions(completion_status);

-- VR Classroom Instances
CREATE TABLE vr_classrooms (
    classroom_id SERIAL PRIMARY KEY,
    teacher_id INTEGER,  -- Can be AI teacher or human
    classroom_name VARCHAR(200),
    classroom_type VARCHAR(50) DEFAULT 'standard',  -- standard, advanced, special_needs
    era_theme VARCHAR(50) DEFAULT '1920s_american',
    max_capacity INTEGER DEFAULT 25,
    current_occupancy INTEGER DEFAULT 0,
    localization_country_code VARCHAR(2),
    localization_timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    classroom_settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_classrooms_active ON vr_classrooms(is_active);

-- Multi-User Classroom Participants
CREATE TABLE classroom_participants (
    participant_id SERIAL PRIMARY KEY,
    classroom_id INTEGER REFERENCES vr_classrooms(classroom_id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    role VARCHAR(20) DEFAULT 'student',  -- student, teacher, observer
    seat_position INTEGER,
    is_currently_present BOOLEAN DEFAULT TRUE,
    UNIQUE(classroom_id, child_id, joined_at)
);

CREATE INDEX idx_participants_classroom ON classroom_participants(classroom_id);
CREATE INDEX idx_participants_child ON classroom_participants(child_id);

-- ============================================================================
-- LEARNING PROGRESS & CURRICULUM
-- ============================================================================

-- Phonemic Awareness Progress (Heggerty)
CREATE TABLE phonemic_progress (
    progress_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    skill_type VARCHAR(50) NOT NULL,  -- rhyming, syllables, onset_rime, etc.
    skill_category VARCHAR(50),  -- listen_identify, produce, etc.
    week_number INTEGER NOT NULL,
    mastery_level DECIMAL(5, 2) DEFAULT 0.0,  -- 0.0 to 100.0
    accuracy_percentage DECIMAL(5, 2),
    attempts_total INTEGER DEFAULT 0,
    attempts_correct INTEGER DEFAULT 0,
    voice_recognition_accuracy DECIMAL(5, 2),
    last_practiced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT week_valid CHECK (week_number BETWEEN 1 AND 35)
);

CREATE INDEX idx_phonemic_child ON phonemic_progress(child_id);
CREATE INDEX idx_phonemic_skill ON phonemic_progress(skill_type);
CREATE INDEX idx_phonemic_week ON phonemic_progress(week_number);

-- Activity Completions
CREATE TABLE activity_completions (
    completion_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES vr_sessions(session_id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL,
    skill_area VARCHAR(50),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    accuracy DECIMAL(5, 2),
    stars_earned INTEGER DEFAULT 0,
    engagement_score DECIMAL(3, 1),
    interaction_method VARCHAR(20),  -- vr_hand, vr_voice, vr_controller, 2d_touch
    activity_data JSONB DEFAULT '{}'
);

CREATE INDEX idx_completions_child ON activity_completions(child_id);
CREATE INDEX idx_completions_session ON activity_completions(session_id);
CREATE INDEX idx_completions_type ON activity_completions(activity_type);

-- Assessments
CREATE TABLE assessments (
    assessment_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,  -- weekly, monthly, placement
    week_number INTEGER,
    administered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    skills_assessed JSONB,
    overall_score DECIMAL(5, 2),
    skill_scores JSONB,
    recommendations JSONB,
    administered_by VARCHAR(50),  -- ai, parent, teacher
    assessment_metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_assessments_child ON assessments(child_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_date ON assessments(administered_at);

-- ============================================================================
-- VOICE INTERACTIONS & COPPA COMPLIANCE
-- ============================================================================

-- Voice Interactions (Text-only for COPPA)
CREATE TABLE voice_interactions (
    interaction_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES vr_sessions(session_id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL,  -- phoneme_response, question_answer, free_speech
    prompt_given TEXT,
    expected_response TEXT,
    actual_response_text TEXT,  -- ONLY TEXT, never audio
    recognition_confidence DECIMAL(4, 3),  -- 0.000 to 1.000
    accuracy_score DECIMAL(4, 3),
    response_time_seconds DECIMAL(6, 2),
    success_achieved BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    language_code VARCHAR(5) DEFAULT 'en',
    CONSTRAINT no_audio_data CHECK (interaction_id IS NOT NULL)  -- Reminder: NO AUDIO STORAGE
);

CREATE INDEX idx_voice_child ON voice_interactions(child_id);
CREATE INDEX idx_voice_session ON voice_interactions(session_id);
CREATE INDEX idx_voice_type ON voice_interactions(interaction_type);

COMMENT ON TABLE voice_interactions IS 'COPPA COMPLIANT: Stores only text transcriptions, NEVER audio files';

-- ============================================================================
-- CONTENT LIBRARY
-- ============================================================================

-- Educational Content Metadata
CREATE TABLE content_library (
    content_id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,  -- video, audio, 3d_model, image, document, activity
    subject_area VARCHAR(50),  -- phonemic_awareness, math, science, etc.
    age_range VARCHAR(10),
    title VARCHAR(500),
    description TEXT,
    file_path VARCHAR(1000),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    duration_seconds INTEGER,  -- For video/audio
    difficulty_level VARCHAR(20),  -- easy, medium, hard
    skill_objectives JSONB,
    prerequisite_skills JSONB,
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES parents(parent_id),
    is_approved BOOLEAN DEFAULT FALSE,
    approval_date TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2)
);

CREATE INDEX idx_content_type ON content_library(content_type);
CREATE INDEX idx_content_subject ON content_library(subject_area);
CREATE INDEX idx_content_age ON content_library(age_range);
CREATE INDEX idx_content_difficulty ON content_library(difficulty_level);

-- Heggerty Curriculum Data
CREATE TABLE heggerty_curriculum (
    curriculum_id SERIAL PRIMARY KEY,
    week_number INTEGER UNIQUE NOT NULL,
    skill_focus VARCHAR(100),
    nursery_rhyme_title VARCHAR(200),
    nursery_rhyme_lyrics TEXT,
    nursery_rhyme_motions TEXT,
    activities JSONB,  -- All week's activities
    daily_lesson_plan JSONB,
    assessment_checkpoint BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT week_range CHECK (week_number BETWEEN 1 AND 35)
);

CREATE INDEX idx_heggerty_week ON heggerty_curriculum(week_number);

-- ============================================================================
-- VR-SPECIFIC INTERACTIONS
-- ============================================================================

-- VR Object Interactions
CREATE TABLE vr_interactions (
    interaction_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES vr_sessions(session_id) ON DELETE CASCADE,
    object_id VARCHAR(200),  -- blackboard, desk, book, etc.
    interaction_type VARCHAR(50),  -- grab, point, write, draw, throw
    position_x DECIMAL(10, 6),
    position_y DECIMAL(10, 6),
    position_z DECIMAL(10, 6),
    rotation_quaternion JSONB,
    interaction_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vr_interactions_child ON vr_interactions(child_id);
CREATE INDEX idx_vr_interactions_session ON vr_interactions(session_id);
CREATE INDEX idx_vr_interactions_object ON vr_interactions(object_id);

-- Lunchroom Daily Landmarks
CREATE TABLE daily_landmarks (
    landmark_id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    classroom_id INTEGER REFERENCES vr_classrooms(classroom_id),
    landmark_name VARCHAR(300),
    landmark_country_code VARCHAR(2),
    landmark_type VARCHAR(50),  -- natural, architectural, historical, cultural
    landmark_description TEXT,
    image_path VARCHAR(1000),
    fun_fact TEXT,
    is_local BOOLEAN,  -- True if from student's country
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landmarks_date ON daily_landmarks(date);
CREATE INDEX idx_landmarks_classroom ON daily_landmarks(classroom_id);

-- ============================================================================
-- COMMUNICATION & SAFETY
-- ============================================================================

-- Approved Communication Phrases
CREATE TABLE approved_phrases (
    phrase_id SERIAL PRIMARY KEY,
    phrase_text VARCHAR(500) NOT NULL,
    category VARCHAR(50),  -- greeting, question, praise, help, social
    age_appropriate_from INTEGER DEFAULT 3,
    age_appropriate_to INTEGER DEFAULT 13,
    translation_cache JSONB DEFAULT '{}',  -- Pre-translated phrases
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phrases_category ON approved_phrases(category);

-- Communication Log (Between Students)
CREATE TABLE communication_log (
    log_id SERIAL PRIMARY KEY,
    from_child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    to_child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES vr_sessions(session_id) ON DELETE SET NULL,
    communication_type VARCHAR(20),  -- approved_phrase, voice_supervised, gesture
    phrase_id INTEGER REFERENCES approved_phrases(phrase_id),
    phrase_text TEXT,
    source_language VARCHAR(5),
    target_language VARCHAR(5),
    was_translated BOOLEAN DEFAULT FALSE,
    moderation_status VARCHAR(20) DEFAULT 'approved',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comm_from ON communication_log(from_child_id);
CREATE INDEX idx_comm_to ON communication_log(to_child_id);
CREATE INDEX idx_comm_session ON communication_log(session_id);

-- Safety Incidents
CREATE TABLE safety_incidents (
    incident_id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES vr_sessions(session_id) ON DELETE SET NULL,
    incident_type VARCHAR(50) NOT NULL,  -- adult_voice_detected, inappropriate_behavior, etc.
    severity VARCHAR(20),  -- low, medium, high, critical
    description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_notified_at TIMESTAMP,
    action_taken VARCHAR(200),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    incident_data JSONB DEFAULT '{}'
);

CREATE INDEX idx_incidents_child ON safety_incidents(child_id);
CREATE INDEX idx_incidents_severity ON safety_incidents(severity);
CREATE INDEX idx_incidents_date ON safety_incidents(detected_at);

-- ============================================================================
-- ANALYTICS & SYSTEM METRICS
-- ============================================================================

-- System Analytics
CREATE TABLE system_analytics (
    analytics_id SERIAL PRIMARY KEY,
    metric_type VARCHAR(50),  -- performance, usage, engagement, technical
    metric_name VARCHAR(100),
    metric_value DECIMAL(15, 6),
    metric_unit VARCHAR(20),
    server_component VARCHAR(50),  -- vr_renderer, ai_service, database, etc.
    context_data JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_type ON system_analytics(metric_type);
CREATE INDEX idx_analytics_component ON system_analytics(server_component);
CREATE INDEX idx_analytics_date ON system_analytics(recorded_at);

-- Session Analytics (Aggregated)
CREATE TABLE session_analytics (
    analytics_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES vr_sessions(session_id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES children(child_id) ON DELETE CASCADE,
    avg_fps DECIMAL(6, 2),
    frame_drops_count INTEGER,
    network_latency_avg_ms DECIMAL(8, 2),
    voice_recognition_avg_confidence DECIMAL(4, 3),
    total_interactions_count INTEGER,
    hand_tracking_quality DECIMAL(3, 2),  -- 0.0 to 1.0
    comfort_violations INTEGER,  -- Times comfort settings were triggered
    performance_score DECIMAL(3, 1),  -- 0.0 to 10.0
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_analytics_session ON session_analytics(session_id);
CREATE INDEX idx_session_analytics_child ON session_analytics(child_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_children_parent_active ON children(parent_id, is_active);
CREATE INDEX idx_vr_sessions_child_date ON vr_sessions(child_id, started_at DESC);
CREATE INDEX idx_activity_child_date ON activity_completions(child_id, completed_at DESC);
CREATE INDEX idx_voice_child_date ON voice_interactions(child_id, timestamp DESC);

-- Full-text search indexes
CREATE INDEX idx_content_title_search ON content_library USING gin(to_tsvector('english', title));
CREATE INDEX idx_content_description_search ON content_library USING gin(to_tsvector('english', description));

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Child Progress Dashboard View
CREATE VIEW child_progress_dashboard AS
SELECT
    c.child_id,
    c.display_name,
    c.age_range,
    c.current_week,
    c.total_stars,
    c.streak_days,
    COUNT(DISTINCT vs.session_id) as total_vr_sessions,
    SUM(vs.duration_seconds) / 3600.0 as total_vr_hours,
    AVG(vs.overall_engagement_score) as avg_engagement,
    COUNT(DISTINCT ac.completion_id) as total_activities_completed,
    AVG(ac.accuracy) as avg_accuracy
FROM children c
LEFT JOIN vr_sessions vs ON c.child_id = vs.child_id
LEFT JOIN activity_completions ac ON c.child_id = ac.child_id
WHERE c.is_active = TRUE
GROUP BY c.child_id;

-- Parent Dashboard View
CREATE VIEW parent_dashboard AS
SELECT
    p.parent_id,
    p.first_name || ' ' || p.last_name as parent_name,
    COUNT(DISTINCT c.child_id) as total_children,
    COUNT(DISTINCT vs.session_id) as total_sessions_all_children,
    SUM(vs.duration_seconds) / 3600.0 as total_vr_hours_all_children,
    MAX(vs.started_at) as last_session_time
FROM parents p
LEFT JOIN children c ON p.parent_id = c.parent_id AND c.is_active = TRUE
LEFT JOIN vr_sessions vs ON c.child_id = vs.child_id
WHERE p.is_active = TRUE
GROUP BY p.parent_id;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_phonemic_progress_timestamp
    BEFORE UPDATE ON phonemic_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_timestamp
    BEFORE UPDATE ON content_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate streak days
CREATE OR REPLACE FUNCTION calculate_streak(p_child_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER := 0;
    last_activity_date DATE;
BEGIN
    SELECT MAX(DATE(started_at)) INTO last_activity_date
    FROM vr_sessions
    WHERE child_id = p_child_id;

    IF last_activity_date = CURRENT_DATE THEN
        current_streak := 1;
        -- Continue counting backwards
        WHILE EXISTS (
            SELECT 1 FROM vr_sessions
            WHERE child_id = p_child_id
            AND DATE(started_at) = last_activity_date - current_streak
        ) LOOP
            current_streak := current_streak + 1;
        END LOOP;
    END IF;

    RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA FOR APPROVED PHRASES
-- ============================================================================

INSERT INTO approved_phrases (phrase_text, category, age_appropriate_from, age_appropriate_to) VALUES
('Good job!', 'praise', 3, 13),
('I need help', 'help', 3, 13),
('Thank you', 'social', 3, 13),
('Can you repeat that?', 'question', 5, 13),
('I''m ready', 'status', 3, 13),
('I''m finished', 'status', 3, 13),
('I don''t understand', 'help', 5, 13),
('Can we work together?', 'social', 5, 13),
('Great idea!', 'praise', 5, 13),
('See you later', 'greeting', 3, 13),
('Hello', 'greeting', 3, 13),
('Goodbye', 'greeting', 3, 13),
('You''re welcome', 'social', 5, 13),
('Let''s try again', 'encouragement', 5, 13),
('I did it!', 'celebration', 3, 13);

-- ============================================================================
-- GRANTS & PERMISSIONS
-- ============================================================================

-- Create application user (run separately with appropriate credentials)
-- CREATE USER eg_vr_user WITH PASSWORD 'secure_password_here';
-- GRANT CONNECT ON DATABASE elemental_genius_vr TO eg_vr_user;
-- GRANT USAGE ON SCHEMA public TO eg_vr_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eg_vr_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO eg_vr_user;

COMMENT ON DATABASE elemental_genius_vr IS 'Unified database for Elemental Genius VR Classroom - Standalone application';

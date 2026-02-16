#!/usr/bin/env python3
"""
Elemental Genius Database Setup and Migration Script
Initializes PostgreSQL database with all models and seed data
"""

import os
import sys
import datetime
from flask import Flask
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

# Import the main application to get models
from elemental_genius_backend import app, db, Parent, Child, Progress, Session
from elemental_genius_backend import (PhonemicProgress, LearningSession, VoiceInteraction, 
                                     ContentLibrary, Assessment, SystemAnalytics, 
                                     HeggertyCurriculumData, NurseryRhymeData, heggerty_curriculum)

def create_database():
    """Create the database if it doesn't exist"""
    print("Creating database...")
    
    # Extract database info from URL
    db_url = app.config['SQLALCHEMY_DATABASE_URI']
    if 'postgresql://' in db_url:
        # Create database (PostgreSQL)
        engine = create_engine(db_url.replace('/elemental_genius', '/postgres'))
        with engine.connect() as conn:
            conn.execute(text("COMMIT"))  # End any transaction
            try:
                conn.execute(text("CREATE DATABASE elemental_genius"))
                print("✅ Database 'elemental_genius' created successfully")
            except Exception as e:
                if "already exists" in str(e):
                    print("ℹ️  Database 'elemental_genius' already exists")
                else:
                    print(f"❌ Error creating database: {e}")
    else:
        print("ℹ️  Using SQLite database")

def initialize_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    with app.app_context():
        try:
            db.create_all()
            print("✅ All database tables created successfully")
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False
    return True

def seed_heggerty_curriculum():
    """Populate HeggertyCurriculumData table with curriculum content"""
    print("Seeding Heggerty curriculum data...")
    
    with app.app_context():
        # Check if data already exists
        if HeggertyCurriculumData.query.first():
            print("ℹ️  Heggerty curriculum data already exists")
            return
        
        curriculum_entries = []
        
        # Iterate through all skills and weeks
        for skill_name, skill_data in heggerty_curriculum.SKILL_PROGRESSION.items():
            activities = heggerty_curriculum.ACTIVITY_TEMPLATES.get(skill_name, {})
            
            for week in skill_data['weeks']:
                for activity_type, activity_info in activities.items():
                    entry = HeggertyCurriculumData(
                        skill_name=skill_name,
                        week_number=week,
                        activity_type=activity_type,
                        difficulty_level=skill_data['difficulty'],
                        learning_objectives=[skill_data['description']],
                        activity_instructions=activity_info['instruction'],
                        example_prompts=activity_info.get('examples', []),
                        hand_motions=skill_data.get('hand_motions', ''),
                        assessment_criteria={
                            'interaction_type': activity_info.get('interaction_type', 'voice'),
                            'complexity': activity_info.get('complexity', 'standard')
                        },
                        age_adaptations={
                            '3-5': 'Simplified instructions with visual cues',
                            '6-8': 'Standard instructions with encouragement',
                            '9-12': 'Advanced variations available'
                        },
                        success_metrics={
                            'accuracy_threshold': 70.0,
                            'attempts_before_help': 3,
                            'mastery_requirement': 80.0
                        }
                    )
                    curriculum_entries.append(entry)
        
        # Bulk insert
        db.session.add_all(curriculum_entries)
        db.session.commit()
        print(f"✅ Added {len(curriculum_entries)} Heggerty curriculum entries")

def seed_nursery_rhymes():
    """Populate NurseryRhymeData table with nursery rhyme content"""
    print("Seeding nursery rhyme data...")
    
    with app.app_context():
        # Check if data already exists
        if NurseryRhymeData.query.first():
            print("ℹ️  Nursery rhyme data already exists")
            return
        
        rhyme_entries = []
        
        # Add nursery rhymes from the curriculum
        for week, rhyme_data in heggerty_curriculum.NURSERY_RHYMES.items():
            entry = NurseryRhymeData(
                week_number=week,
                title=rhyme_data['title'],
                full_lyrics=rhyme_data['lyrics'],
                motions_description=rhyme_data['motions'],
                learning_objectives=rhyme_data['concepts'],
                motor_skills_targeted=['hand_coordination', 'rhythm', 'memory'],
                cultural_context=f"Traditional nursery rhyme teaching {', '.join(rhyme_data['concepts'])}",
                rhyming_focus=rhyme_data['rhyming_focus'],
                interactive_elements=['singing', 'hand_motions', 'repetition'],
                age_adaptations={
                    '3-5': 'Focus on simple motions and repetition',
                    '6-8': 'Add discussion about story elements',
                    '9-12': 'Explore cultural and historical context'
                }
            )
            rhyme_entries.append(entry)
        
        # Bulk insert
        db.session.add_all(rhyme_entries)
        db.session.commit()
        print(f"✅ Added {len(rhyme_entries)} nursery rhyme entries")

def seed_content_library():
    """Populate ContentLibrary with educational content"""
    print("Seeding content library...")
    
    with app.app_context():
        # Check if data already exists
        if ContentLibrary.query.first():
            print("ℹ️  Content library data already exists")
            return
        
        content_entries = []
        
        # Phonemic Awareness Content
        for skill in heggerty_curriculum.SKILL_PROGRESSION.keys():
            content_entries.append(ContentLibrary(
                content_type='activity',
                subject_area='phonemic_awareness',
                age_range='3-13',
                skill_objectives=[f"Master {skill.replace('_', ' ')} skills"],
                file_path=f"/content/phonemic/{skill}/",
                difficulty_level='adaptive',
                prerequisite_skills=heggerty_curriculum.SKILL_PROGRESSION[skill]['prerequisites'],
                content_metadata={
                    'skill_type': skill,
                    'heggerty_based': True,
                    'interactive': True,
                    'voice_enabled': True
                }
            ))
        
        # Multi-subject placeholders (to be expanded)
        subjects = [
            ('math', 'Mathematics'),
            ('science', 'Science'),
            ('astronomy', 'Astronomy'),
            ('geography', 'Geography'),
            ('language_arts', 'Language Arts')
        ]
        
        for subject_key, subject_name in subjects:
            for age_range in ['3-5', '6-8', '9-12', '13+']:
                content_entries.append(ContentLibrary(
                    content_type='lesson',
                    subject_area=subject_key,
                    age_range=age_range,
                    skill_objectives=[f"Age-appropriate {subject_name} learning"],
                    file_path=f"/content/{subject_key}/{age_range}/",
                    difficulty_level='standard',
                    content_metadata={
                        'subject': subject_name,
                        'age_appropriate': True,
                        'multimedia': True
                    }
                ))
        
        # Bulk insert
        db.session.add_all(content_entries)
        db.session.commit()
        print(f"✅ Added {len(content_entries)} content library entries")

def create_demo_data():
    """Create demo parent and child accounts for testing"""
    print("Creating demo data...")
    
    with app.app_context():
        # Check if demo data already exists
        if Parent.query.filter_by(email='demo@elementalgenius.com').first():
            print("ℹ️  Demo data already exists")
            return
        
        # Create demo parent
        demo_parent = Parent(
            name='Demo Parent',
            email='demo@elementalgenius.com',
            subscription_tier='premium',
            communication_preferences={
                'email_notifications': True,
                'daily_summary': True,
                'milestone_alerts': True
            },
            monitoring_settings={
                'real_time_alerts': True,
                'session_start_notify': True,
                'achievement_celebration': True
            }
        )
        demo_parent.set_password('demo123')
        db.session.add(demo_parent)
        db.session.flush()  # Get the ID
        
        # Create demo child
        demo_child = Child(
            parent_id=demo_parent.id,
            name='Demo Child',
            age=5,
            grade_level='Pre-K',
            learning_style='mixed',
            current_week=1,
            skill_strengths=['rhyming', 'listening'],
            skill_challenges=['segmenting']
        )
        db.session.add(demo_child)
        db.session.flush()  # Get the ID
        
        # Create initial progress
        demo_progress = Progress(
            child_id=demo_child.id,
            rhyming=25.0,
            onset_fluency=10.0,
            learning_velocity=1.2,
            attention_span_minutes=8,
            preferred_interaction_mode='voice'
        )
        db.session.add(demo_progress)
        
        # Create demo session
        demo_session = Session(
            child_id=demo_child.id,
            activity_type='rhyming',
            accuracy=85.0,
            duration=420,  # 7 minutes
            stars_earned=3,
            engagement=9.2
        )
        db.session.add(demo_session)
        
        db.session.commit()
        print("✅ Demo data created successfully")
        print(f"   Demo Parent: demo@elementalgenius.com / demo123")
        print(f"   Demo Child: {demo_child.name} (ID: {demo_child.id})")

def create_indexes():
    """Create database indexes for performance"""
    print("Creating database indexes...")
    
    with app.app_context():
        try:
            # Create indexes for commonly queried fields
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_child_parent_id ON child(parent_id)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_session_child_id ON session(child_id)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_phonemic_progress_child_id ON phonemic_progress(child_id)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_voice_interactions_child_id ON voice_interactions(child_id)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_learning_sessions_child_id ON learning_sessions(child_id)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_assessments_child_id ON assessments(child_id)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_heggerty_curriculum_week ON heggerty_curriculum(week_number)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_nursery_rhymes_week ON nursery_rhymes(week_number)"))
            db.engine.execute(text("CREATE INDEX IF NOT EXISTS idx_content_library_subject_age ON content_library(subject_area, age_range)"))
            
            print("✅ Database indexes created successfully")
        except Exception as e:
            print(f"⚠️  Some indexes may already exist: {e}")

def main():
    """Main setup function"""
    print("🚀 Elemental Genius Database Setup")
    print("=" * 50)
    
    # Step 1: Create database
    create_database()
    
    # Step 2: Initialize tables
    if not initialize_tables():
        print("❌ Failed to create tables. Exiting.")
        sys.exit(1)
    
    # Step 3: Seed curriculum data
    seed_heggerty_curriculum()
    
    # Step 4: Seed nursery rhymes
    seed_nursery_rhymes()
    
    # Step 5: Seed content library
    seed_content_library()
    
    # Step 6: Create demo data
    create_demo_data()
    
    # Step 7: Create indexes
    create_indexes()
    
    print("=" * 50)
    print("✅ Database setup completed successfully!")
    print("🎓 Elemental Genius is ready for educational magic!")

if __name__ == '__main__':
    main()
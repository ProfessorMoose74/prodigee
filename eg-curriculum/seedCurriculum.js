// Elemental Genius Curriculum Database Seeder
// Populates database with comprehensive curriculum data

const fs = require('fs').promises;
const path = require('path');

class CurriculumSeeder {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger || console;
        this.seedData = {
            stages: [],
            subjectAreas: [],
            units: [],
            lessons: [],
            heggertyData: [],
            stemProjects: [],
            characterTraits: []
        };
    }

    // Main seeding orchestrator
    async seedAll() {
        try {
            this.logger.info('Starting curriculum database seeding...');
            
            // Seed in dependency order
            await this.seedStages();
            await this.seedSubjectAreas();
            await this.seedCurriculumUnits();
            await this.seedLessons();
            await this.seedHeggertyData();
            await this.seedSTEMProjects();
            await this.seedCharacterDevelopment();
            await this.seedAIPrompts();
            
            this.logger.info('Curriculum seeding completed successfully!');
            return { success: true, message: 'All curriculum data seeded successfully' };
        } catch (error) {
            this.logger.error('Error during curriculum seeding:', error);
            throw error;
        }
    }

    // Seed curriculum stages
    async seedStages() {
        this.logger.info('Seeding curriculum stages...');
        
        const stages = [
            {
                stage_name: 'Foundation Stage',
                age_range: '3-5',
                grade_equivalent: 'Pre-K',
                description: 'Readiness skills, basic phonemic awareness, number sense, character introduction',
                core_objectives: {
                    literacy: [
                        'Phonemic awareness development',
                        'Letter recognition',
                        'Print concepts',
                        'Vocabulary building'
                    ],
                    math: [
                        'Number recognition 1-20',
                        'Basic shapes',
                        'Counting skills',
                        'Simple patterns'
                    ],
                    science: [
                        'Nature observation',
                        'Simple experiments',
                        'Basic safety',
                        'Living vs non-living'
                    ],
                    character: [
                        'Kindness',
                        'Obedience',
                        'Thankfulness',
                        'Sharing'
                    ]
                },
                estimated_duration_weeks: 36
            },
            {
                stage_name: 'Primary Stage',
                age_range: '6-8',
                grade_equivalent: 'K-2',
                description: 'Reading fluency, mathematical thinking, civic awareness, moral development',
                core_objectives: {
                    literacy: [
                        'Phonics mastery',
                        'Reading fluency',
                        'Comprehension strategies',
                        'Written expression basics'
                    ],
                    math: [
                        'Addition/subtraction mastery',
                        'Place value',
                        'Problem solving',
                        'Measurement and data'
                    ],
                    science: [
                        'Scientific method',
                        'Life cycles',
                        'Matter properties',
                        'Earth and space basics'
                    ],
                    civics: [
                        'Community helpers',
                        'Rules and laws',
                        'American symbols',
                        'Democratic principles'
                    ],
                    character: [
                        'Honesty',
                        'Responsibility',
                        'Service to others',
                        'Courage'
                    ]
                },
                estimated_duration_weeks: 108
            },
            {
                stage_name: 'Intermediate Foundation',
                age_range: '9-10',
                grade_equivalent: 'Grades 3-5',
                description: 'Academic mastery, critical thinking, leadership development, deeper faith understanding',
                core_objectives: {
                    literacy: [
                        'Complex phonetic patterns',
                        'Advanced comprehension',
                        'Research and report writing',
                        'Literary analysis introduction'
                    ],
                    math: [
                        'Multiplication/division mastery',
                        'Fractions and decimals',
                        'Advanced problem solving',
                        'Data analysis'
                    ],
                    science: [
                        'Advanced scientific method',
                        'Systems thinking',
                        'Environmental science',
                        'Technology integration'
                    ],
                    socialStudies: [
                        'American history depth',
                        'Geography mastery',
                        'Government structure',
                        'Economic principles'
                    ],
                    character: [
                        'Integrity',
                        'Leadership',
                        'Stewardship',
                        'Justice'
                    ]
                },
                estimated_duration_weeks: 72
            }
        ];

        for (const stage of stages) {
            const result = await this.db.curriculum_stages.create(stage);
            this.seedData.stages.push(result);
        }

        this.logger.info(`Seeded ${stages.length} curriculum stages`);
    }

    // Seed subject areas
    async seedSubjectAreas() {
        this.logger.info('Seeding subject areas...');
        
        const subjects = [
            {
                name: 'Heggerty Phonics',
                integration_type: 'core',
                learning_approach: 'systematic',
                ai_adaptation_enabled: true
            },
            {
                name: 'STEM Integration',
                integration_type: 'core',
                learning_approach: 'discovery-based',
                ai_adaptation_enabled: true
            },
            {
                name: 'American Values',
                integration_type: 'integrated',
                learning_approach: 'character-based',
                ai_adaptation_enabled: true
            },
            {
                name: 'Christian Worldview',
                integration_type: 'integrated',
                learning_approach: 'character-based',
                ai_adaptation_enabled: true
            },
            {
                name: 'Mathematics',
                integration_type: 'core',
                learning_approach: 'systematic',
                ai_adaptation_enabled: true
            },
            {
                name: 'Language Arts',
                integration_type: 'core',
                learning_approach: 'balanced-literacy',
                ai_adaptation_enabled: true
            }
        ];

        for (const subject of subjects) {
            const result = await this.db.subject_areas.create(subject);
            this.seedData.subjectAreas.push(result);
        }

        this.logger.info(`Seeded ${subjects.length} subject areas`);
    }

    // Seed Heggerty phonics curriculum from JSON
    async seedHeggertyData() {
        this.logger.info('Seeding Heggerty phonics data...');
        
        try {
            // Load Heggerty data from JSON file
            const heggertyPath = path.join(__dirname, 'heggerty_scope_sequence.json');
            const heggertyContent = await fs.readFile(heggertyPath, 'utf-8');
            const heggertyData = JSON.parse(heggertyContent);

            // Process each week
            for (const week of heggertyData.weeks) {
                const weekData = {
                    week_number: week.week_number,
                    age_group: week.age_group,
                    skill_focus: week.skill_focus,
                    daily_activities: week.daily_activities,
                    assessment_checkpoints: week.assessment_checkpoints || {},
                    ai_practice_generators: week.ai_practice_generators || {},
                    mastery_indicators: {
                        mastery: week.assessment_checkpoints?.mastery_criteria,
                        intervention: week.assessment_checkpoints?.intervention_trigger,
                        extension: week.assessment_checkpoints?.extension_activities
                    }
                };

                const result = await this.db.heggerty_scope_sequence.create(weekData);
                this.seedData.heggertyData.push(result);
            }

            this.logger.info(`Seeded ${heggertyData.weeks.length} weeks of Heggerty curriculum`);
        } catch (error) {
            this.logger.error('Error seeding Heggerty data:', error);
            throw error;
        }
    }

    // Seed STEM projects from JSON
    async seedSTEMProjects() {
        this.logger.info('Seeding STEM projects...');
        
        try {
            // Load STEM data from JSON file
            const stemPath = path.join(__dirname, 'stem_curriculum.json');
            const stemContent = await fs.readFile(stemPath, 'utf-8');
            const stemData = JSON.parse(stemContent);

            // Process each project
            for (const project of stemData.projects) {
                const projectData = {
                    project_name: project.project_name,
                    age_appropriate_for: project.age_appropriate_for,
                    science_concepts: project.science_concepts,
                    technology_integration: project.technology_integration,
                    engineering_challenges: project.engineering_challenges,
                    math_applications: project.math_applications,
                    christian_worldview_connections: project.christian_worldview_connections,
                    materials_list: project.materials_list,
                    ai_scaffolding_prompts: project.ai_scaffolding_prompts,
                    assessment_rubric: project.assessment_rubric
                };

                const result = await this.db.stem_projects.create(projectData);
                this.seedData.stemProjects.push(result);
            }

            this.logger.info(`Seeded ${stemData.projects.length} STEM projects`);
        } catch (error) {
            this.logger.error('Error seeding STEM projects:', error);
            throw error;
        }
    }

    // Seed character development curriculum
    async seedCharacterDevelopment() {
        this.logger.info('Seeding character development curriculum...');
        
        try {
            // Load character data from JSON file
            const characterPath = path.join(__dirname, 'character_values_curriculum.json');
            const characterContent = await fs.readFile(characterPath, 'utf-8');
            const characterData = JSON.parse(characterContent);

            // Process each character trait
            for (const trait of characterData.character_traits) {
                const traitData = {
                    character_trait: trait.character_trait,
                    biblical_foundation: trait.biblical_foundation,
                    american_values_connection: trait.american_values_connection,
                    age_appropriate_activities: trait.age_appropriate_activities,
                    real_world_applications: trait.real_world_applications,
                    assessment_indicators: trait.assessment_indicators,
                    ai_discussion_prompts: trait.ai_discussion_prompts
                };

                const result = await this.db.character_lessons.create(traitData);
                this.seedData.characterTraits.push(result);
            }

            this.logger.info(`Seeded ${characterData.character_traits.length} character traits`);
        } catch (error) {
            this.logger.error('Error seeding character development:', error);
            throw error;
        }
    }

    // Seed curriculum units
    async seedCurriculumUnits() {
        this.logger.info('Seeding curriculum units...');
        
        // Get stage and subject IDs
        const foundationStage = this.seedData.stages.find(s => s.stage_name === 'Foundation Stage');
        const primaryStage = this.seedData.stages.find(s => s.stage_name === 'Primary Stage');
        const intermediateStage = this.seedData.stages.find(s => s.stage_name === 'Intermediate Foundation');
        
        const heggertySubject = this.seedData.subjectAreas.find(s => s.name === 'Heggerty Phonics');
        const stemSubject = this.seedData.subjectAreas.find(s => s.name === 'STEM Integration');
        const mathSubject = this.seedData.subjectAreas.find(s => s.name === 'Mathematics');

        const units = [
            // Foundation Stage Units
            {
                stage_id: foundationStage.id,
                subject_area_id: heggertySubject.id,
                unit_name: 'Phonemic Awareness Foundations',
                unit_code: 'HEG-F-01',
                description: 'Introduction to sounds and phonemic awareness',
                learning_objectives: [
                    'Recognize and produce rhymes',
                    'Count syllables in words',
                    'Identify initial sounds',
                    'Blend simple sounds'
                ],
                integration_points: {
                    math: 'Counting syllables reinforces number concepts',
                    character: 'Patience and perseverance in learning'
                },
                assessment_methods: ['Observation', 'Verbal response', 'Game-based assessment'],
                estimated_hours: 180,
                sequence_order: 1,
                prerequisites: []
            },
            {
                stage_id: foundationStage.id,
                subject_area_id: stemSubject.id,
                unit_name: 'Science Discovery Through Play',
                unit_code: 'STEM-F-01',
                description: 'Hands-on exploration of basic scientific concepts',
                learning_objectives: [
                    'Observe and describe natural phenomena',
                    'Make predictions and test them',
                    'Use simple tools for investigation',
                    'Record observations through drawing'
                ],
                integration_points: {
                    math: 'Measurement and counting in experiments',
                    literacy: 'Science vocabulary development',
                    character: 'Wonder and stewardship of creation'
                },
                assessment_methods: ['Project portfolio', 'Observation logs', 'Parent reports'],
                estimated_hours: 120,
                sequence_order: 1,
                prerequisites: []
            },
            // Primary Stage Units
            {
                stage_id: primaryStage.id,
                subject_area_id: heggertySubject.id,
                unit_name: 'Systematic Phonics Mastery',
                unit_code: 'HEG-P-01',
                description: 'Complete phonics instruction for reading fluency',
                learning_objectives: [
                    'Master all phoneme manipulation skills',
                    'Decode CVC and CVCC words',
                    'Read with increasing fluency',
                    'Apply phonics to spelling'
                ],
                integration_points: {
                    literacy: 'Direct application to reading and writing',
                    character: 'Diligence and attention to detail'
                },
                assessment_methods: ['DIBELS assessments', 'Running records', 'Spelling tests'],
                estimated_hours: 360,
                sequence_order: 1,
                prerequisites: ['HEG-F-01']
            },
            {
                stage_id: primaryStage.id,
                subject_area_id: mathSubject.id,
                unit_name: 'Mathematical Foundations',
                unit_code: 'MATH-P-01',
                description: 'Building strong number sense and operations',
                learning_objectives: [
                    'Master addition and subtraction facts',
                    'Understand place value to 1000',
                    'Solve word problems',
                    'Work with time and money'
                ],
                integration_points: {
                    stem: 'Mathematical thinking in experiments',
                    realLife: 'Shopping and time management'
                },
                assessment_methods: ['Timed fact tests', 'Problem-solving rubrics', 'Project assessments'],
                estimated_hours: 360,
                sequence_order: 1,
                prerequisites: []
            },
            // Intermediate Stage Units
            {
                stage_id: intermediateStage.id,
                subject_area_id: stemSubject.id,
                unit_name: 'Advanced STEM Integration',
                unit_code: 'STEM-I-01',
                description: 'Complex projects integrating all STEM disciplines',
                learning_objectives: [
                    'Design and conduct controlled experiments',
                    'Use technology for research and presentation',
                    'Apply engineering design process',
                    'Analyze data mathematically'
                ],
                integration_points: {
                    allSubjects: 'STEM connects to all areas of learning',
                    character: 'Innovation, perseverance, and ethical considerations'
                },
                assessment_methods: ['Science fair projects', 'Engineering portfolios', 'Research papers'],
                estimated_hours: 240,
                sequence_order: 1,
                prerequisites: ['STEM-P-01']
            }
        ];

        for (const unit of units) {
            const result = await this.db.curriculum_units.create(unit);
            this.seedData.units.push(result);
        }

        this.logger.info(`Seeded ${units.length} curriculum units`);
    }

    // Seed individual lessons
    async seedLessons() {
        this.logger.info('Seeding individual lessons...');
        
        // Get a sample unit to attach lessons to
        const sampleUnit = this.seedData.units[0];
        
        const lessons = [
            {
                unit_id: sampleUnit.id,
                lesson_title: 'Introduction to Rhyming',
                lesson_code: 'HEG-F-01-L01',
                learning_objectives: [
                    'Identify rhyming words',
                    'Recognize rhyme patterns',
                    'Enjoy rhyming games'
                ],
                content_structure: {
                    warmup: {
                        duration: 2,
                        activities: ['Rhyme song', 'Name rhymes']
                    },
                    instruction: {
                        duration: 5,
                        content: 'Explicit teaching of rhyme concept',
                        materials: ['Picture cards', 'Rhyming books']
                    },
                    practice: {
                        duration: 5,
                        activities: ['Rhyme matching game', 'Rhyme production']
                    },
                    closure: {
                        duration: 3,
                        activities: ['Rhyme celebration', 'Preview tomorrow']
                    }
                },
                materials_needed: ['Rhyming picture cards', 'Nursery rhyme books', 'Puppet'],
                ai_prompts: {
                    introduction: 'Generate engaging rhyme introduction for [AGE] year old',
                    practice: 'Create rhyming word pairs appropriate for [LEVEL]',
                    assessment: 'Design quick rhyme check for [STUDENT_NAME]'
                },
                assessment_rubrics: {
                    emerging: 'Recognizes some rhymes with support',
                    developing: 'Identifies most rhyming pairs',
                    proficient: 'Consistently identifies and produces rhymes'
                },
                differentiation_strategies: {
                    support: 'Use concrete objects and pictures',
                    challenge: 'Create original rhyming sentences'
                },
                estimated_minutes: 15,
                lesson_sequence: 1
            },
            {
                unit_id: sampleUnit.id,
                lesson_title: 'Rhyme Production Practice',
                lesson_code: 'HEG-F-01-L02',
                learning_objectives: [
                    'Generate rhyming words',
                    'Complete rhyming patterns',
                    'Create simple rhymes'
                ],
                content_structure: {
                    warmup: {
                        duration: 2,
                        activities: ['Review yesterday\'s rhymes']
                    },
                    instruction: {
                        duration: 5,
                        content: 'Model rhyme production',
                        materials: ['Word family cards']
                    },
                    practice: {
                        duration: 6,
                        activities: ['Rhyme chains', 'Silly rhyme creation']
                    },
                    closure: {
                        duration: 2,
                        activities: ['Share favorite rhyme']
                    }
                },
                materials_needed: ['Word family cards', 'Whiteboard', 'Markers'],
                ai_prompts: {
                    introduction: 'Create rhyme production warm-up for [STUDENT_NAME]',
                    practice: 'Generate word families for rhyme practice',
                    extension: 'Design creative rhyming challenges'
                },
                assessment_rubrics: {
                    emerging: 'Produces 1-2 rhymes with help',
                    developing: 'Produces 3-4 rhymes independently',
                    proficient: 'Freely generates multiple rhymes'
                },
                differentiation_strategies: {
                    support: 'Provide rhyme starters',
                    challenge: 'Create rhyming stories'
                },
                estimated_minutes: 15,
                lesson_sequence: 2
            }
        ];

        for (const lesson of lessons) {
            const result = await this.db.lessons.create(lesson);
            this.seedData.lessons.push(result);
        }

        this.logger.info(`Seeded ${lessons.length} sample lessons`);
    }

    // Seed AI curriculum prompts
    async seedAIPrompts() {
        this.logger.info('Seeding AI curriculum prompts...');
        
        // Get a sample lesson
        const sampleLesson = this.seedData.lessons[0];
        
        const prompts = [
            {
                lesson_id: sampleLesson.id,
                prompt_type: 'introduction',
                age_group: '3-5',
                prompt_template: `Create an engaging introduction to [TOPIC] for a [AGE]-year-old student named [STUDENT_NAME]. 
                Include:
                - A fun hook or attention-grabber
                - Connection to something familiar
                - Clear learning goal in child-friendly language
                - Excitement about what they'll learn
                Keep language simple and enthusiasm high.`,
                context_variables: ['TOPIC', 'AGE', 'STUDENT_NAME'],
                adaptation_rules: {
                    attention_low: 'Make introduction shorter and more interactive',
                    attention_high: 'Add more detail and complexity',
                    visual_learner: 'Include descriptions of pictures or objects',
                    kinesthetic_learner: 'Add movement suggestions'
                },
                success_criteria: {
                    engagement: 'Student shows interest and asks questions',
                    comprehension: 'Student can restate learning goal',
                    readiness: 'Student is prepared for instruction'
                }
            },
            {
                lesson_id: sampleLesson.id,
                prompt_type: 'practice',
                age_group: '3-5',
                prompt_template: `Generate practice activities for [SKILL] appropriate for [STUDENT_NAME] who is [LEVEL]. 
                Create:
                - 3 practice items increasing in difficulty
                - Clear instructions for each item
                - Positive feedback for correct responses
                - Gentle correction for errors
                - Celebration moment at the end`,
                context_variables: ['SKILL', 'STUDENT_NAME', 'LEVEL'],
                adaptation_rules: {
                    struggling: 'Simplify tasks and add more support',
                    succeeding: 'Increase challenge and reduce scaffolding',
                    frustrated: 'Add encouragement and break into smaller steps'
                },
                success_criteria: {
                    accuracy: '70% or higher correct responses',
                    independence: 'Completes with minimal prompting',
                    confidence: 'Shows willingness to try'
                }
            },
            {
                lesson_id: sampleLesson.id,
                prompt_type: 'assessment',
                age_group: '3-5',
                prompt_template: `Create a quick assessment for [SKILL] to evaluate [STUDENT_NAME]'s understanding. 
                Include:
                - 3-5 assessment items
                - Mix of difficulty levels
                - Clear success indicators
                - Rubric for evaluation
                - Next steps based on performance`,
                context_variables: ['SKILL', 'STUDENT_NAME'],
                adaptation_rules: {
                    anxious: 'Frame as game or fun activity',
                    confident: 'Include challenge questions',
                    tired: 'Reduce number of items'
                },
                success_criteria: {
                    validity: 'Accurately measures intended skill',
                    reliability: 'Consistent results',
                    actionable: 'Provides clear next steps'
                }
            },
            {
                lesson_id: sampleLesson.id,
                prompt_type: 'remediation',
                age_group: '3-5',
                prompt_template: `Design remediation activities for [STUDENT_NAME] who is struggling with [SKILL]. 
                Previous errors: [ERRORS]
                Create:
                - Targeted reteaching approach
                - Concrete examples and non-examples
                - Scaffolded practice opportunities
                - Success checkpoints
                - Encouragement and motivation strategies`,
                context_variables: ['STUDENT_NAME', 'SKILL', 'ERRORS'],
                adaptation_rules: {
                    multiple_attempts: 'Try different modality or approach',
                    partial_understanding: 'Focus on specific gaps',
                    lack_foundation: 'Review prerequisite skills'
                },
                success_criteria: {
                    improvement: 'Shows progress from baseline',
                    understanding: 'Can explain concept',
                    application: 'Uses skill correctly'
                }
            }
        ];

        for (const prompt of prompts) {
            await this.db.ai_curriculum_prompts.create(prompt);
        }

        this.logger.info(`Seeded ${prompts.length} AI curriculum prompts`);
    }

    // Utility method to verify seeding
    async verifySeedData() {
        this.logger.info('Verifying seed data...');
        
        const counts = {
            stages: await this.db.curriculum_stages.count(),
            subjectAreas: await this.db.subject_areas.count(),
            units: await this.db.curriculum_units.count(),
            lessons: await this.db.lessons.count(),
            heggertyWeeks: await this.db.heggerty_scope_sequence.count(),
            stemProjects: await this.db.stem_projects.count(),
            characterTraits: await this.db.character_lessons.count(),
            aiPrompts: await this.db.ai_curriculum_prompts.count()
        };

        this.logger.info('Database seed counts:', counts);
        return counts;
    }

    // Reset database (use with caution)
    async resetDatabase() {
        this.logger.warn('Resetting curriculum database...');
        
        // Delete in reverse dependency order
        await this.db.ai_curriculum_prompts.destroy({ where: {} });
        await this.db.lessons.destroy({ where: {} });
        await this.db.curriculum_units.destroy({ where: {} });
        await this.db.character_lessons.destroy({ where: {} });
        await this.db.stem_projects.destroy({ where: {} });
        await this.db.heggerty_scope_sequence.destroy({ where: {} });
        await this.db.subject_areas.destroy({ where: {} });
        await this.db.curriculum_stages.destroy({ where: {} });
        
        this.logger.info('Database reset complete');
    }

    // Partial seeding for specific components
    async seedComponent(component) {
        switch (component) {
            case 'heggerty':
                await this.seedHeggertyData();
                break;
            case 'stem':
                await this.seedSTEMProjects();
                break;
            case 'character':
                await this.seedCharacterDevelopment();
                break;
            case 'stages':
                await this.seedStages();
                break;
            case 'subjects':
                await this.seedSubjectAreas();
                break;
            default:
                throw new Error(`Unknown component: ${component}`);
        }
    }
}

// Export for use in other modules
module.exports = CurriculumSeeder;

// CLI interface if run directly
if (require.main === module) {
    const seeder = new CurriculumSeeder(require('./db'), console);
    
    const command = process.argv[2];
    
    switch (command) {
        case 'seed':
            seeder.seedAll()
                .then(() => {
                    console.log('Seeding completed successfully');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Seeding failed:', error);
                    process.exit(1);
                });
            break;
            
        case 'reset':
            seeder.resetDatabase()
                .then(() => {
                    console.log('Database reset successfully');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Reset failed:', error);
                    process.exit(1);
                });
            break;
            
        case 'verify':
            seeder.verifySeedData()
                .then(counts => {
                    console.log('Verification complete:', counts);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Verification failed:', error);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('Usage: node seedCurriculum.js [seed|reset|verify]');
            process.exit(1);
    }
}
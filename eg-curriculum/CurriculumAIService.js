// Elemental Genius Curriculum AI Service
// Provides AI-enhanced adaptive learning and curriculum delivery

class CurriculumAIService {
    constructor(openAIClient, curriculumRepository, studentRepository) {
        this.ai = openAIClient;
        this.curriculum = curriculumRepository;
        this.students = studentRepository;
        this.promptTemplates = new Map();
        this.loadPromptTemplates();
    }

    // Initialize prompt templates for different educational contexts
    loadPromptTemplates() {
        this.promptTemplates.set('system_base', this.getSystemBasePrompt());
        this.promptTemplates.set('heggerty_phonics', this.getHeggertyPrompt());
        this.promptTemplates.set('stem_project', this.getSTEMPrompt());
        this.promptTemplates.set('character_development', this.getCharacterPrompt());
    }

    getSystemBasePrompt() {
        return `You are an expert educational AI tutor for the Elemental Genius program, 
        specializing in integrated curriculum delivery for children ages 3-10. 

        CORE EDUCATIONAL PILLARS:
        1. Heggerty Phonics - Systematic, explicit phonics instruction
        2. STEM Integration - Hands-on discovery and problem-solving
        3. American Values - Civic responsibility and patriotic heritage
        4. Christian Worldview - Biblical principles and character development

        INSTRUCTION PRINCIPLES:
        - Use age-appropriate language and examples
        - Integrate multiple learning modalities (visual, auditory, kinesthetic)
        - Connect learning to real-world applications
        - Reinforce Christian values naturally within content
        - Celebrate American heritage and civic responsibility
        - Build on previous knowledge systematically
        - Provide multiple entry points for different learning styles
        - Include formative assessment opportunities
        - Maintain encouraging and positive tone
        - Adapt to individual student needs and pace`;
    }

    getHeggertyPrompt() {
        return `HEGGERTY PHONEMIC AWARENESS METHODOLOGY:
        - Follow systematic skill progression
        - Use 8-minute focused lessons
        - Include multi-sensory approaches
        - Provide explicit instruction with modeling
        - Incorporate hand motions and gestures
        - Build from simple to complex skills
        - Include immediate corrective feedback
        - Celebrate small victories
        
        SKILL PROGRESSION ORDER:
        1. Rhyming (recognition → production)
        2. Syllables (counting → blending → segmenting)
        3. Onset-Rime (blending → segmenting)
        4. Phoneme Isolation (initial → final → medial)
        5. Phoneme Blending (CVC → CVCC → multisyllabic)
        6. Phoneme Segmentation (CVC → CVCC → multisyllabic)
        7. Phoneme Addition (initial → final → medial)
        8. Phoneme Deletion (initial → final → medial)
        9. Phoneme Substitution (initial → final → medial)`;
    }

    getSTEMPrompt() {
        return `STEM PROJECT METHODOLOGY:
        - Follow engineering design process
        - Integrate all four STEM components
        - Connect to Christian worldview (God's design in creation)
        - Include American innovation examples
        - Provide hands-on experimentation
        - Emphasize process over product
        - Encourage iteration and improvement
        - Document observations and data
        - Celebrate creative problem-solving
        
        INTEGRATION REQUIREMENTS:
        - Science: Observation, hypothesis, testing
        - Technology: Tools and digital resources
        - Engineering: Design, build, improve
        - Mathematics: Measurement, data, patterns`;
    }

    getCharacterPrompt() {
        return `CHARACTER DEVELOPMENT APPROACH:
        - Ground all traits in biblical foundation
        - Connect to American civic virtues
        - Use concrete, relatable examples
        - Include historical role models
        - Provide practical application opportunities
        - Encourage family involvement
        - Celebrate growth over perfection
        - Build habits through repetition
        
        KEY CHARACTER TRAITS:
        - Honesty, Courage, Responsibility
        - Kindness, Perseverance, Respect
        - Self-Control, Gratitude, Justice
        - Compassion, Integrity, Stewardship`;
    }

    // Main lesson generation method
    async generateAdaptiveLesson(studentId, lessonId, adaptationLevel = 'standard') {
        try {
            const student = await this.students.getStudentProfile(studentId);
            const lesson = await this.curriculum.getLessonWithContext(lessonId);
            
            const systemPrompt = this.buildSystemPrompt(lesson, student);
            const contentPrompt = this.buildContentPrompt(lesson, student, adaptationLevel);

            const response = await this.ai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: contentPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            return this.formatLessonResponse(response.choices[0].message.content, lesson, student);
        } catch (error) {
            console.error('Error generating adaptive lesson:', error);
            throw error;
        }
    }

    buildSystemPrompt(lesson, student) {
        const basePrompt = this.promptTemplates.get('system_base');
        const subjectPrompt = this.getSubjectSpecificPrompt(lesson.subjectArea);
        
        return `${basePrompt}

        STUDENT PROFILE:
        - Name: ${student.name}
        - Age: ${student.age}
        - Grade Level: ${student.gradeLevel}
        - Learning Style: ${student.learningStyle}
        - Current Skill Level: ${student.currentLevel}
        - Strengths: ${JSON.stringify(student.strengths)}
        - Areas for Growth: ${JSON.stringify(student.challenges)}
        - Interests: ${JSON.stringify(student.interests)}
        - Previous Mastery: ${JSON.stringify(student.masteredSkills)}
        - Preferred Pace: ${student.learningPace}
        
        LESSON CONTEXT:
        - Subject: ${lesson.subjectArea}
        - Unit: ${lesson.unitName}
        - Lesson: ${lesson.lessonTitle}
        - Duration: ${lesson.estimatedMinutes} minutes
        - Objectives: ${JSON.stringify(lesson.learningObjectives)}
        - Prerequisites: ${JSON.stringify(lesson.prerequisites)}
        - Materials: ${JSON.stringify(lesson.materialsNeeded)}
        
        ${subjectPrompt}`;
    }

    buildContentPrompt(lesson, student, adaptationLevel) {
        const adaptations = this.getAdaptationStrategies(student, adaptationLevel);
        
        return `Generate a complete ${lesson.estimatedMinutes}-minute lesson for ${student.name} covering: ${lesson.lessonTitle}

        LESSON COMPONENTS NEEDED:
        1. Warm-Up/Hook (2-3 minutes)
           - Activate prior knowledge
           - Create excitement and engagement
           - Connect to student's interests: ${student.interests.join(', ')}
        
        2. Direct Instruction (40% of time)
           - Clear explanation of new concepts
           - Multiple examples and non-examples
           - Visual, auditory, and kinesthetic elements
           - Check for understanding questions
        
        3. Guided Practice (30% of time)
           - Step-by-step practice with support
           - Gradual release of responsibility
           - Immediate feedback opportunities
           - Error correction strategies
        
        4. Independent Practice (20% of time)
           - Age-appropriate challenges
           - Differentiated activities based on: ${adaptationLevel}
           - Self-assessment opportunities
        
        5. Closure & Assessment (10% of time)
           - Review key concepts
           - Quick formative assessment
           - Preview next lesson
           - Celebration of learning
        
        ADAPTATIONS:
        ${JSON.stringify(adaptations)}
        
        Please provide specific activities, questions, and examples appropriate for a ${student.age}-year-old student.`;
    }

    getSubjectSpecificPrompt(subjectArea) {
        switch (subjectArea.toLowerCase()) {
            case 'phonics':
            case 'heggerty':
                return this.promptTemplates.get('heggerty_phonics');
            case 'stem':
            case 'science':
            case 'engineering':
                return this.promptTemplates.get('stem_project');
            case 'character':
            case 'values':
                return this.promptTemplates.get('character_development');
            default:
                return '';
        }
    }

    getAdaptationStrategies(student, level) {
        const strategies = {
            below_level: [
                "Reduce complexity of tasks",
                "Provide additional visual supports",
                "Break instructions into smaller steps",
                "Offer more practice opportunities",
                "Use concrete manipulatives",
                "Increase wait time for responses",
                "Provide sentence starters",
                "Focus on foundational skills"
            ],
            standard: [
                "Follow grade-level expectations",
                "Balance challenge and support",
                "Provide choice in activities",
                "Include extension opportunities",
                "Maintain standard pacing"
            ],
            above_level: [
                "Increase complexity and depth",
                "Add creative challenges",
                "Include research opportunities",
                "Provide leadership roles",
                "Integrate cross-curricular connections",
                "Encourage peer teaching",
                "Add open-ended problems"
            ]
        };

        return strategies[level] || strategies.standard;
    }

    // Heggerty-specific phonics instruction generation
    async generatePhonicsInstruction(studentId, weekNumber, skillFocus) {
        const student = await this.students.getStudentProfile(studentId);
        const phonicsData = await this.curriculum.getHeggertyWeek(weekNumber);
        const phonicsProfile = await this.students.getPhonicsProgress(studentId);

        const prompt = `Generate an 8-minute Heggerty phonics lesson for ${student.name} (age ${student.age}).

        WEEK ${weekNumber} - SKILL FOCUS: ${skillFocus}
        
        STUDENT PHONICS PROFILE:
        - Mastered Skills: ${JSON.stringify(phonicsProfile.masteredSkills)}
        - Current Working Level: ${phonicsProfile.currentLevel}
        - Areas Needing Support: ${JSON.stringify(phonicsProfile.challenges)}
        - Preferred Learning Style: ${student.learningStyle}
        - Attention Span: ${student.attentionSpan} minutes
        
        LESSON STRUCTURE (8 minutes total):
        1. Warm-Up Review (1 minute)
           - Quick review of previous skill
           - Success celebration
        
        2. Skill Introduction (2 minutes)
           - Explicit instruction of ${skillFocus}
           - Clear modeling with hand motions
           - Visual and auditory examples
        
        3. Guided Practice (3 minutes)
           - Teacher-led practice
           - Immediate error correction
           - Positive reinforcement
           - Use these example words: ${JSON.stringify(phonicsData.exampleWords)}
        
        4. Independent Application (1.5 minutes)
           - Student demonstrates skill
           - Multiple practice items
        
        5. Quick Assessment (30 seconds)
           - 3-5 assessment items
           - Celebration of effort
        
        Include:
        - Specific hand motions for each activity
        - Exact words and sentences to use
        - Error correction language
        - Positive reinforcement phrases
        - Transition statements between activities`;

        const response = await this.ai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: this.getSystemBasePrompt() + '\n\n' + this.getHeggertyPrompt() },
                { role: "user", content: prompt }
            ],
            temperature: 0.3 // Lower temperature for systematic phonics
        });

        return this.formatPhonicsLesson(response.choices[0].message.content, weekNumber, skillFocus);
    }

    // STEM Project Generation
    async generateSTEMProject(studentId, projectId, currentUnit) {
        const student = await this.students.getStudentProfile(studentId);
        const project = await this.curriculum.getSTEMProject(projectId);
        const stemProfile = await this.students.getSTEMProgress(studentId);

        const prompt = `Create a hands-on STEM project implementation for ${student.name} (age ${student.age}).

        PROJECT: ${project.projectName}
        DURATION: ${project.durationDays} days
        
        STUDENT STEM PROFILE:
        - Previous Projects: ${JSON.stringify(stemProfile.completedProjects)}
        - Skill Levels: ${JSON.stringify(stemProfile.skillLevels)}
        - Interests: ${student.interests.filter(i => ['science', 'building', 'nature', 'technology'].includes(i))}
        
        PROJECT COMPONENTS:
        Science Concepts: ${JSON.stringify(project.scienceConcepts)}
        Technology Tools: ${JSON.stringify(project.technologyIntegration)}
        Engineering Challenges: ${JSON.stringify(project.engineeringChallenges)}
        Math Applications: ${JSON.stringify(project.mathApplications)}
        
        CHRISTIAN WORLDVIEW CONNECTIONS:
        ${JSON.stringify(project.christianWorldviewConnections)}
        
        AVAILABLE MATERIALS:
        ${JSON.stringify(project.materialsList)}
        
        Generate:
        1. Day-by-day project plan with specific activities
        2. Age-appropriate explanations of concepts
        3. Hands-on experiments and building challenges
        4. Data collection templates
        5. Discussion questions connecting to faith
        6. Safety considerations
        7. Parent involvement suggestions
        8. Assessment checkpoints
        9. Celebration ideas for project completion
        
        Ensure all activities are safe, engaging, and educational for a ${student.age}-year-old.`;

        const response = await this.ai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: this.getSystemBasePrompt() + '\n\n' + this.getSTEMPrompt() },
                { role: "user", content: prompt }
            ],
            temperature: 0.6
        });

        return this.formatSTEMProject(response.choices[0].message.content, project);
    }

    // Character Development Lesson Generation
    async generateCharacterLesson(studentId, characterTrait, weekNumber) {
        const student = await this.students.getStudentProfile(studentId);
        const traitData = await this.curriculum.getCharacterTrait(characterTrait);
        const characterProgress = await this.students.getCharacterProgress(studentId);

        const prompt = `Create a character development lesson for ${student.name} (age ${student.age}) on ${characterTrait}.

        WEEK ${weekNumber} OF CHARACTER STUDY
        
        BIBLICAL FOUNDATION:
        ${traitData.biblicalFoundation}
        
        AMERICAN VALUES CONNECTION:
        ${traitData.americanValuesConnection}
        
        STUDENT CHARACTER PROFILE:
        - Previous Character Focus: ${JSON.stringify(characterProgress.previousTraits)}
        - Demonstrated Strengths: ${JSON.stringify(characterProgress.strengths)}
        - Growth Areas: ${JSON.stringify(characterProgress.growthAreas)}
        - Family Values: ${JSON.stringify(student.familyValues)}
        
        LESSON COMPONENTS:
        1. Biblical Story or Principle (age-appropriate retelling)
        2. American Historical Example (hero story demonstrating trait)
        3. Personal Application Activities:
           - Role-playing scenarios
           - Real-world practice opportunities
           - Family discussion questions
        4. Character Action Plan (concrete steps to practice trait)
        5. Progress Tracking Ideas
        
        AGE-APPROPRIATE ACTIVITIES:
        ${JSON.stringify(traitData.ageAppropriateActivities[student.ageGroup])}
        
        Make the lesson:
        - Concrete and practical for a ${student.age}-year-old
        - Include specific examples from child's daily life
        - Provide clear action steps
        - Include family involvement ideas
        - Create memorable learning through stories and activities`;

        const response = await this.ai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: this.getSystemBasePrompt() + '\n\n' + this.getCharacterPrompt() },
                { role: "user", content: prompt }
            ],
            temperature: 0.5
        });

        return this.formatCharacterLesson(response.choices[0].message.content, characterTrait);
    }

    // Assessment Generation
    async generateAssessment(studentId, subject, assessmentType) {
        const student = await this.students.getStudentProfile(studentId);
        const currentUnit = await this.students.getCurrentUnit(studentId, subject);
        
        const prompt = `Create a ${assessmentType} assessment for ${student.name} (age ${student.age}) in ${subject}.

        ASSESSMENT TYPE: ${assessmentType}
        CURRENT UNIT: ${currentUnit.name}
        LEARNING OBJECTIVES: ${JSON.stringify(currentUnit.objectives)}
        
        STUDENT PROFILE:
        - Current Mastery Level: ${student.masteryLevels[subject]}
        - Recent Performance: ${JSON.stringify(student.recentScores)}
        - Preferred Response Format: ${student.assessmentPreferences}
        
        Generate:
        1. 5-10 assessment items appropriate for ${assessmentType}
        2. Mix of question types (multiple choice, short answer, performance)
        3. Clear success criteria
        4. Rubric for evaluation
        5. Accommodations based on student needs
        
        Ensure assessment is:
        - Fair and unbiased
        - Aligned to objectives
        - Appropriate difficulty for student level
        - Includes variety of DOK levels
        - Provides opportunity to demonstrate learning`;

        const response = await this.ai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: this.getSystemBasePrompt() },
                { role: "user", content: prompt }
            ],
            temperature: 0.4
        });

        return this.formatAssessment(response.choices[0].message.content, assessmentType);
    }

    // Parent Communication Generation
    async generateParentUpdate(studentId, period) {
        const student = await this.students.getStudentProfile(studentId);
        const progress = await this.students.getPeriodProgress(studentId, period);
        
        const prompt = `Generate a parent update for ${student.name}'s learning progress.

        REPORTING PERIOD: ${period}
        
        PROGRESS SUMMARY:
        - Phonics/Reading: ${progress.phonics}
        - Mathematics: ${progress.math}
        - STEM Projects: ${progress.stem}
        - Character Development: ${progress.character}
        
        ACHIEVEMENTS:
        ${JSON.stringify(progress.achievements)}
        
        AREAS OF GROWTH:
        ${JSON.stringify(progress.growthAreas)}
        
        Generate:
        1. Positive opening celebrating successes
        2. Specific examples of learning
        3. Areas where child excelled
        4. Gentle notes on areas for continued focus
        5. Suggestions for home support
        6. Upcoming learning preview
        7. Encouragement for family involvement
        
        Tone should be:
        - Encouraging and positive
        - Specific with examples
        - Partnership-focused
        - Celebratory of growth
        - Constructive about challenges`;

        const response = await this.ai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a caring educational assistant providing parent updates. Be encouraging, specific, and helpful." },
                { role: "user", content: prompt }
            ],
            temperature: 0.6
        });

        return this.formatParentUpdate(response.choices[0].message.content, student, period);
    }

    // Formatting methods for different response types
    formatLessonResponse(content, lesson, student) {
        return {
            lessonId: lesson.id,
            studentId: student.id,
            adaptedContent: content,
            estimatedDuration: lesson.estimatedMinutes,
            materials: lesson.materialsNeeded,
            objectives: lesson.learningObjectives,
            generatedAt: new Date().toISOString(),
            adaptationLevel: this.determineAdaptationLevel(student)
        };
    }

    formatPhonicsLesson(content, weekNumber, skillFocus) {
        return {
            weekNumber,
            skillFocus,
            lessonContent: content,
            duration: 8,
            lessonType: 'heggerty_phonics',
            generatedAt: new Date().toISOString()
        };
    }

    formatSTEMProject(content, project) {
        return {
            projectId: project.id,
            projectName: project.projectName,
            implementation: content,
            materials: project.materialsList,
            duration: project.durationDays,
            generatedAt: new Date().toISOString()
        };
    }

    formatCharacterLesson(content, trait) {
        return {
            characterTrait: trait,
            lessonContent: content,
            lessonType: 'character_development',
            generatedAt: new Date().toISOString()
        };
    }

    formatAssessment(content, type) {
        return {
            assessmentType: type,
            assessmentContent: content,
            generatedAt: new Date().toISOString()
        };
    }

    formatParentUpdate(content, student, period) {
        return {
            studentId: student.id,
            studentName: student.name,
            period,
            updateContent: content,
            generatedAt: new Date().toISOString()
        };
    }

    determineAdaptationLevel(student) {
        const avgMastery = Object.values(student.masteryLevels).reduce((a, b) => a + b, 0) / Object.values(student.masteryLevels).length;
        
        if (avgMastery < 0.6) return 'below_level';
        if (avgMastery > 0.85) return 'above_level';
        return 'standard';
    }

    // Progress tracking and analytics
    async analyzeStudentProgress(studentId) {
        const student = await this.students.getStudentProfile(studentId);
        const allProgress = await this.students.getAllProgress(studentId);
        
        const analysis = {
            studentId,
            overallProgress: this.calculateOverallProgress(allProgress),
            subjectAnalysis: this.analyzeBySubject(allProgress),
            strengthAreas: this.identifyStrengths(allProgress),
            growthAreas: this.identifyGrowthAreas(allProgress),
            recommendations: await this.generateRecommendations(student, allProgress),
            predictedTrajectory: this.predictTrajectory(allProgress)
        };

        return analysis;
    }

    calculateOverallProgress(progress) {
        // Implementation for overall progress calculation
        const totalPoints = progress.reduce((sum, p) => sum + p.score, 0);
        const maxPoints = progress.length * 100;
        return (totalPoints / maxPoints * 100).toFixed(1);
    }

    analyzeBySubject(progress) {
        // Group and analyze progress by subject
        const subjects = {};
        progress.forEach(p => {
            if (!subjects[p.subject]) {
                subjects[p.subject] = {
                    scores: [],
                    average: 0,
                    trend: 'stable'
                };
            }
            subjects[p.subject].scores.push(p.score);
        });

        Object.keys(subjects).forEach(subject => {
            const scores = subjects[subject].scores;
            subjects[subject].average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            subjects[subject].trend = this.calculateTrend(scores);
        });

        return subjects;
    }

    calculateTrend(scores) {
        if (scores.length < 3) return 'insufficient_data';
        const recent = scores.slice(-3);
        const older = scores.slice(-6, -3);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg + 5) return 'improving';
        if (recentAvg < olderAvg - 5) return 'declining';
        return 'stable';
    }

    identifyStrengths(progress) {
        // Identify areas where student excels
        const subjectScores = {};
        progress.forEach(p => {
            if (!subjectScores[p.subject]) subjectScores[p.subject] = [];
            subjectScores[p.subject].push(p.score);
        });

        return Object.keys(subjectScores)
            .filter(subject => {
                const avg = subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length;
                return avg >= 85;
            })
            .map(subject => ({
                subject,
                averageScore: (subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length).toFixed(1)
            }));
    }

    identifyGrowthAreas(progress) {
        // Identify areas needing improvement
        const subjectScores = {};
        progress.forEach(p => {
            if (!subjectScores[p.subject]) subjectScores[p.subject] = [];
            subjectScores[p.subject].push(p.score);
        });

        return Object.keys(subjectScores)
            .filter(subject => {
                const avg = subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length;
                return avg < 70;
            })
            .map(subject => ({
                subject,
                averageScore: (subjectScores[subject].reduce((a, b) => a + b, 0) / subjectScores[subject].length).toFixed(1),
                suggestedInterventions: this.getSuggestedInterventions(subject)
            }));
    }

    getSuggestedInterventions(subject) {
        const interventions = {
            phonics: [
                "Additional phonemic awareness practice",
                "One-on-one reading time",
                "Phonics games and apps",
                "Letter-sound correspondence review"
            ],
            math: [
                "Manipulative-based learning",
                "Extra practice with basic facts",
                "Visual problem-solving strategies",
                "Real-world application activities"
            ],
            stem: [
                "Hands-on experiments",
                "Building and construction projects",
                "Nature exploration",
                "Simple coding activities"
            ],
            character: [
                "Role-playing scenarios",
                "Character trait discussions",
                "Service opportunities",
                "Positive behavior reinforcement"
            ]
        };

        return interventions[subject] || ["Targeted practice", "Additional support", "Modified assignments"];
    }

    async generateRecommendations(student, progress) {
        const prompt = `Based on this student progress data, generate 3-5 specific recommendations:
        
        Student Age: ${student.age}
        Learning Style: ${student.learningStyle}
        Recent Progress: ${JSON.stringify(progress.slice(-10))}
        
        Provide actionable recommendations for:
        1. Next learning steps
        2. Areas to focus on
        3. Enrichment opportunities
        4. Parent support strategies`;

        const response = await this.ai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are an educational consultant providing specific, actionable recommendations." },
                { role: "user", content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 500
        });

        return response.choices[0].message.content;
    }

    predictTrajectory(progress) {
        // Simple trajectory prediction based on recent trends
        if (progress.length < 5) return 'insufficient_data';
        
        const recentScores = progress.slice(-5).map(p => p.score);
        const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        
        if (avgRecent >= 85) return 'exceeding_expectations';
        if (avgRecent >= 70) return 'on_track';
        if (avgRecent >= 55) return 'needs_support';
        return 'intensive_support_recommended';
    }
}

module.exports = CurriculumAIService;